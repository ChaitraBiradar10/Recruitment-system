package com.git.recruitment.controller;

import com.git.recruitment.dto.DTOs.*;
import com.git.recruitment.model.Resume;
import com.git.recruitment.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

// ══════════════════════════════════════════════════════════════
// AUTH CONTROLLER
// ══════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestPart(name = "registerData") RegisterRequest req,
            @RequestPart(name = "resume", required = false) MultipartFile resume) {
        ApiResponse r = authService.register(req, resume);
        return r.isSuccess() ? ResponseEntity.ok(r) : ResponseEntity.badRequest().body(r);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            return ResponseEntity.ok(authService.login(req));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        ApiResponse response = authService.forgotPassword(req);
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse> checkEmail(@RequestParam String email) {
        boolean valid = email.endsWith("@students.git.edu");
        return ResponseEntity.ok(valid ? ApiResponse.ok("Valid") : ApiResponse.error("Only @students.git.edu allowed"));
    }
}

// ══════════════════════════════════════════════════════════════
// STUDENT CONTROLLER
// ══════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
class StudentController {
    private final StudentService studentService;

    @GetMapping("/profile")
    public ResponseEntity<StudentProfileResponse> getProfile(@AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(studentService.getProfile(u.getUsername()));
    }

    @PutMapping("/profile")
    public ResponseEntity<StudentProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetails u,
            @RequestBody ProfileUpdateRequest req) {
        return ResponseEntity.ok(studentService.updateProfile(u.getUsername(), req));
    }

    @PostMapping("/resume")
    public ResponseEntity<?> uploadResume(
            @AuthenticationPrincipal UserDetails u,
            @RequestParam("file") MultipartFile file) {
        try {
            ResumeInfo info = studentService.uploadResume(u.getUsername(), file);
            return ResponseEntity.ok(ApiResponse.ok("Resume uploaded successfully", info));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/resume/download")
    public ResponseEntity<byte[]> downloadResume(@AuthenticationPrincipal UserDetails u) {
        try {
            StudentProfileResponse p = studentService.getProfile(u.getUsername());
            if (p.getResume() == null) return ResponseEntity.notFound().build();
            byte[] data = studentService.downloadResume(u.getUsername());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(p.getResume().getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + p.getResume().getOriginalFileName() + "\"")
                    .body(data);
        } catch (Exception e) { return ResponseEntity.internalServerError().build(); }
    }
}

// ══════════════════════════════════════════════════════════════
// JOB CONTROLLER (shared - student + admin)
// ══════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
class JobController {
    private final JobService jobService;

    // Student: view active jobs
    @GetMapping("/active")
    public ResponseEntity<List<JobResponse>> getActiveJobs(@AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(jobService.getActiveJobs(u.getUsername()));
    }

    // Student: apply for a job
    @PostMapping("/{id}/apply")
    public ResponseEntity<?> apply(@AuthenticationPrincipal UserDetails u, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Application submitted!", jobService.applyForJob(u.getUsername(), id)));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Student: my applications
    @GetMapping("/my-applications")
    public ResponseEntity<List<ApplicationResponse>> myApplications(@AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(jobService.getMyApplications(u.getUsername()));
    }

    // Student: view round scheduling for an application
    @GetMapping("/applications/{id}/rounds")
    public ResponseEntity<RoundSchedulingView> getRoundScheduling(@PathVariable Long id, @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(jobService.getRoundSchedulingView(id));
    }
}

// ══════════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ══════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
class AdminController {
    private final AdminService adminService;
    private final JobService jobService;
    private final StudentService studentService;

    // Dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> dashboard() { return ResponseEntity.ok(adminService.getDashboardStats()); }

    // Students
    @GetMapping("/students")
    public ResponseEntity<List<AdminStudentView>> allStudents() { return ResponseEntity.ok(adminService.getAllStudents()); }

    @GetMapping("/students/selected")
    public ResponseEntity<List<AdminStudentView>> selectedStudents() { return ResponseEntity.ok(adminService.getSelectedStudents()); }

    @GetMapping("/students/{id}")
    public ResponseEntity<AdminStudentView> student(@PathVariable Long id) { return ResponseEntity.ok(adminService.getStudentById(id)); }

    @GetMapping("/registrations/pending")
    public ResponseEntity<List<AdminStudentView>> pending() { return ResponseEntity.ok(adminService.getPendingRegistrations()); }

    @PostMapping("/registrations/{id}/approve")
    public ResponseEntity<ApiResponse> approveReg(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Approved. Email sent.", adminService.approveRegistration(id)));
    }

    @PostMapping("/registrations/{id}/reject")
    public ResponseEntity<ApiResponse> rejectReg(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Rejected. Student notified.", adminService.rejectRegistration(id)));
    }

    @PostMapping("/cv/{id}/shortlist")
    public ResponseEntity<ApiResponse> shortlistCV(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("CV shortlisted. Email sent.", adminService.shortlistCV(id)));
    }

    @PostMapping("/cv/{id}/reject")
    public ResponseEntity<ApiResponse> rejectCV(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("CV rejected. Student notified.", adminService.rejectCV(id)));
    }

    @PostMapping("/cv/{id}/review")
    public ResponseEntity<ApiResponse> reviewCV(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Marked under review.", adminService.markUnderReview(id)));
    }

    @GetMapping("/students/{id}/resume/download")
    public ResponseEntity<byte[]> downloadResume(@PathVariable Long id) {
        try {
            Resume r = studentService.getResumeEntity(id);
            byte[] data = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(r.getFilePath()));
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(r.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + r.getOriginalFileName() + "\"")
                    .body(data);
        } catch (Exception e) { return ResponseEntity.notFound().build(); }
    }

    // Jobs management
    @GetMapping("/jobs")
    public ResponseEntity<List<JobResponse>> allJobs() { return ResponseEntity.ok(jobService.getAllJobsAdmin()); }

    @PostMapping("/jobs")
    public ResponseEntity<ApiResponse> createJob(@Valid @RequestBody JobRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Job created.", jobService.createJob(req)));
    }

    @PutMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse> updateJob(@PathVariable Long id, @Valid @RequestBody JobRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Job updated.", jobService.updateJob(id, req)));
    }

    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id); return ResponseEntity.ok(ApiResponse.ok("Job deleted."));
    }

    // Job applications
    @GetMapping("/jobs/{id}/applicants")
    public ResponseEntity<List<ApplicationResponse>> applicants(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getApplicantsByJob(id));
    }

    @PostMapping("/applications/{id}/aptitude/schedule")
    public ResponseEntity<ApiResponse> scheduleAptitude(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Aptitude scheduled.", jobService.scheduleAptitude(id)));
    }

    @PostMapping("/applications/{id}/aptitude/result")
    public ResponseEntity<ApiResponse> aptitudeResult(@PathVariable Long id, @RequestBody AptitudeResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Aptitude result recorded.", jobService.recordAptitudeResult(id, req)));
    }

    @PostMapping("/applications/{id}/interview/schedule")
    public ResponseEntity<ApiResponse> scheduleInterview(@PathVariable Long id, @RequestBody InterviewScheduleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Interview scheduled. Email sent.", jobService.scheduleInterview(id, req)));
    }

    @PostMapping("/applications/{id}/interview/result")
    public ResponseEntity<ApiResponse> interviewResult(@PathVariable Long id, @RequestBody InterviewResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Result recorded.", jobService.recordInterviewResult(id, req)));
    }

    @PostMapping("/applications/{id}/reject")
    public ResponseEntity<ApiResponse> rejectApplicant(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Applicant rejected.", jobService.rejectApplication(id)));
    }

    // Round scheduling
    @GetMapping("/applications/{id}/rounds")
    public ResponseEntity<RoundSchedulingView> getRoundScheduling(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getRoundSchedulingView(id));
    }

    @PostMapping("/applications/{id}/rounds/schedule")
    public ResponseEntity<ApiResponse> scheduleRound(@PathVariable Long id, @RequestBody InterviewRoundRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Round scheduled.", jobService.scheduleRound(id, req)));
    }

    @PostMapping("/applications/{id}/rounds/{roundId}/result")
    public ResponseEntity<ApiResponse> recordRoundResult(@PathVariable Long id, @PathVariable Long roundId, @RequestBody RoundResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Round result recorded.", jobService.recordRoundResult(id, roundId, req)));
    }

    @PostMapping("/applications/{id}/final-decision")
    public ResponseEntity<ApiResponse> finalizeRoundProcess(@PathVariable Long id, @RequestBody FinalDecisionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Final decision recorded.", jobService.finalizeRoundProcess(id, req)));
    }
}

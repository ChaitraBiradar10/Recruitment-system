package com.git.recruitment.service;

import com.git.recruitment.dto.DTOs.*;
import com.git.recruitment.model.*;
import com.git.recruitment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class JobService {
    private static final String ROUND_LOCATION_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9 .,#:/()\\-]+$";

    private final JobRepository jobRepository;
    private final JobApplicationRepository appRepository;
    private final InterviewRoundRepository roundRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // ── Admin: Create Job ─────────────────────────────────────
    @Transactional
    public JobResponse createJob(JobRequest req) {
        Job job = Job.builder()
                .title(req.getTitle()).companyName(req.getCompanyName())
                .description(req.getDescription()).location(req.getLocation())
                .jobType(req.getJobType()).salaryPackage(req.getSalaryPackage())
                .eligibleBranches(req.getEligibleBranches()).eligibleBatches(req.getEligibleBatches()).minimumCgpa(req.getMinimumCgpa())
                .skills(req.getSkills()).applicationDeadline(req.getApplicationDeadline())
                .totalPositions(req.getTotalPositions())
                .numberOfRounds(req.getNumberOfRounds() != null ? req.getNumberOfRounds() : 2)
                .status(req.getStatus() != null ? Job.JobStatus.valueOf(req.getStatus()) : Job.JobStatus.ACTIVE)
                .build();
        return toJobResponse(jobRepository.save(job), null);
    }

    // ── Admin: Update Job ─────────────────────────────────────
    @Transactional
    public JobResponse updateJob(Long id, JobRequest req) {
        Job job = getJob(id);
        if (req.getTitle()              != null) job.setTitle(req.getTitle());
        if (req.getCompanyName()        != null) job.setCompanyName(req.getCompanyName());
        if (req.getDescription()        != null) job.setDescription(req.getDescription());
        if (req.getLocation()           != null) job.setLocation(req.getLocation());
        if (req.getJobType()            != null) job.setJobType(req.getJobType());
        if (req.getSalaryPackage()      != null) job.setSalaryPackage(req.getSalaryPackage());
        if (req.getEligibleBranches()   != null) job.setEligibleBranches(req.getEligibleBranches());
        if (req.getEligibleBatches()    != null) job.setEligibleBatches(req.getEligibleBatches());
        if (req.getMinimumCgpa()        != null) job.setMinimumCgpa(req.getMinimumCgpa());
        if (req.getSkills()             != null) job.setSkills(req.getSkills());
        if (req.getApplicationDeadline()!= null) job.setApplicationDeadline(req.getApplicationDeadline());
        if (req.getTotalPositions()     != null) job.setTotalPositions(req.getTotalPositions());
        if (req.getNumberOfRounds()     != null) job.setNumberOfRounds(req.getNumberOfRounds());
        if (req.getStatus()             != null) job.setStatus(Job.JobStatus.valueOf(req.getStatus()));
        return toJobResponse(jobRepository.save(job), null);
    }

    // ── Admin: Delete Job ─────────────────────────────────────
    @Transactional
    public void deleteJob(Long id) { jobRepository.deleteById(id); }

    // ── Admin: Get All Jobs ───────────────────────────────────
    public List<JobResponse> getAllJobsAdmin() {
        return jobRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(j -> toJobResponse(j, null)).collect(Collectors.toList());
    }

    // ── Student: Get Active Jobs ──────────────────────────────
    public List<JobResponse> getActiveJobs(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        return jobRepository.findByStatusOrderByCreatedAtDesc(Job.JobStatus.ACTIVE).stream()
                .map(j -> {
                    boolean applied = user != null && appRepository.existsByUserAndJob(user, j);
                    String myStatus = null;
                    if (applied && user != null) {
                        myStatus = appRepository.findByUserAndJob(user, j)
                                .map(a -> a.getStatus().name()).orElse(null);
                    }
                    return toJobResponse(j, applied ? myStatus : null);
                }).collect(Collectors.toList());
    }

    // ── Student: Apply for Job ────────────────────────────────
    @Transactional
    public ApplicationResponse applyForJob(String email, Long jobId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Job job = getJob(jobId);

        if (appRepository.existsByUserAndJob(user, job))
            throw new IllegalStateException("You have already applied for this job.");
        if (getEffectiveJobStatus(job) != Job.JobStatus.ACTIVE)
            throw new IllegalStateException("This job is no longer accepting applications.");
        if (!isBatchEligible(job, user))
            throw new IllegalStateException("This job is not available for your batch year.");

        JobApplication app = JobApplication.builder()
                .user(user).job(job).status(JobApplication.AppStatus.APPLIED).build();
        appRepository.save(app);
        emailService.sendJobApplicationConfirmation(user, job);
        return toAppResponse(app);
    }

    // ── Student: My Applications ──────────────────────────────
    @Transactional
    public List<ApplicationResponse> getMyApplications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return appRepository.findByUserOrderByAppliedAtDesc(user).stream()
                .map(this::toAppResponse).collect(Collectors.toList());
    }

    // ── Admin: Get Applicants for a Job ──────────────────────
        @Transactional
        public List<ApplicationResponse> getApplicantsByJob(Long jobId) {
        Job job = getJob(jobId);
        return appRepository.findByJobOrderByAppliedAtDesc(job).stream()
                .map(this::toAppResponseAdmin).collect(Collectors.toList());
    }

    // ── Admin: Update Application Status ─────────────────────
    @Transactional
    public ApplicationResponse updateApplicationStatus(Long appId, String status) {
        JobApplication app = getApp(appId);
        app.setStatus(JobApplication.AppStatus.valueOf(status));
        return toAppResponse(appRepository.save(app));
    }

    // ── Admin: Schedule Aptitude Test ────────────────────────
    @Transactional
    public ApplicationResponse scheduleAptitude(Long appId) {
        JobApplication app = getApp(appId);
        app.setStatus(JobApplication.AppStatus.APTITUDE_SCHEDULED);
        return toAppResponse(appRepository.save(app));
    }

    // ── Admin: Record Aptitude Result ────────────────────────
    @Transactional
    public ApplicationResponse recordAptitudeResult(Long appId, AptitudeResultRequest req) {
        JobApplication app = getApp(appId);
        app.setAptitudeCleared(req.getCleared());
        app.setAptitudeScore(req.getScore());
        app.setStatus(req.getCleared()
                ? JobApplication.AppStatus.APTITUDE_CLEARED
                : JobApplication.AppStatus.APTITUDE_FAILED);
        return toAppResponse(appRepository.save(app));
    }

    // ── Admin: Schedule Interview ─────────────────────────────
    @Transactional
    public ApplicationResponse scheduleInterview(Long appId, InterviewScheduleRequest req) {
        JobApplication app = getApp(appId);
        app.setInterviewDate(req.getInterviewDate());
        app.setInterviewTime(req.getInterviewTime());
        app.setInterviewMode(req.getInterviewMode());
        app.setStatus(JobApplication.AppStatus.INTERVIEW_SCHEDULED);
        appRepository.save(app);
        emailService.sendInterviewScheduled(app.getUser(), app.getJob(), app);
        return toAppResponse(app);
    }

    // ── Admin: Record Interview Result ────────────────────────
    @Transactional
    public ApplicationResponse recordInterviewResult(Long appId, InterviewResultRequest req) {
        JobApplication app = getApp(appId);
        app.setInterviewResult(req.getResult());
        app.setInterviewNotes(req.getNotes());
        app.setFinalSelected(req.getFinalSelected());
        if (Boolean.TRUE.equals(req.getFinalSelected())) {
            app.setStatus(JobApplication.AppStatus.SELECTED);
            emailService.sendFinalSelection(app.getUser(), app.getJob());
        } else {
            app.setStatus(JobApplication.AppStatus.REJECTED);
        }
        return toAppResponse(appRepository.save(app));
    }

    // ── Helpers ───────────────────────────────────────────────
    @Transactional
    public ApplicationResponse rejectApplication(Long appId) {
        JobApplication app = getApp(appId);
        app.setFinalSelected(false);
        app.setInterviewResult("Rejected");
        if (app.getInterviewNotes() == null || app.getInterviewNotes().isBlank()) {
            app.setInterviewNotes("Rejected by admin before proceeding in the selection process.");
        }
        app.setStatus(JobApplication.AppStatus.REJECTED);
        return toAppResponse(appRepository.save(app));
    }

    private Job getJob(Long id) {
        return jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found: " + id));
    }
    private JobApplication getApp(Long id) {
        return appRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found: " + id));
    }

    private JobResponse toJobResponse(Job j, String myStatus) {
        long count = appRepository.countByJob(j);
        return JobResponse.builder()
                .id(j.getId()).title(j.getTitle()).companyName(j.getCompanyName())
                .description(j.getDescription()).location(j.getLocation()).jobType(j.getJobType())
                .salaryPackage(j.getSalaryPackage()).eligibleBranches(j.getEligibleBranches()).eligibleBatches(j.getEligibleBatches())
                .minimumCgpa(j.getMinimumCgpa()).skills(j.getSkills())
                .applicationDeadline(j.getApplicationDeadline()).totalPositions(j.getTotalPositions())
                .numberOfRounds(j.getNumberOfRounds())
                .status(getEffectiveJobStatus(j).name()).createdAt(j.getCreatedAt())
                .applicantCount(count).alreadyApplied(myStatus != null).myApplicationStatus(myStatus)
                .build();
    }

    private boolean isBatchEligible(Job job, User user) {
        if (user == null) return true;

        List<String> eligibleBatches = splitCsv(job.getEligibleBatches());
        if (eligibleBatches.isEmpty()) return true;

        String studentBatchYear = user.getBatchYear() != null ? user.getBatchYear().trim() : "";
        if (studentBatchYear.isEmpty()) return false;

        return eligibleBatches.contains(studentBatchYear);
    }

    private List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) return List.of();

        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toList());
    }

    private Job.JobStatus getEffectiveJobStatus(Job job) {
        if (job.getStatus() == Job.JobStatus.CLOSED) {
            return Job.JobStatus.CLOSED;
        }

        if (job.getApplicationDeadline() != null && !job.getApplicationDeadline().isAfter(LocalDate.now())) {
            return Job.JobStatus.CLOSED;
        }

        return job.getStatus();
    }

    private ApplicationResponse toAppResponse(JobApplication a) {
        ApplicationResponse response = ApplicationResponse.builder()
                .id(a.getId()).jobId(a.getJob().getId())
                .jobTitle(a.getJob().getTitle()).companyName(a.getJob().getCompanyName())
                .status(a.getStatus().name())
                .aptitudeCleared(a.getAptitudeCleared()).aptitudeScore(a.getAptitudeScore())
                .interviewDate(a.getInterviewDate()).interviewTime(a.getInterviewTime())
                .interviewMode(a.getInterviewMode()).interviewResult(a.getInterviewResult())
                .interviewNotes(a.getInterviewNotes()).finalSelected(a.getFinalSelected())
                .appliedAt(a.getAppliedAt()).build();

        enrichCurrentRoundDetails(response, a);
        return response;
    }

    private ApplicationResponse toAppResponseAdmin(JobApplication a) {
        ApplicationResponse r = toAppResponse(a);
        r.setUserId(a.getUser().getId());
        r.setStudentName(a.getUser().getFirstName() + " " + a.getUser().getLastName());
        r.setStudentEmail(a.getUser().getEmail());
        r.setRollNumber(a.getUser().getRollNumber());
        r.setDepartment(a.getUser().getDepartment());
        r.setCgpa(a.getUser().getCgpa());
        return r;
    }

    // ── Round Scheduling ─────────────────────────────────────
    @Transactional
    public RoundSchedulingView getRoundSchedulingView(Long appId) {
        JobApplication app = appRepository.findById(appId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        List<InterviewRound> rounds = roundRepository.findByApplicationOrderByRoundNumberAsc(app);
        List<InterviewRoundResponse> roundResponses = rounds.stream()
                .map(this::toRoundResponse).collect(Collectors.toList());
        
        return RoundSchedulingView.builder()
                .applicationId(app.getId()).jobId(app.getJob().getId())
                .studentId(app.getUser().getId())
                .studentName(app.getUser().getFirstName() + " " + app.getUser().getLastName())
                .studentEmail(app.getUser().getEmail()).rollNumber(app.getUser().getRollNumber())
                .jobTitle(app.getJob().getTitle()).companyName(app.getJob().getCompanyName())
                .numberOfRounds(app.getJob().getNumberOfRounds())
                .currentRound(app.getCurrentRound() != null ? app.getCurrentRound() : 0)
                .jobApplicationStatus(app.getStatus().name())
                .rounds(roundResponses)
                .build();
    }

    @Transactional
    public InterviewRoundResponse scheduleRound(Long appId, InterviewRoundRequest req) {
        JobApplication app = appRepository.findById(appId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (app.getStatus() == JobApplication.AppStatus.SELECTED || app.getStatus() == JobApplication.AppStatus.REJECTED) {
            throw new RuntimeException("This application is already closed.");
        }
        if (req.getRoundNumber() == null || req.getRoundNumber() < 1 || req.getRoundNumber() > app.getJob().getNumberOfRounds()) {
            throw new RuntimeException("Please choose a valid round number.");
        }
        if (roundRepository.findByApplicationAndRoundNumber(app, req.getRoundNumber()).isPresent()) {
            throw new RuntimeException("This round has already been scheduled.");
        }

        validateRoundScheduleRequest(req);
        LocalDate scheduledDate = LocalDate.parse(req.getScheduledDate().trim());

        InterviewRound round = InterviewRound.builder()
                .application(app).roundNumber(req.getRoundNumber())
                .roundType(req.getRoundType().trim()).scheduledDate(scheduledDate)
                .scheduledTime(req.getScheduledTime().trim()).interviewMode(req.getInterviewMode().trim())
                .location(req.getLocation().trim()).description(req.getDescription().trim())
                .status(InterviewRound.RoundStatus.SCHEDULED).result("PENDING")
                .build();

        InterviewRound saved = roundRepository.save(round);
        app.setCurrentRound(req.getRoundNumber());
        app.setStatus(getScheduledStatusForRoundType(req.getRoundType()));
        appRepository.save(app);

        return toRoundResponse(saved);
    }

    @Transactional
    public InterviewRoundResponse recordRoundResult(Long appId, Long roundId, RoundResultRequest req) {
        JobApplication app = appRepository.findById(appId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        InterviewRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found"));
        
        if (!round.getApplication().getId().equals(appId))
            throw new RuntimeException("Round does not belong to this application");
        
        round.setResult(req.getResult());
        round.setScore(req.getScore());
        round.setNotes(req.getNotes());
        round.setFeedback(req.getFeedback());
        round.setStatus(InterviewRound.RoundStatus.COMPLETED);

        InterviewRound updated = roundRepository.save(round);

        if ("FAIL".equalsIgnoreCase(req.getResult())) {
            app.setFinalSelected(false);
            app.setInterviewResult("Rejected");
            app.setStatus(JobApplication.AppStatus.REJECTED);
        } else {
            app.setStatus(getCompletedPassStatusForRoundType(round.getRoundType()));
        }
        appRepository.save(app);

        return toRoundResponse(updated);
    }

    @Transactional
    public ApplicationResponse finalizeRoundProcess(Long appId, FinalDecisionRequest req) {
        JobApplication app = appRepository.findById(appId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (req.getFinalSelected() == null) {
            throw new RuntimeException("Please choose a final decision.");
        }

        List<InterviewRound> rounds = roundRepository.findByApplicationOrderByRoundNumberAsc(app);
        if (rounds.isEmpty()) {
            throw new RuntimeException("Schedule and complete at least one round before recording the final decision.");
        }

        InterviewRound latestRound = rounds.get(rounds.size() - 1);
        if (latestRound.getStatus() != InterviewRound.RoundStatus.COMPLETED) {
            throw new RuntimeException("Complete the latest scheduled round before recording the final decision.");
        }
        if (!"PASS".equalsIgnoreCase(latestRound.getResult())) {
            throw new RuntimeException("Final decision can be recorded only after the latest round is marked as PASS.");
        }

        app.setFinalSelected(req.getFinalSelected());
        app.setInterviewNotes(req.getNotes());

        if (Boolean.TRUE.equals(req.getFinalSelected())) {
            app.setInterviewResult("Selected");
            app.setStatus(JobApplication.AppStatus.SELECTED);
            emailService.sendFinalSelection(app.getUser(), app.getJob());
        } else {
            app.setInterviewResult("Rejected");
            app.setStatus(JobApplication.AppStatus.REJECTED);
        }

        return toAppResponse(appRepository.save(app));
    }

    private void validateRoundScheduleRequest(InterviewRoundRequest req) {
        if (req.getRoundType() == null || req.getRoundType().trim().isBlank()) {
            throw new RuntimeException("Round type is required.");
        }
        if (req.getInterviewMode() == null || req.getInterviewMode().trim().isBlank()) {
            throw new RuntimeException("Interview mode is required.");
        }
        if (req.getScheduledDate() == null || req.getScheduledDate().trim().isBlank()
                || req.getScheduledTime() == null || req.getScheduledTime().trim().isBlank()) {
            throw new RuntimeException("Round date and time are required.");
        }
        if (req.getLocation() == null || req.getLocation().trim().isBlank()) {
            throw new RuntimeException("Place / Location is required.");
        }
        if (!req.getLocation().trim().matches(ROUND_LOCATION_PATTERN)) {
            throw new RuntimeException("Place / Location must include both letters and numbers.");
        }
        if (req.getDescription() == null || req.getDescription().trim().isBlank()) {
            throw new RuntimeException("Round description is required.");
        }

        try {
            LocalDate scheduledDate = LocalDate.parse(req.getScheduledDate().trim());
            LocalTime scheduledTime = LocalTime.parse(req.getScheduledTime().trim());
            LocalDateTime scheduledAt = LocalDateTime.of(scheduledDate, scheduledTime);
            if (!scheduledAt.isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Past time is not allowed. Please choose a future round date and time.");
            }
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Please enter a valid round date and time.");
        }
    }

    private InterviewRoundResponse toRoundResponse(InterviewRound r) {
        return InterviewRoundResponse.builder()
                .id(r.getId()).roundNumber(r.getRoundNumber()).roundType(r.getRoundType())
                .scheduledDate(r.getScheduledDate() != null ? r.getScheduledDate().toString() : null)
                .scheduledTime(r.getScheduledTime()).interviewMode(r.getInterviewMode())
                .location(r.getLocation()).description(r.getDescription())
                .status(r.getStatus().name()).result(r.getResult())
                .score(r.getScore()).notes(r.getNotes()).feedback(r.getFeedback())
                .build();
    }

    private void enrichCurrentRoundDetails(ApplicationResponse response, JobApplication application) {
        Optional<InterviewRound> latestRound = roundRepository.findByApplicationOrderByRoundNumberAsc(application)
                .stream()
                .reduce((first, second) -> second);

        if (latestRound.isEmpty()) return;

        InterviewRound round = latestRound.get();
        response.setCurrentRoundNumber(round.getRoundNumber());
        response.setCurrentRoundType(round.getRoundType());
        response.setCurrentRoundStatus(round.getStatus().name());
        normalizeAptitudeStatusFromRound(response, round);

        String roundName = round.getRoundType() != null && !round.getRoundType().isBlank()
                ? round.getRoundType()
                : "Round " + round.getRoundNumber();
        String roundState = getRoundDisplayState(round);

        response.setCurrentRoundDisplayStatus(roundName + " " + roundState);
    }

    private void normalizeAptitudeStatusFromRound(ApplicationResponse response, InterviewRound round) {
        if (!isAptitudeRound(round.getRoundType())) return;

        if (round.getStatus() == InterviewRound.RoundStatus.SCHEDULED) {
            response.setStatus(JobApplication.AppStatus.APTITUDE_SCHEDULED.name());
            return;
        }

        if (round.getStatus() == InterviewRound.RoundStatus.COMPLETED) {
            if ("PASS".equalsIgnoreCase(round.getResult())) {
                response.setStatus(JobApplication.AppStatus.APTITUDE_CLEARED.name());
            } else if ("FAIL".equalsIgnoreCase(round.getResult())) {
                response.setStatus(JobApplication.AppStatus.APTITUDE_FAILED.name());
            }
        }
    }

    private JobApplication.AppStatus getScheduledStatusForRoundType(String roundType) {
        return isAptitudeRound(roundType)
                ? JobApplication.AppStatus.APTITUDE_SCHEDULED
                : JobApplication.AppStatus.INTERVIEW_SCHEDULED;
    }

    private JobApplication.AppStatus getCompletedPassStatusForRoundType(String roundType) {
        return isAptitudeRound(roundType)
                ? JobApplication.AppStatus.APTITUDE_CLEARED
                : JobApplication.AppStatus.INTERVIEW_SCHEDULED;
    }

    private boolean isAptitudeRound(String roundType) {
        return roundType != null && roundType.trim().toLowerCase().contains("aptitude");
    }

    private String getRoundDisplayState(InterviewRound round) {
        if (round.getStatus() == InterviewRound.RoundStatus.SCHEDULED) {
            return "Scheduled";
        }

        if (round.getStatus() == InterviewRound.RoundStatus.COMPLETED) {
            if ("PASS".equalsIgnoreCase(round.getResult())) {
                return isAptitudeRound(round.getRoundType()) ? "Cleared" : "Passed";
            }
            if ("FAIL".equalsIgnoreCase(round.getResult())) {
                return "Failed";
            }
        }

        return "Completed";
    }
}

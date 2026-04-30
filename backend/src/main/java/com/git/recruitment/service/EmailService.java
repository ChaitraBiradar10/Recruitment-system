package com.git.recruitment.service;

import com.git.recruitment.model.*;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor @Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}") private String fromEmail;

    @Async public void sendRegistrationReceived(User u) {
        send(u.getEmail(), "Registration Received — GIT Recruitment Portal",
            base("#fff3cd","#b07a10", warningIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>We've Received Your Registration</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>Thank you for registering on the <strong>GIT Campus Placement Portal</strong>. Your request is pending review by the Placement Office.</p>" +
                highlight("⏱ Approval typically takes <strong>1–2 business days</strong>. You will receive an email once reviewed.") +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Regards,<br><strong style='color:#0f1b2d'>Placement Office</strong><br>Gokul Institute of Technology</p>"));
    }

    @Async public void sendRegistrationApproved(User u) {
        send(u.getEmail(), "Account Approved — GIT Recruitment Portal",
            base("#d8f3dc","#2d6a4f", checkIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>Account Approved — You're In!</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>Your registration on the <strong>GIT Campus Placement Portal</strong> has been approved by the Placement Office.</p>" +
                highlight("✅ Log in to complete your profile, upload your CV, and apply for job opportunities.") +
                cta("Login to Portal", "http://localhost:3000/login") +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Warm regards,<br><strong style='color:#0f1b2d'>Placement Office</strong><br>Gokul Institute of Technology</p>"));
    }

    @Async public void sendRegistrationRejected(User u) {
        send(u.getEmail(), "Update on Your Registration — GIT Recruitment Portal",
            base("#dce8f7","#1a3d6e", infoIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>An Update on Your Registration</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>After review, we regret that your registration could not be approved at this time. Please contact the Placement Office for clarification.</p>" +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Regards,<br><strong style='color:#0f1b2d'>Placement Office</strong></p>"));
    }

    @Async public void sendCVShortlisted(User u) {
        send(u.getEmail(), "Congratulations — Your CV Has Been Shortlisted!",
            base("#d8f3dc","#2d6a4f", starIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>Congratulations, " + u.getFirstName() + "! Your CV Is Shortlisted!</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>Your CV has been reviewed and shortlisted. Your profile is now being forwarded to our recruiting partner companies.</p>" +
                highlight("🎉 CV shared with companies for the <strong>2025-26 Placement Season</strong>. Interview calls will follow.") +
                cta("View My Application", "http://localhost:3000/student/status") +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Best wishes,<br><strong style='color:#0f1b2d'>Placement Office</strong></p>"));
    }

    @Async public void sendCVRejected(User u) {
        send(u.getEmail(), "Update on Your CV Application — GIT Recruitment Portal",
            base("#dce8f7","#1a3d6e", infoIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>An Update on Your CV Application</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>After careful review, your application has not been shortlisted for the current cycle. We encourage you to update your profile and reapply next season.</p>" +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Regards,<br><strong style='color:#0f1b2d'>Placement Office</strong></p>"));
    }

    @Async public void sendJobApplicationConfirmation(User u, Job j) {
        send(u.getEmail(), "Application Submitted — " + j.getCompanyName(),
            base("#d8f3dc","#2d6a4f", checkIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>Application Submitted Successfully!</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>Your application for <strong>" + j.getTitle() + "</strong> at <strong>" + j.getCompanyName() + "</strong> has been received successfully.</p>" +
                highlight("📋 Job: " + j.getTitle() + "<br>🏢 Company: " + j.getCompanyName() + "<br>📍 Location: " + (j.getLocation() != null ? j.getLocation() : "TBD")) +
                cta("Track Application", "http://localhost:3000/student/applications") +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Best wishes,<br><strong style='color:#0f1b2d'>Placement Office</strong></p>"));
    }

    @Async public void sendInterviewScheduled(User u, Job j, JobApplication app) {
        send(u.getEmail(), "Interview Scheduled — " + j.getCompanyName(),
            base("#fff3cd","#b07a10", warningIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>Your Interview Has Been Scheduled!</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>Congratulations! You have been selected for an interview for <strong>" + j.getTitle() + "</strong> at <strong>" + j.getCompanyName() + "</strong>.</p>" +
                highlight("📅 Date: <strong>" + app.getInterviewDate() + "</strong><br>⏰ Time: <strong>" + app.getInterviewTime() + "</strong><br>📍 Mode: <strong>" + app.getInterviewMode() + "</strong>") +
                "<p style='font-size:14px;color:#5a5550;line-height:1.75;margin:18px 0'>Please be prepared and arrive on time. All the best!</p>" +
                cta("View Details", "http://localhost:3000/student/applications") +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>Best wishes,<br><strong style='color:#0f1b2d'>Placement Office</strong></p>"));
    }

    @Async public void sendFinalSelection(User u, Job j) {
        send(u.getEmail(), "🎉 Congratulations — Selected at " + j.getCompanyName() + "!",
            base("#d8f3dc","#2d6a4f", starIcon(),
                "<h1 style='font-size:22px;color:#0f1b2d;margin:0 0 14px'>Congratulations — You Are Selected!</h1>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 14px'>Dear " + u.getFirstName() + ",</p>" +
                "<p style='font-size:14px;color:#3d3830;line-height:1.75;margin:0 0 18px'>We are delighted to inform you that you have been <strong>finally selected</strong> for the position of <strong>" + j.getTitle() + "</strong> at <strong>" + j.getCompanyName() + "</strong>. The Placement Office will contact you with further details shortly.</p>" +
                highlight("🎉 You have been placed! Congratulations on this achievement. The Placement Office is proud of you!") +
                "<p style='font-size:13px;color:#999285;margin:24px 0 0'>With best wishes,<br><strong style='color:#0f1b2d'>Placement Office</strong><br>Gokul Institute of Technology</p>"));
    }

    private void send(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromEmail, "GIT Placement Office");
            h.setTo(to); h.setSubject(subject); h.setText(html, true);
            mailSender.send(msg);
            log.info("Email sent to {}", to);
        } catch (Exception e) { log.error("Email failed to {}: {}", to, e.getMessage()); }
    }

    private String base(String iconBg, String iconColor, String icon, String content) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>" +
            "<body style='margin:0;padding:0;background:#f0ede6;font-family:Segoe UI,Arial,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='padding:32px 16px;'><tr><td align='center'>" +
            "<table width='580' cellpadding='0' cellspacing='0' style='max-width:580px;width:100%;'>" +
            "<tr><td style='background:#0f1b2d;border-radius:16px 16px 0 0;padding:28px 36px 24px;text-align:center;'>" +
            "<div style='font-size:20px;font-weight:700;color:#e8c97a;'>GIT Campus Placement Portal</div>" +
            "<div style='font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-top:4px;'>GOKUL INSTITUTE OF TECHNOLOGY</div>" +
            "<div style='width:60px;height:60px;border-radius:50%;background:" + iconBg + ";margin:20px auto 0;display:flex;align-items:center;justify-content:center;'>" + icon + "</div>" +
            "</td></tr>" +
            "<tr><td style='background:#fff;padding:32px 36px;'>" + content + "</td></tr>" +
            "<tr><td style='background:#f0ede6;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;border-top:1px solid #ddd9d0;'>" +
            "<p style='margin:0;font-size:12px;color:#999285;'>Placement Office &bull; Gokul Institute of Technology<br>" +
            "<a href='mailto:placements@git.edu' style='color:#0f1b2d;'>placements@git.edu</a> &bull; +91 80000 00000</p>" +
            "<p style='margin:8px 0 0;font-size:10px;color:#b4b2a9;'>This is an automated message. Do not reply directly.</p>" +
            "</td></tr></table></td></tr></table></body></html>";
    }

    private String highlight(String text) {
        return "<div style='background:#f5ecd4;border-left:4px solid #c9a84c;border-radius:0 8px 8px 0;padding:14px 18px;margin:18px 0;font-size:13px;color:#3d3830;line-height:1.7;'>" + text + "</div>";
    }

    private String cta(String label, String url) {
        return "<div style='text-align:center;margin:24px 0;'><a href='" + url + "' style='background:#0f1b2d;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:600;display:inline-block;'>" + label + " →</a></div>";
    }

    private String checkIcon() { return "<svg width='28' height='28' viewBox='0 0 24 24' fill='#2d6a4f'><path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/></svg>"; }
    private String warningIcon() { return "<svg width='28' height='28' viewBox='0 0 24 24' fill='#b07a10'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/></svg>"; }
    private String infoIcon() { return "<svg width='28' height='28' viewBox='0 0 24 24' fill='#1a3d6e'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/></svg>"; }
    private String starIcon() { return "<svg width='28' height='28' viewBox='0 0 24 24' fill='#c9a84c'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>"; }
}

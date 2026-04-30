# GIT Campus Placement System
### An Automated DevOps Based Campus Placement System
**Stack:** Spring Boot 3 · React 18 · MySQL 8 · Docker · Jenkins · Prometheus · Grafana

---

## Features

### Student
- Register with @students.git.edu email — pending admin approval
- Login after approval
- Complete profile (personal + academic details)
- Upload CV (PDF/DOCX, max 5 MB)
- Browse active job postings
- Apply for jobs with one click
- Track application status through full selection pipeline

### Admin
- Approve or reject student registrations (email notifications)
- Shortlist or reject uploaded CVs (email notifications)
- Create, edit, delete job postings with eligibility criteria
- View all applicants per job
- Manage selection process: Schedule Aptitude → Record Result → Schedule Interview → Final Decision
- Email notifications at every stage (interview scheduled, selected/rejected)
- Full student directory with CV download

### DevOps
- Dockerized backend + frontend + MySQL
- Jenkins CI/CD pipeline (GitHub → Build → Test → Docker → EC2)
- Prometheus + Grafana monitoring dashboards
- Node Exporter for system metrics

---

## Quick Start (Local)

### Prerequisites
- Java 17+, Maven 3.9+
- Node.js 18+
- MySQL 8+

### 1. Start MySQL & create database
```bash
mysql -u root -p
# Enter your password, then:
CREATE DATABASE git_recruitment;
EXIT;
```

### 2. Configure backend
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.password=YourMySQLPassword
spring.mail.username=placements@git.edu
spring.mail.password=YourGmailAppPassword
```

### 3. Run backend
```bash
cd backend
mvn spring-boot:run
```
Backend starts at **http://localhost:8080**
Default admin created: `admin@git.edu / Admin@1234`

### 4. Run frontend
```bash
cd frontend
npm install
npm start
```
Frontend starts at **http://localhost:3000**

---

## Docker Compose (All services at once)

```bash
# Update docker-compose.yml with your email password, then:
docker-compose up -d

# Access:
# Frontend:   http://localhost
# Backend:    http://localhost:8080
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001  (admin / admin123)
```

---

## Default Credentials

| Role    | Email            | Password    |
|---------|------------------|-------------|
| Admin   | admin@git.edu    | Admin@1234  |
| Student | Register via UI  | You set it  |

---

## API Endpoints

### Public
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Student registration |
| POST | /api/auth/login | Login (returns JWT) |

### Student (JWT required)
| Method | URL | Description |
|--------|-----|-------------|
| GET/PUT | /api/student/profile | View/update profile |
| POST | /api/student/resume | Upload CV |
| GET | /api/jobs/active | Browse active jobs |
| POST | /api/jobs/{id}/apply | Apply for a job |
| GET | /api/jobs/my-applications | My applications |

### Admin (JWT required)
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/admin/dashboard | Stats overview |
| GET | /api/admin/students | All students |
| POST | /api/admin/registrations/{id}/approve | Approve registration |
| POST | /api/admin/registrations/{id}/reject | Reject registration |
| POST | /api/admin/cv/{id}/shortlist | Shortlist CV |
| GET/POST | /api/admin/jobs | List/create jobs |
| PUT/DELETE | /api/admin/jobs/{id} | Edit/delete job |
| GET | /api/admin/jobs/{id}/applicants | Job applicants |
| POST | /api/admin/applications/{id}/aptitude/schedule | Schedule aptitude |
| POST | /api/admin/applications/{id}/aptitude/result | Record aptitude result |
| POST | /api/admin/applications/{id}/interview/schedule | Schedule interview |
| POST | /api/admin/applications/{id}/interview/result | Final decision |

---

## Email Notifications

| Trigger | Email Sent To |
|---------|--------------|
| Student registers | Student (registration received) |
| Admin approves registration | Student (account approved) |
| Admin rejects registration | Student (rejected) |
| Admin shortlists CV | Student (CV shortlisted) |
| Admin rejects CV | Student (not selected) |
| Student applies for job | Student (application confirmation) |
| Admin schedules interview | Student (interview details) |
| Admin selects student | Student (🎉 congratulations) |

---

## Selection Process Flow

```
Student Applies
      ↓
Admin: Schedule Aptitude Test
      ↓
Admin: Record Aptitude Result (Cleared / Failed)
      ↓ (if cleared)
Admin: Schedule Interview (date + time + mode → email sent)
      ↓
Admin: Record Interview Result → Final Decision (Selected / Not Selected)
      ↓
Email sent to student with result
```

---

## DevOps Pipeline

```
Developer pushes to GitHub
        ↓
Jenkins triggers build
        ↓
Maven build + tests (backend)
npm build (frontend)
        ↓
Docker images built
        ↓
Deploy to AWS EC2 via SSH
        ↓
Health check via /actuator/health
        ↓
Prometheus scrapes metrics
        ↓
Grafana displays dashboards
```

---

## Production Checklist
- [ ] Change JWT secret in application.properties
- [ ] Change default admin password
- [ ] Set spring.jpa.hibernate.ddl-auto=validate
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (SSL certificate)
- [ ] Update CORS origin to your domain
- [ ] Set up database backups
- [ ] Configure Grafana dashboards for alerts

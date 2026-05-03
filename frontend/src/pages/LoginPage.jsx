import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService, studentService } from '../services/api';

const DEPTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Electrical Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Automobile Engineering',
  'Biotechnology Engineering',
  'Master of Computer Applications',
];

const BATCH_YEARS = Array.from({ length: 8 }, (_, i) => 2023 + i);
const GENDERS = ['Male', 'Female', 'Other'];
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const INITIAL_REGISTER_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  rollNumber: '',
  department: '',
  batchYear: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  cgpa: '',
  skills: '',
  linkedinUrl: '',
  coverNote: '',
  resume: null,
};

const INITIAL_FORGOT_FORM = {
  email: '',
  newPassword: '',
  confirmPassword: '',
};

const validateRegisterField = (field, form) => {
  const trimmedValue = value => `${value || ''}`.trim();
  const nameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[A-Za-z0-9._%+-]+@students\.git\.edu$/;
  const rollRegex = /^[A-Za-z0-9]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const cgpaRegex = /^(10(\.0{1,2})?|[0-9](\.\d{1,2})?)$/;
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/i;
  const skillRegex = /^[A-Za-z0-9 .+#/&-]+$/;
  const hasLetterRegex = /[A-Za-z]/;
  const getEmailPrefix = email => trimmedValue(email).toLowerCase().split('@')[0].slice(0, 7);
  const getRollPrefix = rollNumber => trimmedValue(rollNumber).toLowerCase().slice(0, 7);
  const emailRollPrefixError = () => {
    const email = trimmedValue(form.email);
    const rollNumber = trimmedValue(form.rollNumber);
    if (!email || !rollNumber || !emailRegex.test(email) || !rollRegex.test(rollNumber)) return '';
    if (email.split('@')[0].length < 7 || rollNumber.length < 7) {
      return 'Email ID and roll number must have at least 7 characters to verify.';
    }
    if (getEmailPrefix(email) !== getRollPrefix(rollNumber)) {
      return 'First 7 characters of email ID and roll number must be same.';
    }
    return '';
  };

  switch (field) {
    case 'firstName':
      if (!trimmedValue(form.firstName)) return 'First name is required.';
      if (!nameRegex.test(trimmedValue(form.firstName))) return 'First name must contain letters only.';
      return '';
    case 'lastName':
      if (!trimmedValue(form.lastName)) return 'Last name is required.';
      if (!nameRegex.test(trimmedValue(form.lastName))) return 'Last name must contain letters only.';
      return '';
    case 'email':
      if (!trimmedValue(form.email)) return 'College email is required.';
      if (!emailRegex.test(trimmedValue(form.email))) return 'Use your @students.git.edu email address.';
      if (emailRollPrefixError()) return emailRollPrefixError();
      return '';
    case 'password':
      if (!form.password) return 'Password is required.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      return '';
    case 'confirmPassword':
      if (!form.confirmPassword) return 'Please confirm your password.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      return '';
    case 'rollNumber':
      if (!trimmedValue(form.rollNumber)) return 'Roll number is required.';
      if (!rollRegex.test(trimmedValue(form.rollNumber))) return 'Roll number must be alphanumeric.';
      if (emailRollPrefixError()) return emailRollPrefixError();
      return '';
    case 'department':
      if (!trimmedValue(form.department)) return 'Department is required.';
      return '';
    case 'batchYear':
      if (!trimmedValue(form.batchYear)) return 'Batch year is required.';
      if (!BATCH_YEARS.map(String).includes(String(form.batchYear))) return 'Please select a valid batch year.';
      return '';
    case 'phone':
      if (!trimmedValue(form.phone)) return 'Phone number is required.';
      if (!phoneRegex.test(trimmedValue(form.phone))) return 'Phone number must be a valid 10-digit mobile number.';
      return '';
    case 'gender':
      if (!trimmedValue(form.gender)) return 'Gender is required.';
      if (!GENDERS.includes(form.gender)) return 'Please select a valid gender.';
      return '';
    case 'dateOfBirth': {
      if (!trimmedValue(form.dateOfBirth)) return 'Date of birth is required.';
      const dob = new Date(form.dateOfBirth);
      if (Number.isNaN(dob.getTime())) return 'Invalid DOB.';
      if (dob >= new Date('2010-01-01')) return 'Invalid DOB.';
      return '';
    }
    case 'cgpa':
      if (!trimmedValue(form.cgpa)) return 'CGPA is required.';
      if (!cgpaRegex.test(trimmedValue(form.cgpa))) return 'CGPA must be between 0 and 10 with up to 2 decimal places.';
      return '';
    case 'skills': {
      if (!trimmedValue(form.skills)) return 'Skills are required.';
      const skills = form.skills.split(',').map(skill => skill.trim()).filter(Boolean);
      if (skills.length === 0) return 'Please enter at least one skill.';
      if (skills.some(skill => !skillRegex.test(skill))) return 'Skills must contain characters or alphanumeric values only.';
      if (skills.some(skill => !hasLetterRegex.test(skill))) return 'Skills cannot be numbers only.';
      return '';
    }
    case 'linkedinUrl':
      if (!trimmedValue(form.linkedinUrl)) return 'LinkedIn URL is required.';
      if (!linkedinRegex.test(trimmedValue(form.linkedinUrl))) return 'Enter a valid LinkedIn profile URL.';
      return '';
    case 'coverNote':
      if (!trimmedValue(form.coverNote)) return 'Cover note is required.';
      if (trimmedValue(form.coverNote).length < 20) return 'Cover note must be at least 20 characters.';
      if (!hasLetterRegex.test(trimmedValue(form.coverNote))) return 'Cover note cannot be numbers only.';
      return '';
    case 'resume':
      if (!form.resume) return 'Resume is required.';
      if (!ALLOWED_RESUME_TYPES.includes(form.resume.type)) return 'Resume must be a PDF or DOCX file.';
      if (form.resume.size > 5 * 1024 * 1024) return 'Resume file size must not exceed 5 MB.';
      return '';
    default:
      return '';
  }
};

const validateRegisterForm = form => {
  const fields = [
    'firstName',
    'lastName',
    'email',
    'password',
    'confirmPassword',
    'rollNumber',
    'department',
    'batchYear',
    'phone',
    'gender',
    'dateOfBirth',
    'cgpa',
    'skills',
    'linkedinUrl',
    'coverNote',
    'resume',
  ];

  return fields.reduce((errors, field) => {
    const error = validateRegisterField(field, form);
    if (error) errors[field] = error;
    return errors;
  }, {});
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [lf, setLf] = useState({ email: '', password: '' });
  const [rf, setRf] = useState(INITIAL_REGISTER_FORM);
  const [registerErrors, setRegisterErrors] = useState({});
  const [registrationOtp, setRegistrationOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [ff, setFf] = useState(INITIAL_FORGOT_FORM);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterMode = location.pathname === '/register';

  const openLogin = () => {
    setRegisterErrors({});
    navigate('/login');
  };

  const openRegister = () => {
    setRegisterErrors({});
    navigate('/register');
  };

  const updateRegisterField = (field, value) => {
    const nextValue = field === 'phone'
      ? `${value || ''}`.replace(/\D/g, '').slice(0, 10)
      : value;

    if (['email', 'rollNumber'].includes(field)) {
      setRegistrationOtp('');
      setOtpSent(false);
      setOtpVerified(false);
    }

    setRf(prev => {
      const next = { ...prev, [field]: nextValue };

      setRegisterErrors(prevErrors => {
        const nextErrors = { ...prevErrors };
        const fieldsToValidate = field === 'password'
          ? ['password', 'confirmPassword']
          : ['email', 'rollNumber'].includes(field)
            ? ['email', 'rollNumber']
            : [field];

        fieldsToValidate.forEach(name => {
          const message = validateRegisterField(name, next);
          if (message) nextErrors[name] = message;
          else delete nextErrors[name];
        });

        return nextErrors;
      });

      return next;
    });
  };

  const handleSendRegistrationOtp = async () => {
    const emailError = validateRegisterField('email', rf);
    const rollError = validateRegisterField('rollNumber', rf);
    if (emailError || rollError) {
      setRegisterErrors(prev => ({
        ...prev,
        ...(emailError ? { email: emailError } : {}),
        ...(rollError ? { rollNumber: rollError } : {}),
      }));
      toast.error(emailError || rollError);
      return;
    }

    setOtpLoading(true);
    try {
      const { data } = await authService.sendRegistrationOtp({
        email: rf.email.trim().toLowerCase(),
        rollNumber: rf.rollNumber.trim().toUpperCase(),
      });
      setOtpSent(true);
      setOtpVerified(false);
      setRegistrationOtp('');
      toast.success(data.message);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP.';
      setRegisterErrors(prev => ({ ...prev, email: message }));
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    if (!registrationOtp.trim()) {
      toast.error('Enter the OTP sent to your email.');
      return;
    }

    setOtpLoading(true);
    try {
      const { data } = await authService.verifyRegistrationOtp({
        email: rf.email.trim().toLowerCase(),
        otp: registrationOtp.trim(),
      });
      setOtpVerified(true);
      toast.success(data.message);
    } catch (error) {
      setOtpVerified(false);
      toast.error(error.response?.data?.message || 'Invalid OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data: loginData } = await authService.login(lf);
      login(loginData);

      toast.success(`Welcome back, ${loginData.firstName}!`);
      navigate(loginData.role === 'ADMIN' ? '/admin' : '/student');

      if (loginData.role === 'STUDENT') {
        studentService.getProfile()
          .then(({ data: profileData }) => {
            const fullUserData = { ...loginData, ...profileData };
            login(fullUserData);
          })
          .catch(error => {
            console.warn('Could not fetch student profile:', error);
          });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials.');
      setLoading(false);
    }
  };

  const handleRegister = async event => {
    event.preventDefault();
    const errors = validateRegisterForm(rf);
    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      if (Object.keys(errors).length > 2) {
        toast.error('Invalid details');
      }
      return;
    }
    if (!otpVerified) {
      toast.error('Please verify your email OTP before registration.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const registerData = {
        firstName: rf.firstName.trim(),
        lastName: rf.lastName.trim(),
        email: rf.email.trim().toLowerCase(),
        password: rf.password,
        rollNumber: rf.rollNumber.trim().toUpperCase(),
        department: rf.department.trim(),
        batchYear: `${rf.batchYear}`.trim(),
        phone: rf.phone.trim(),
        gender: rf.gender.trim(),
        dateOfBirth: rf.dateOfBirth.trim(),
        cgpa: rf.cgpa.trim(),
        skills: rf.skills.trim(),
        linkedinUrl: rf.linkedinUrl.trim(),
        coverNote: rf.coverNote.trim(),
      };

      formData.append('registerData', new Blob([JSON.stringify(registerData)], { type: 'application/json' }));
      formData.append('resume', rf.resume);

      const { data } = await authService.registerWithFile(formData);
      toast.success(data.message);
      setRf(INITIAL_REGISTER_FORM);
      setRegisterErrors({});
      setRegistrationOtp('');
      setOtpSent(false);
      setOtpVerified(false);
      navigate('/pending');
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async event => {
    event.preventDefault();

    if (!ff.email.endsWith('@students.git.edu')) return toast.error('Use your student email address.');
    if (ff.newPassword.length < 8) return toast.error('New password must be at least 8 characters.');
    if (ff.newPassword !== ff.confirmPassword) return toast.error('Passwords do not match.');

    setLoading(true);

    try {
      const { data } = await authService.forgotPassword({
        email: ff.email,
        newPassword: ff.newPassword,
      });

      toast.success(data.message || 'Password updated successfully.');
      setShowForgotPassword(false);
      setFf(INITIAL_FORGOT_FORM);
      openLogin();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className={`login-card ${isRegisterMode ? 'register-mode' : ''}`}>
        {isRegisterMode && (
          <aside className="auth-showcase">
            <div className="auth-showcase-badge">Student onboarding</div>
            <h2>Create a placement-ready profile</h2>
            <p>
              Register once with your academic details, skills, and resume so the placement team can
              review and approve your account quickly.
            </p>

            <div className="auth-showcase-grid">
              <div className="auth-showcase-item">
                <strong>1</strong>
                <span>Enter your verified college and academic details</span>
              </div>
              <div className="auth-showcase-item">
                <strong>2</strong>
                <span>Upload your resume and highlight your core skills</span>
              </div>
              <div className="auth-showcase-item">
                <strong>3</strong>
                <span>Track approval and start applying to campus jobs</span>
              </div>
            </div>
          </aside>
        )}

        <div className="auth-panel">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#c9a84c">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-8.99 9.18L12 17l8.99-4.82.01 4.09-9 4.91-9-4.91.01-4.09z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--navy)', marginBottom: 2 }}>
                GIT Placement Portal
              </h2>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.5px' }}>
                CAMPUS RECRUITMENT SYSTEM
              </p>
            </div>
          </div>

          <div className="login-tabs">
            <button className={`login-tab${!isRegisterMode ? ' active' : ''}`} onClick={openLogin}>
              Sign In
            </button>
            <button className={`login-tab${isRegisterMode ? ' active' : ''}`} onClick={openRegister}>
              Register
            </button>
          </div>

          <div className="domain-badge">
            <div className="domain-dot" />
            {isRegisterMode ? '@students.git.edu only' : 'Admin or @students.git.edu'}
          </div>

          <div className="auth-heading">
            <h3>{isRegisterMode ? 'Student registration' : 'Welcome back'}</h3>
            <p>
              {isRegisterMode
                ? 'Complete your profile carefully so the placement office can approve it without delay.'
                : 'Sign in to manage placements, applications, and recruitment updates.'}
            </p>
          </div>

          {!isRegisterMode && (
            <form className="auth-login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="yourname@students.git.edu"
                  value={lf.email}
                  onChange={event => setLf(prev => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={lf.password}
                  onChange={event => setLf(prev => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In to Portal'}
              </button>

              <div className="auth-footer-link">
                <button type="button" className="btn-link" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {isRegisterMode && (
            <form className="auth-register-form" onSubmit={handleRegister}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input className={registerErrors.firstName ? 'input-error' : ''} type="text" required value={rf.firstName} onChange={event => updateRegisterField('firstName', event.target.value)} />
                    {registerErrors.firstName && <div className="field-error">{registerErrors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input className={registerErrors.lastName ? 'input-error' : ''} type="text" required value={rf.lastName} onChange={event => updateRegisterField('lastName', event.target.value)} />
                    {registerErrors.lastName && <div className="field-error">{registerErrors.lastName}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label>College Email *</label>
                  <input className={registerErrors.email ? 'input-error' : ''} type="email" required value={rf.email} onChange={event => updateRegisterField('email', event.target.value)} />
                  {registerErrors.email && <div className="field-error">{registerErrors.email}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input className={registerErrors.password ? 'input-error' : ''} type="password" required value={rf.password} onChange={event => updateRegisterField('password', event.target.value)} />
                    {registerErrors.password && <div className="field-error">{registerErrors.password}</div>}
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input className={registerErrors.confirmPassword ? 'input-error' : ''} type="password" required value={rf.confirmPassword} onChange={event => updateRegisterField('confirmPassword', event.target.value)} />
                    {registerErrors.confirmPassword && <div className="field-error">{registerErrors.confirmPassword}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Roll Number *</label>
                    <input className={registerErrors.rollNumber ? 'input-error' : ''} type="text" required value={rf.rollNumber} onChange={event => updateRegisterField('rollNumber', event.target.value)} />
                    {registerErrors.rollNumber && <div className="field-error">{registerErrors.rollNumber}</div>}
                  </div>
                  <div className="form-group">
                    <label>Batch Year *</label>
                    <select className={registerErrors.batchYear ? 'input-error' : ''} required value={rf.batchYear} onChange={event => updateRegisterField('batchYear', event.target.value)}>
                      <option value="">Select batch year</option>
                      {BATCH_YEARS.map(year => <option key={year}>{year}</option>)}
                    </select>
                    {registerErrors.batchYear && <div className="field-error">{registerErrors.batchYear}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email OTP *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={otpSent ? 'Enter 6-digit OTP' : 'Send OTP first'}
                      value={registrationOtp}
                      disabled={!otpSent || otpVerified}
                      onChange={event => setRegistrationOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <div className="form-hint">
                      {otpVerified ? 'Email verified.' : 'OTP is sent to your college email and is valid for 5 minutes.'}
                    </div>
                  </div>
                  <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                    <label>&nbsp;</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleSendRegistrationOtp} disabled={otpLoading || otpVerified}>
                        {otpLoading && !otpSent ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                      <button type="button" className="btn btn-success btn-sm" onClick={handleVerifyRegistrationOtp} disabled={otpLoading || !otpSent || otpVerified}>
                        {otpVerified ? 'Verified' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <select className={registerErrors.department ? 'input-error' : ''} required value={rf.department} onChange={event => updateRegisterField('department', event.target.value)}>
                    <option value="">Select department</option>
                    {DEPTS.map(department => <option key={department}>{department}</option>)}
                  </select>
                  {registerErrors.department && <div className="field-error">{registerErrors.department}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone *</label>
                    <input className={registerErrors.phone ? 'input-error' : ''} type="text" inputMode="numeric" maxLength={10} required value={rf.phone} onChange={event => updateRegisterField('phone', event.target.value)} />
                    {registerErrors.phone && <div className="field-error">{registerErrors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select className={registerErrors.gender ? 'input-error' : ''} required value={rf.gender} onChange={event => updateRegisterField('gender', event.target.value)}>
                      <option value="">Select</option>
                      {GENDERS.map(gender => <option key={gender}>{gender}</option>)}
                    </select>
                    {registerErrors.gender && <div className="field-error">{registerErrors.gender}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input className={registerErrors.dateOfBirth ? 'input-error' : ''} type="date" required value={rf.dateOfBirth} onChange={event => updateRegisterField('dateOfBirth', event.target.value)} />
                    {registerErrors.dateOfBirth && <div className="field-error">{registerErrors.dateOfBirth}</div>}
                  </div>
                  <div className="form-group">
                    <label>CGPA *</label>
                    <input className={registerErrors.cgpa ? 'input-error' : ''} type="text" required value={rf.cgpa} onChange={event => updateRegisterField('cgpa', event.target.value)} />
                    {registerErrors.cgpa && <div className="field-error">{registerErrors.cgpa}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Skills * (comma separated)</label>
                  <input className={registerErrors.skills ? 'input-error' : ''} type="text" required value={rf.skills} onChange={event => updateRegisterField('skills', event.target.value)} />
                  {registerErrors.skills && <div className="field-error">{registerErrors.skills}</div>}
                </div>

                <div className="form-group">
                  <label>LinkedIn URL *</label>
                  <div className={`url-input-wrap${registerErrors.linkedinUrl ? ' input-error' : ''}`}>
                    <span className="url-input-icon">in</span>
                    <input
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://www.linkedin.com/in/your-profile"
                      required
                      value={rf.linkedinUrl}
                      onChange={event => updateRegisterField('linkedinUrl', event.target.value)}
                    />
                  </div>
                  <div className="form-hint">Use your full LinkedIn profile link.</div>
                  {registerErrors.linkedinUrl && <div className="field-error">{registerErrors.linkedinUrl}</div>}
                </div>

                <div className="form-group">
                  <label>Cover Note *</label>
                  <textarea className={registerErrors.coverNote ? 'input-error' : ''} rows={3} required value={rf.coverNote} onChange={event => updateRegisterField('coverNote', event.target.value)} />
                  {registerErrors.coverNote && <div className="field-error">{registerErrors.coverNote}</div>}
                </div>

                <div className="form-group">
                  <label>Resume * (PDF/DOCX, max 5MB)</label>
                  <input className={registerErrors.resume ? 'input-error' : ''} type="file" accept=".pdf,.docx" required onChange={event => updateRegisterField('resume', event.target.files?.[0] || null)} />
                  {registerErrors.resume && <div className="field-error">{registerErrors.resume}</div>}
                  {rf.resume && (
                    <div className="file-badge">
                      <strong>Attached</strong>
                      <span>{rf.resume.name}</span>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-gold btn-full btn-lg" disabled={loading || !otpVerified}>
                  {loading ? 'Submitting...' : 'Send for Approval'}
                </button>

                <p className="auth-inline-note">
                  Already registered? <button type="button" className="btn-link" onClick={openLogin}>Sign in</button>
                </p>
            </form>
          )}
        </div>
      </div>

      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal auth-modal" onClick={event => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowForgotPassword(false)}>
              x
            </button>
            <div className="auth-heading" style={{ marginBottom: 20 }}>
              <h3>Reset password</h3>
              <p>Enter your existing student email and set a new password for your account.</p>
            </div>

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label>Existing Email</label>
                <input type="email" required value={ff.email} onChange={event => setFf(prev => ({ ...prev, email: event.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" required value={ff.newPassword} onChange={event => setFf(prev => ({ ...prev, newPassword: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" required value={ff.confirmPassword} onChange={event => setFf(prev => ({ ...prev, confirmPassword: event.target.value }))} />
                </div>
              </div>

              <div className="btn-row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForgotPassword(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'For Students',
    description: 'Create your profile, upload resume details, and track every application from one dashboard.',
  },
  {
    title: 'For Placement Admins',
    description: 'Review registrations, publish jobs, manage applicants, and monitor selected students faster.',
  },
  {
    title: 'Centralized Workflow',
    description: 'Keep registration, job posting, application review, and final selections inside one portal.',
  },
];

const steps = [
  'Student registration',
  'Admin approval',
  'Jobs published',
  'Applications submitted',
  'Selections tracked',
];

const metrics = [
  { value: '2026', label: 'Placement Season' },
  { value: 'One', label: 'Unified campus portal' },
  { value: 'Fast', label: 'Approval to selection flow' },
];

export default function HomePage() {
  const scrollStateRef = useRef({
    current: 0,
    target: 0,
    frame: 0,
    isAnimating: false,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    if (mediaQuery.matches || coarsePointer.matches) {
      return undefined;
    }

    const state = scrollStateRef.current;
    state.current = window.scrollY;
    state.target = window.scrollY;

    const stopAnimation = () => {
      if (state.frame) {
        window.cancelAnimationFrame(state.frame);
        state.frame = 0;
      }
      state.isAnimating = false;
    };

    const animateScroll = () => {
      const distance = state.target - state.current;

      if (Math.abs(distance) < 0.5) {
        state.current = state.target;
        window.scrollTo(0, state.target);
        stopAnimation();
        return;
      }

      state.current += distance * 0.14;
      window.scrollTo(0, state.current);
      state.frame = window.requestAnimationFrame(animateScroll);
    };

    const startAnimation = () => {
      if (state.isAnimating) return;
      state.isAnimating = true;
      state.frame = window.requestAnimationFrame(animateScroll);
    };

    const getMaxScroll = () => {
      const doc = document.documentElement;
      return Math.max(doc.scrollHeight - window.innerHeight, 0);
    };

    const handleWheel = (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;

      event.preventDefault();
      const nextTarget = state.target + event.deltaY;
      state.target = Math.min(Math.max(nextTarget, 0), getMaxScroll());
      startAnimation();
    };

    const handleScroll = () => {
      if (state.isAnimating) return;
      state.current = window.scrollY;
      state.target = window.scrollY;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      stopAnimation();
    };
  }, []);

  const scrollToPosition = (top, hash = '') => {
    const state = scrollStateRef.current;
    state.current = window.scrollY;
    state.target = Math.max(top, 0);

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: 'smooth',
    });

    const nextUrl = hash ? `#${hash}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    scrollToPosition(0);
  };

  return (
    <div className="home-page">
      <header className="home-nav">
        <a href="#top" className="home-brand" onClick={scrollToTop}>
          <div className="home-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#c9a84c" aria-hidden="true">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-8.99 9.18L12 17l8.99-4.82.01 4.09-9 4.91-9-4.91.01-4.09z" />
            </svg>
          </div>
          <div>
            <h1>GIT Placement Portal</h1>
            <p>Campus Recruitment System</p>
          </div>
        </a>

        <nav className="home-nav-links">
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/register" className="btn btn-gold btn-sm">Register</Link>
        </nav>
      </header>

      <main className="home-shell">
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-kicker">Placement Season 2026</div>
            <h2>Campus placements, arranged in one professional portal.</h2>
            <p>
              A simple entry point for students and placement administrators to handle registrations,
              jobs, applications, and final selections with better clarity.
            </p>

            <div className="home-cta">
              <Link to="/register" className="btn btn-gold btn-lg">Student Register</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
            </div>

            <div className="home-metrics">
              {metrics.map(metric => (
                <div key={metric.label} className="home-metric-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="home-hero-panel">
            <div className="home-panel-card home-panel-card-primary">
              <span>Student onboarding</span>
              <strong>Register academic details, skills, resume, and profile links in one place.</strong>
            </div>
            <div className="home-panel-grid">
              <div className="home-panel-card">
                <span>Job publishing</span>
                <strong>Post openings with deadlines, departments, and eligibility criteria.</strong>
              </div>
              <div className="home-panel-card">
                <span>Selection tracking</span>
                <strong>Monitor shortlisted and selected students without scattered records.</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="home-section">
          <div className="home-section-head">
            <span>Why this portal</span>
            <h3>Built to support the full placement cycle.</h3>
          </div>

          <div className="home-feature-grid">
            {features.map(feature => (
              <article key={feature.title} className="home-feature-card">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="home-section home-section-accent">
          <div className="home-section-head">
            <span>How it works</span>
            <h3>From registration to final selection.</h3>
          </div>

          <div className="home-step-row">
            {steps.map((step, index) => (
              <div key={step} className="home-step-card">
                <strong>{`0${index + 1}`}</strong>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-cta-banner">
            <div>
              <span>Get started</span>
              <h3>Ready to begin your placement journey?</h3>
              <p>Students can register for approval, and admins can sign in to manage the season.</p>
            </div>
            <div className="home-cta-banner-actions">
              <Link to="/register" className="btn btn-gold">Register Now</Link>
              <Link to="/login" className="btn btn-primary">Login to Portal</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

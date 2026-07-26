import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Link2,
  Activity,
  UserX,
  AlertTriangle,
  Eye,
  Building2,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Server,
  FileText,
  Hash,
  Smartphone,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

// ── Unsplash Image URLs (direct CDN, free for commercial use) ──
// Hero: doctor using tablet, calm clinical setting
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80&auto=format&fit=crop";
const HERO_IMAGE_LG =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80&auto=format&fit=crop";
// Step 1 — Register: person holding smartphone with app screen
const STEP1_IMAGE =
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80&auto=format&fit=crop";
// Step 2 — Consent or Emergency: doctor showing tablet to patient
const STEP2_IMAGE =
  "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&q=80&auto=format&fit=crop";
// Step 3 — Tamper-Evident Record: closed padlock on black
const STEP3_IMAGE =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80&auto=format&fit=crop";
// For Hospitals: doctor at hospital reception/lobby desk
const HOSPITAL_IMAGE =
  "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80&auto=format&fit=crop";
const HOSPITAL_IMAGE_LG =
  "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&q=80&auto=format&fit=crop";

// ── Lazy image with fallback ────────────────────────────────
function SafeImage({ src, srcLg, alt, className = "", aspectRatio = "16/9" }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-card bg-primary-100 ${className}`}
      style={{ aspectRatio }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-8 w-8 text-primary-300 mx-auto" />
            <p className="text-xs text-slate-400 mt-1">{alt}</p>
          </div>
        </div>
      ) : (
        <picture>
          {srcLg && <source media="(min-width: 1024px)" srcSet={srcLg} />}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </picture>
      )}
    </div>
  );
}

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-primary-900"
        }`}
      >
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              to="/"
              className={`flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight ${
                scrolled ? "text-primary-900" : "text-white"
              }`}
            >
              <span className="w-7 h-7 bg-primary-500 rounded flex items-center justify-center text-white text-xs font-bold">
                MT
              </span>
              MedTrace
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-slate-600 hover:text-primary-500"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register/patient"
                className="btn-primary text-sm px-4 py-1.5"
              >
                Get Your Health ID
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary-900 text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/10 to-transparent" />
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative grid lg:grid-cols-[1fr_0.9fr] gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-button border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-primary-100">
                <HeartPulse className="h-3.5 w-3.5 text-success-500" />
                Emergency-ready records with patient consent
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight mb-4">
                Your medical history, ready the moment it's needed most.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-lg">
                MedTrace is a consent-based, emergency-capable digital
                medical-history platform. Your data stays private until you
                grant access — or when every second counts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register/patient"
                  className="btn-primary text-base px-8 py-3 text-center inline-flex items-center justify-center gap-2"
                >
                  Get Your Health ID <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/register/hospital"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 px-8 py-3 rounded-button font-medium hover:bg-white/20 transition-colors text-base text-center"
                >
                  <Building2 className="h-4 w-4" /> For Hospitals & Doctors
                </Link>
              </div>
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                {[
                  ["14-digit", "Health ID"],
                  ["OTP", "Consent access"],
                  ["Hash", "Audit trail"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-card border border-white/10 bg-white/5 p-3"
                  >
                    <div className="text-lg font-bold text-white">{value}</div>
                    <div className="text-xs text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <SafeImage
                src={HERO_IMAGE}
                srcLg={HERO_IMAGE_LG}
                alt="Doctor using a tablet in a calm clinical setting — reviewing patient records"
                className="shadow-soft ring-1 ring-white/10"
                aspectRatio="4/3"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Credibility Strip ────────────────── */}
      <div className="bg-primary-100 border-y border-primary-200">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-primary-500" /> MERN Stack
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-primary-500" /> SHA-256
              Tamper-Evident Logging
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary-500" /> AES-256
              Encryption at Rest
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary-500" /> PWA Ready
            </span>
          </div>
        </div>
      </div>

      {/* ── The Problem ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-4">
            The Problem We Solve
          </h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto text-sm sm:text-base">
            Three critical gaps in emergency healthcare that MedTrace addresses
          </p>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: UserX,
                title: "Unconscious Patient",
                desc: "Emergency responders have no access to critical medical history when a patient cannot communicate.",
              },
              {
                icon: AlertTriangle,
                title: "Unknown Allergies",
                desc: "Doctors prescribe without knowing about dangerous drug allergies or interactions.",
              },
              {
                icon: Eye,
                title: "No Visibility",
                desc: "Patients have no way to track who accessed their medical records and when.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-bg">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-4">
            How MedTrace Works
          </h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto text-sm sm:text-base">
            Three simple steps to secure, accessible medical records
          </p>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                num: "01",
                img: STEP1_IMAGE,
                title: "Register",
                desc: "Get your unique 14-digit Health ID and store your medical history securely.",
                icon: FileText,
              },
              {
                num: "02",
                img: STEP2_IMAGE,
                title: "Consent or Emergency",
                desc: "Grant OTP-based access to doctors, or rely on the Glass-Break protocol in emergencies.",
                icon: Shield,
                dualIcons: true,
              },
              {
                num: "03",
                img: STEP3_IMAGE,
                title: "Tamper-Evident Record",
                desc: "Every access is logged on a hash-chained audit trail that cannot be altered.",
                icon: Link2,
              },
            ].map((step) => (
              <div
                key={step.num}
                className="card hover:-translate-y-1 hover:shadow-soft transition-all"
              >
                <SafeImage
                  src={step.img}
                  alt={`${step.title} — MedTrace workflow step`}
                  className="mb-4"
                  aspectRatio="4/3"
                />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-primary-500">
                    {step.num}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-1">
                  {step.title}
                </h3>
                {step.dualIcons && (
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1 text-xs text-primary-500">
                      <CheckCircle className="h-3.5 w-3.5" /> Consent
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 text-xs text-emergency-500">
                      <AlertTriangle className="h-3.5 w-3.5" /> Emergency
                    </span>
                  </div>
                )}
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Glass-Break Explainer ────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-emergency-500" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-900">
                  Emergency Glass-Break Protocol
                </h2>
                <p className="text-sm text-slate-500">
                  Our unique emergency access system provides four layers of
                  protection
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              {[
                "Only approved doctors can initiate emergency access",
                "Explicit two-step confirmation prevents accidental triggers",
                "Only minimum necessary fields are released (blood group, allergies, medications)",
                "All emergency access is logged and nominees are notified immediately",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-button hover:bg-emergency-100/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emergency-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emergency-500" />
                  </div>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Security ────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-bg">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-4">
            Trust & Security
          </h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto text-sm sm:text-base">
            Built on proven security standards, not marketing claims
          </p>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Link2,
                title: "Hash-Chained Audit",
                desc: "SHA-256 hash chain ensures every access event is verifiable and tamper-proof. Each entry links cryptographically to the previous one.",
              },
              {
                icon: Lock,
                title: "AES-256 Encryption",
                desc: "Sensitive medical data is encrypted at rest with industry-standard AES-256 encryption. MongoDB Atlas provides enterprise-grade security.",
              },
              {
                icon: Shield,
                title: "Multi-Factor Auth",
                desc: "Email OTP-based MFA on every login and every access request. JWT access tokens with automatic refresh rotation prevent session hijacking.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="card hover:-translate-y-1 hover:shadow-soft transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary-500" />
                </div>
                <h3 className="text-base font-semibold text-primary-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Hospitals ───────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">
                For Hospitals
              </h2>
              <p className="text-slate-500 mb-6 max-w-md">
                Manage doctor verification, monitor emergency access alerts in
                real-time, and verify the integrity of the entire audit chain
                with a single click.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Doctor registration with admin approval workflow",
                  "Real-time Glass-Break alerts via Socket.io",
                  "Full-chain audit verification tool",
                  "Role-based dashboards with data visualizations",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register/hospital"
                className="btn-primary inline-flex items-center gap-2"
              >
                Register Your Hospital <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <SafeImage
                src={HOSPITAL_IMAGE}
                srcLg={HOSPITAL_IMAGE_LG}
                alt="Doctor speaking with someone at a hospital reception desk — MedTrace is used in real healthcare institutions"
                className="shadow-sm"
                aspectRatio="16/9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-primary-900 text-slate-400 py-10">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-7 h-7 bg-primary-500 rounded flex items-center justify-center text-white text-xs font-bold">
                MT
              </span>
              MedTrace
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">
                Patient Sign In
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Doctor Sign In
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Admin Sign In
              </Link>
              <Link
                to="/register/patient"
                className="hover:text-white transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
          <div className="border-t border-primary-700 pt-6 text-center text-xs">
            <p>
              &copy; {new Date().getFullYear()} MedTrace. Secure medical record
              access. Built with the MERN stack.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

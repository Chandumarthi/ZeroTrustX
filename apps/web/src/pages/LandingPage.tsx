import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  Fingerprint,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col selection:bg-cyber-500/30 selection:text-cyber-300 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-[650px] h-[650px] bg-cyber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Cyber Grid Pattern */}
      <div
        className="fixed inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_50%_at_50%_25%,#000_70%,transparent_100%)] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Navigation Header */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500/20 to-blue-600/20 border border-cyber-400/40 flex items-center justify-center text-cyber-400 group-hover:shadow-cyber-md transition-all duration-300">
            <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wider font-mono flex items-center gap-1">
              ZEROTRUST<span className="text-cyber-400">X</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Adaptive Authentication
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyber-400/30 bg-cyber-500/10 text-cyber-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fadeIn shadow-cyber-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyber-400" />
          <span>Next-Generation Risk-Based Access Control</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Intelligent Security.{' '}
          <span className="bg-gradient-to-r from-cyber-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Adaptive Trust.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Never trust, always verify. ZeroTrustX replaces rigid, binary authentication with
          real-time AI risk evaluation—dynamically enforcing multi-factor challenges only when risk warrants it.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-sm sm:text-base px-8 py-3.5"
            >
              Start Free Trial / Demo
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Lock className="w-4 h-4 text-cyber-400" />}
              className="w-full sm:w-auto text-sm sm:text-base px-8 py-3.5"
            >
              Enterprise Sign In
            </Button>
          </Link>
        </div>

        {/* Security Platform Mock Visualization */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl p-1 bg-gradient-to-b from-cyber-500/30 via-slate-700/40 to-transparent shadow-2xl">
          <div className="rounded-2xl bg-navy-850/90 backdrop-blur-xl border border-slate-750 p-6 sm:p-8 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 font-mono text-slate-300">zerotrust-engine :: live telemetry</span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                [LIVE DEMO ILLUSTRATION]
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Context Vector</span>
                  <span className="text-cyber-400 font-mono">192.168.1.104</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">Normal Geolocation</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-1/4 rounded-full" />
                </div>
                <p className="text-[11px] text-emerald-400">Risk Score: 12 (LOW) → ALLOW</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/80 border border-cyber-500/30 space-y-2 shadow-cyber-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Adaptive Challenge</span>
                  <span className="text-amber-400 font-mono">Unrecognized Device</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">Step-Up Required</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-2/3 rounded-full" />
                </div>
                <p className="text-[11px] text-amber-400">Risk Score: 68 (MEDIUM) → OTP SENT</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/80 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Threat Mitigation</span>
                  <span className="text-rose-400 font-mono">Tor Exit Node</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">Access Denied</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-full rounded-full" />
                </div>
                <p className="text-[11px] text-rose-400">Risk Score: 96 (CRITICAL) → BLOCK</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyber-400 mb-3">
            The Legacy Perimeter is Broken
          </h2>
          <h3 className="text-2xl sm:text-4xl font-bold text-white">
            Why Static Authentication Fails Enterprise Security
          </h3>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Traditional password and static token solutions assume that once credentials match, the session remains benign indefinitely. Real-world credential stuffing, session hijacking, and account takeovers prove otherwise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <KeyRound className="w-5 h-5 text-rose-400" />,
              title: 'Stolen Credentials',
              description: 'Breached passwords allow attackers to log in silently without triggering alerts in standard systems.',
            },
            {
              icon: <Smartphone className="w-5 h-5 text-amber-400" />,
              title: 'MFA Fatigue & Burnout',
              description: 'Prompting 2FA on every routine request annoys users while still leaving anomalous sessions unverified.',
            },
            {
              icon: <Globe className="w-5 h-5 text-sky-400" />,
              title: 'Impossible Travel',
              description: 'Logins from Tokyo and London within 10 minutes pass standard credentials without geolocation intelligence.',
            },
            {
              icon: <ShieldAlert className="w-5 h-5 text-violet-400" />,
              title: 'Binary Trust Fallacy',
              description: 'A binary "authenticated" state gives full access to internal assets even when behavioral anomalies surface.',
            },
          ].map((item, idx) => (
            <Card key={idx} className="p-6 border border-slate-800 bg-navy-850/40">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h4 className="text-base font-semibold text-slate-100">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works / Workflow Pipeline */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyber-400 mb-3">
            Continuous Verification Loop
          </h2>
          <h3 className="text-2xl sm:text-4xl font-bold text-white">
            How ZeroTrustX Evaluates Every Request
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            { step: '01', title: 'Identity', desc: 'User presents primary credentials & identity claim' },
            { step: '02', title: 'Context Telemetry', desc: 'Extracts IP reputation, device fingerprint, hour, and geography' },
            { step: '03', title: 'AI Risk Engine', desc: 'scikit-learn model evaluates probability of anomaly' },
            { step: '04', title: 'Policy Engine', desc: 'Aggregates risk score into ALLOW, STEP_UP, RESTRICT, or BLOCK' },
            { step: '05', title: 'Adaptive Access', desc: 'Grants seamless entry or dispatches instant 6-digit OTP' },
          ].map((st, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-navy-850/80 border border-slate-800 flex flex-col justify-between hover:border-cyber-400/50 transition-all duration-300"
            >
              <div>
                <span className="text-2xl font-mono font-bold text-cyber-400/60">{st.step}</span>
                <h4 className="text-base font-bold text-white mt-2">{st.title}</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{st.desc}</p>
              </div>
              <div className="mt-4 flex items-center text-cyber-400 text-xs font-semibold gap-1">
                <span>Verified</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyber-400 mb-3">
            Platform Capabilities
          </h2>
          <h3 className="text-2xl sm:text-4xl font-bold text-white">
            Engineered for Modern Enterprise Security
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <BrainCircuit className="w-6 h-6 text-cyber-400" />,
              title: 'AI Behavioral Risk Engine',
              desc: 'Trained Machine Learning algorithms quantify threat level between 0 and 100 based on continuous behavioral telemetry.',
            },
            {
              icon: <Fingerprint className="w-6 h-6 text-blue-400" />,
              title: 'Adaptive Multi-Factor Authentication',
              desc: 'Seamless passwordless experience for trusted devices; zero friction until elevated threat patterns emerge.',
            },
            {
              icon: <Radio className="w-6 h-6 text-emerald-400" />,
              title: 'Real-Time Telemetry & Monitoring',
              desc: 'Live activity streams displaying authentication decisions, anomalous IP origins, and user agent distributions.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-violet-400" />,
              title: 'Dynamic Policy Orchestration',
              desc: 'Configure flexible risk thresholds for low, medium, and high threat tolerance across corporate roles.',
            },
            {
              icon: <Terminal className="w-6 h-6 text-amber-400" />,
              title: 'Comprehensive Audit Logs',
              desc: 'Immutable security logs recording every verification request, IP origin, rule violations, and outcomes.',
            },
            {
              icon: <Zap className="w-6 h-6 text-rose-400" />,
              title: 'Sub-50ms Latency Overhead',
              desc: 'High-performance microservices architecture ensuring zero disruption to enterprise authentication pipelines.',
            },
          ].map((f, i) => (
            <Card key={i} className="p-6 border border-slate-800 bg-navy-850/50 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-navy-900 border border-slate-750 flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <h4 className="text-lg font-semibold text-slate-100">{f.title}</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Full-Stack Production Architecture</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Built with modular, battle-tested modern frameworks for maximum security and throughput.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-navy-850 border border-slate-800 text-center">
            <Cpu className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <h5 className="text-sm font-semibold text-slate-200">React + Vite</h5>
            <p className="text-[11px] text-slate-400 mt-1">TypeScript & Tailwind CSS</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-850 border border-slate-800 text-center">
            <Server className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h5 className="text-sm font-semibold text-slate-200">Node + Express</h5>
            <p className="text-[11px] text-slate-400 mt-1">TypeScript & Prisma ORM</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-850 border border-slate-800 text-center">
            <Layers className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <h5 className="text-sm font-semibold text-slate-200">Python + Flask</h5>
            <p className="text-[11px] text-slate-400 mt-1">scikit-learn ML Risk Engine</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-850 border border-slate-800 text-center">
            <Database className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <h5 className="text-sm font-semibold text-slate-200">PostgreSQL</h5>
            <p className="text-[11px] text-slate-400 mt-1">Relational Audit Store</p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-r from-navy-800 via-navy-850 to-navy-800 border border-cyber-500/40 p-8 sm:p-14 shadow-glass relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Upgrade to Adaptive Access Control?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mt-4 leading-relaxed">
              Deploy ZeroTrustX to safeguard your critical APIs and enterprise workstations with real-time risk intelligence.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Access Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-6 bg-navy-950/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Shield className="w-4 h-4 text-cyber-400" />
            <span className="font-mono font-semibold text-slate-200">ZeroTrustX</span>
            <span>— AI-Powered Adaptive Authentication Platform</span>
          </div>
          <div>
            <span>Academic Capstone & Enterprise Cybersecurity Architecture Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

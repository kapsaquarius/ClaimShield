import Link from "next/link";
import { User, Building2, ArrowRight, Activity, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10" />

      <header className="absolute top-0 left-0 w-full p-8 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-10 h-10 text-accent" />
          <h1 className="text-3xl font-bold tracking-tight text-white">ClaimShield</h1>
        </div>
      </header>

      <main className="max-w-4xl w-full flex flex-col items-center z-10 space-y-12 pt-32">
        <div className="text-center space-y-6">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 pb-2">
            Healthcare Transparency <br /> Reimagined.
          </h2>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AI-powered auditing for patients and insurers. Detect overcharging, visualize data, and reclaim control over healthcare costs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full">
          <Link href="/patient" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative h-full glass-panel rounded-3xl p-8 flex flex-col items-start space-y-6 hover:translate-y-[-4px] transition-transform duration-300">
              <div className="p-4 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white">For Patients</h3>
                <p className="text-slate-400">
                  Upload your medical bills and Clinical Notes. Our AI detects mismatches and potential overcharging instantly.
                </p>
              </div>
              <div className="mt-auto flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                Start Audit <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link href="/insurance" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-teal-600 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative h-full glass-panel rounded-3xl p-8 flex flex-col items-start space-y-6 hover:translate-y-[-4px] transition-transform duration-300">
              <div className="p-4 rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                <Building2 className="w-10 h-10 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white">For Insurers</h3>
                <p className="text-slate-400">
                  Access real-time hospital data analytics. Visualize trends and monitor healthcare spending efficiency.
                </p>
              </div>
              <div className="mt-auto flex items-center text-accent font-semibold group-hover:translate-x-2 transition-transform">
                View Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-8 flex items-center space-x-8 text-slate-500 text-sm font-medium">
          <div className="flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" />
            Secure & Private
          </div>
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Real-time Analysis
          </div>
        </div>
      </main >
    </div >
  );
}

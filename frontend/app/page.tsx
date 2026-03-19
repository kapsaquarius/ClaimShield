"use client";

import Link from "next/link";
import { User, Building2, ArrowRight, Activity, ShieldCheck, LogIn, LogOut, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (session) {
      setShowRoleModal(true);
    } else {
      setShowRoleModal(false);
    }
  }, [session]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10" />

      <header className="absolute top-0 left-0 w-full p-8 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-10 h-10 text-accent" />
          <h1 className="text-3xl font-bold tracking-tight text-white">ClaimShield</h1>
        </div>

        <div>
          {session ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-800/50 pr-4 pl-1 py-1 rounded-full border border-white/5">
                {session.user?.image ? (
                  <img src={session.user.image} alt={session.user.name || "User"} className="w-8 h-8 rounded-full shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-200">{session.user?.name?.split(' ')[0]}</span>
              </div>
              <button onClick={() => signOut()} className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-white/5 shadow-sm">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button onClick={() => signIn('google')} className="flex items-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow-sm">
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
            </button>
          )}
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
          <div 
            onClick={() => session ? router.push('/patient') : signIn('google', { callbackUrl: '/patient' })} 
            className="group relative cursor-pointer"
          >
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
          </div>

          <div 
            onClick={() => session ? router.push('/insurance') : signIn('google', { callbackUrl: '/insurance' })} 
            className="group relative cursor-pointer"
          >
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
          </div>
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

      <AnimatePresence>
        {showRoleModal && session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-32 blur-3xl rounded-full -mr-16 -mt-16 opacity-10 bg-primary" />
              <div className="absolute bottom-0 left-0 p-32 blur-3xl rounded-full -ml-16 -mb-16 opacity-10 bg-accent" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 overflow-hidden mb-2">
                  <img src={session.user?.image || ""} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Welcome, {session.user?.name?.split(' ')[0]}!</h2>
                  <p className="text-slate-400">Please select your portal to continue.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-6">
                  <button 
                    onClick={() => router.push('/patient')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800/50 hover:bg-primary/20 hover:border-primary/50 border border-white/5 rounded-2xl transition-all group"
                  >
                    <User className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-lg">Patient Portal</span>
                    <span className="text-sm text-slate-400 mt-1 text-center">Audit medical claims</span>
                  </button>

                  <button 
                    onClick={() => router.push('/insurance')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800/50 hover:bg-accent/20 hover:border-accent/50 border border-white/5 rounded-2xl transition-all group"
                  >
                    <Building2 className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-lg">Insurer Portal</span>
                    <span className="text-sm text-slate-400 mt-1 text-center">Network analytics</span>
                  </button>
                </div>

                <div className="w-full pt-4 flex justify-between items-center text-sm">
                   <button 
                      onClick={() => signOut()}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                   >
                     Wrong account? Sign out
                   </button>
                   <button 
                      onClick={() => setShowRoleModal(false)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                   >
                     Cancel
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}

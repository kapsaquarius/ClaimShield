'use client';

import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PatientPortal() {
  const router = useRouter();
  const [soapFile, setSoapFile] = useState<File | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soapFile || !billFile) {
      setError("Please upload both documents (Clinical Notes & Hospital Bill) to proceed.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("clinical_notes", soapFile);
      formData.append("hospital_bill", billFile);

      const response = await fetch("http://localhost:8000/api/audit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Audit analysis failed. Please try again.");
      }

      const result = await response.json();
      localStorage.setItem("auditResult", JSON.stringify(result));

      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      };

      try {
        const soapBase64 = await convertToBase64(soapFile);
        const billBase64 = await convertToBase64(billFile);
        localStorage.setItem("uploadedSoapPdf", soapBase64);
        localStorage.setItem("uploadedBillPdf", billBase64);
      } catch (e) {
        console.error("Failed to store file previews:", e);
      }

      router.push("/patient/results");

    } catch (err) {
      console.error(err);
      setError("Failed to process documents. Please ensure the backend is running.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 relative flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10" />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center z-20"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div
                className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 border-4 border-t-transparent border-r-accent border-b-transparent border-l-transparent rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Analyzing Documents</h2>
            <p className="text-slate-400 text-lg">Cross-referencing Clinical Notes with Billing Codes...</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full min-h-screen z-10 flex flex-col"
          >
            <header className="absolute top-0 left-0 w-full flex justify-between items-center p-8 z-50">
              <Link href="/">
                <Image
                  src="/claimshield-logo.png"
                  alt="ClaimShield Logo"
                  width={250}
                  height={70}
                  className="h-16 w-auto"
                />
              </Link>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
                Patient Portal
              </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h1 className="text-5xl font-extrabold text-white leading-tight">
                    Verify Your Claims<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Medical Bills</span>
                  </h1>
                  <p className="text-slate-400 text-lg max-w-md">
                    Upload your doctor's Clinical Notes and the final hospital bill. Our AI will cross-reference them to detect phantom charges, upcoding, and billing errors.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      HIPAA Compliant
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Instant Analysis
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Doctor's Clinical Notes</label>
                      <div
                        className={cn(
                          "relative group overflow-hidden rounded-xl p-6 border-dashed border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-800/50",
                          soapFile ? "border-accent/50 bg-accent/5" : "border-slate-700"
                        )}
                        onClick={() => document.getElementById('soap-input')?.click()}
                      >
                        <input
                          id="soap-input"
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => setSoapFile(e.target.files?.[0] || null)}
                        />
                        {soapFile ? (
                          <div className="flex items-center text-accent z-10">
                            <CheckCircle className="w-8 h-8 mr-3" />
                            <div className="text-left">
                              <p className="font-semibold">{soapFile.name}</p>
                              <p className="text-xs opacity-70">Ready for analysis</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <FileText className="w-10 h-10 text-slate-500 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-slate-300 font-medium">Click to upload Clinical Notes</p>
                            <p className="text-xs text-slate-500 mt-1">Images or PDF accepted</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Hospital Bill</label>
                      <div
                        className={cn(
                          "relative group overflow-hidden rounded-xl p-6 border-dashed border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-800/50",
                          billFile ? "border-primary/50 bg-primary/5" : "border-slate-700"
                        )}
                        onClick={() => document.getElementById('bill-input')?.click()}
                      >
                        <input
                          id="bill-input"
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                        />
                        {billFile ? (
                          <div className="flex items-center text-primary z-10">
                            <CheckCircle className="w-8 h-8 mr-3" />
                            <div className="text-left">
                              <p className="font-semibold">{billFile.name}</p>
                              <p className="text-xs opacity-70">Ready for analysis</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-slate-500 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-slate-300 font-medium">Click to upload Final Bill</p>
                            <p className="text-xs text-slate-500 mt-1">Images or PDF accepted</p>
                          </>
                        )}
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Start Audit Analysis <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </form>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

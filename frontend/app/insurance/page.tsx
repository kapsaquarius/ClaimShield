'use client';

import { useState } from "react";
import dynamic from 'next/dynamic';

const InsuranceChart = dynamic(() => import('@/components/InsuranceChart'), { ssr: false });
import { Building2, TrendingUp, Download, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function InsurancePortal() {
  const [data, setData] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/getgraphs');
      if (!res.ok) throw new Error("Failed to fetch data");

      const jsonData = await res.json();
      if (Array.isArray(jsonData)) {
        setData(jsonData);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (err) {
      setError("Failed to retrieve hospital data. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = data?.map((val, idx) => ({ name: `Day ${idx + 1}`, value: val })) || [];

  return (
    <div className="min-h-screen p-6 relative flex flex-col items-center">
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-6xl z-10 flex flex-col space-y-8">
        <header className="flex justify-between items-center py-4">
          <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            NexHacks Audit
          </Link>
          <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium border border-accent/20">
            Insurance Portal
          </div>
        </header>

        <main className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-white">Hospital Analytics</h1>
              <p className="text-slate-400 max-w-xl">
                Real-time spending analysis and overcharge detection metrics across your network.
              </p>
            </div>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-6 py-3 bg-accent text-slate-900 font-bold rounded-xl shadow-lg shadow-accent/25 hover:bg-accent/90 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {isLoading ? "Fetching Data..." : "Get Hospital Data"}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="w-full min-h-[500px] glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col">
            {!data && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/40 backdrop-blur-sm">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-300">No Data Loaded</h3>
                <p className="text-slate-500 mt-2">Click "Get Hospital Data" to view analytics.</p>
              </div>
            )}

            {data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex-1 min-h-[400px] flex items-center justify-center"
              >

                <InsuranceChart data={chartData} />
              </motion.div>
            )}
          </div>

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl">
                <p className="text-slate-400 text-sm mb-1">Total Cases</p>
                <p className="text-3xl font-bold text-white">{data.length}</p>
              </div>
              <div className="glass-panel p-6 rounded-2xl">
                <p className="text-slate-400 text-sm mb-1">Average Value</p>
                <p className="text-3xl font-bold text-accent">
                  {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1)}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl">
                <p className="text-slate-400 text-sm mb-1">Max Value</p>
                <p className="text-3xl font-bold text-primary">{Math.max(...data)}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

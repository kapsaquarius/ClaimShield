'use client';

import { useState } from "react";
import {
  Building2,
  ChevronLeft,
  Stethoscope,
  Activity,
  DollarSign,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  MoreVertical,
  BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ComposedChart, CartesianGrid, ReferenceLine, Label
} from 'recharts';
import hospitalsData from "../hospitals_data.json";

// Type definitions based on the JSON structure
interface Record {
  cpt_code: string;
  error_type: string | null;
  reason: string | null;
  evidence_quote: string;
  suggested_code: string | null;
  suggested_code_explanation: string | null;
  charged_amount: number;
  medicare_rate: number;
  gouging_multiple: number | string;
}

interface DoctorData {
  [doctorName: string]: Record[];
}

interface HospitalData {
  [hospitalName: string]: DoctorData;
}

interface ZipData {
  [zipCode: string]: HospitalData;
}

const data = hospitalsData as ZipData;
const ZIP_CODES = Object.keys(data);

export default function InsurancePortal() {
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [activeMenuDoctor, setActiveMenuDoctor] = useState<string | null>(null);
  const [chartModalData, setChartModalData] = useState<{ type: 'DONUT' | 'GOUGING', doctorName: string, records: Record[] } | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Helper to safely get numeric gouging multiple
  const getGougingVal = (val: number | string) => {
    if (typeof val === 'number') return val;
    if (val === 'Infinity') return 100; // Cap visual representation
    return parseFloat(val) || 0;
  };

  // Aggregation Helpers
  const getDoctorStats = (records: Record[]) => {
    const totalCases = records.length;
    const totalCharged = records.reduce((acc, r) => acc + r.charged_amount, 0);
    const totalMedicare = records.reduce((acc, r) => acc + r.medicare_rate, 0);

    // Filter out infinity for average calculation if needed, or handle it
    const validGouging = records.filter(r => r.gouging_multiple !== "Infinity");
    const avgGouging = validGouging.length > 0
      ? validGouging.reduce((acc, r) => acc + (r.gouging_multiple as number), 0) / validGouging.length
      : 0;

    return {
      totalCases,
      avgCharged: totalCharged / totalCases,
      avgMedicare: totalMedicare / totalCases,
      avgGouging: avgGouging,
      hasInfinityGouging: records.some(r => r.gouging_multiple === "Infinity")
    };
  };

  const calculateErrorBreakdown = (records: Record[]) => {
    const counts: { [key: string]: number } = {};
    records.forEach(r => {
      const type = r.error_type || "Valid Claim";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const calculateGougingGap = (records: Record[]) => {
    return records.map((r, idx) => ({
      id: idx + 1,
      charged: r.charged_amount,
      medicare: r.medicare_rate,
      gouging: getGougingVal(r.gouging_multiple)
    })).sort((a, b) => b.charged - a.charged);
  };

  const calculateZipRiskData = (zipCode: string) => {
    if (!data[zipCode]) return [];

    return Object.keys(data[zipCode]).map(hospitalName => {
      const doctors = data[zipCode][hospitalName];
      // Aggregate all records for this hospital
      const allRecords: Record[] = [];
      Object.values(doctors).forEach(docRecords => allRecords.push(...docRecords));

      const totalRecords = allRecords.length;
      if (totalRecords === 0) return { name: hospitalName, x: 0, y: 0 };

      const totalMultiplier = allRecords
        .filter(r => r.gouging_multiple !== "Infinity")
        .reduce((sum, r) => sum + (r.gouging_multiple as number), 0);

      // For infinity, we might want to penalize or flag, but for average calculation let's skip or handle gracefully.
      // Here we just use valid multiples for the average X.
      const validCount = allRecords.filter(r => r.gouging_multiple !== "Infinity").length;
      const avgMultiplier = validCount > 0 ? totalMultiplier / validCount : 0;

      const errorCount = allRecords.filter(r => r.error_type !== null).length;
      const errorRate = errorCount / totalRecords;

      return {
        name: hospitalName,
        x: parseFloat(avgMultiplier.toFixed(2)),
        y: parseFloat(errorRate.toFixed(2))
      };
    });
  };

  const getHospitalStats = (hospitalName: string) => {
    if (!selectedZip) return { doctorCount: 0, totalCases: 0 };
    const hospital = data[selectedZip][hospitalName];
    const doctors = Object.keys(hospital);
    const totalCases = doctors.reduce((acc, doc) => acc + hospital[doc].length, 0);
    return { doctorCount: doctors.length, totalCases };
  };

  const handleBack = () => {
    if (selectedDoctor) {
      setSelectedDoctor(null);
    } else if (selectedHospital) {
      setSelectedHospital(null);
    } else if (selectedZip) {
      setSelectedZip(null);
    }
  };

  return (
    <div className="min-h-screen p-6 relative flex flex-col items-center bg-slate-950 font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-6xl z-10 flex flex-col space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <ShieldCheck className="w-10 h-10 text-accent group-hover:text-accent/80 transition-colors" />
            <span className="text-3xl font-bold text-white tracking-tight">
              ClaimShield
            </span>
          </Link>
          <div className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium border border-accent/20">
            Insurance Intelligence Portal
          </div>
        </header>

        <main className="space-y-8">

          {/* Main Content Area */}
          <div className="flex flex-col space-y-6">

            {/* Navigation / Breedcrumb-ish Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold text-white">Network Analytics</h1>
                <p className="text-slate-400 max-w-xl">
                  {selectedHospital
                    ? `Drill down analysis for ${selectedHospital}`
                    : selectedZip
                      ? `Hospitals in Zip Code ${selectedZip}`
                      : "Select a region to begin analysis"
                  }
                </p>
              </div>

              {/* Central Zip Selector (Always visible or moves?) User asked for central dropdown selector at top level */}
              {(!selectedZip || (selectedZip && !selectedHospital)) && (
                <div className="relative z-20">
                  {!selectedZip && (
                    <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800 backdrop-blur-sm">
                      <MapPin className="text-accent ml-2 w-5 h-5" />
                      <select
                        className="bg-transparent text-white text-lg font-medium focus:outline-none p-2 pr-8 cursor-pointer"
                        onChange={(e) => setSelectedZip(e.target.value)}
                        value={selectedZip || ""}
                      >
                        <option value="" disabled>Select Zip Code</option>
                        {ZIP_CODES.map(zip => (
                          <option key={zip} value={zip} className="bg-slate-900 text-white">
                            {zip}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Back Button */}
              {(selectedZip || selectedHospital || selectedDoctor) && (
                <div className="flex items-center gap-3">
                  {selectedZip && !selectedHospital && !selectedDoctor && (
                    <button
                      onClick={() => setShowStatsModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg flex items-center shadow-lg shadow-purple-500/20 transition-all font-medium"
                    >
                      <BarChart2 className="w-4 h-4 mr-2" />
                      General Statistics
                    </button>
                  )}
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center transition-all border border-slate-700/50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                </div>
              )}
            </div>

            {/* Content Container */}
            <div className="w-full min-h-[500px] glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col">

              <AnimatePresence mode="wait">

                {/* STATE 0: NO ZIP SELECTED */}
                {!selectedZip && (
                  <motion.div
                    key="select-zip"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-8 border border-accent/20">
                      <MapPin className="w-12 h-12 text-accent" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Select a Region</h2>
                    <p className="text-slate-400 max-w-md mb-8">
                      Choose a zip code from the dropdown above to view hospital performance data and doctor analytics.
                    </p>
                    {/* Re-render the select here for main focus if they missed the top one, or just prompt them up */}
                  </motion.div>
                )}

                {/* STATE 1: HOSPITAL SELECTION */}
                {selectedZip && !selectedHospital && (
                  <motion.div
                    key="select-hospital"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full"
                  >
                    {data[selectedZip] ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.keys(data[selectedZip]).map((hospitalName) => {
                          const stats = getHospitalStats(hospitalName);
                          return (
                            <motion.button
                              key={hospitalName}
                              onClick={() => setSelectedHospital(hospitalName)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex flex-col text-left bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 p-6 rounded-2xl transition-all group"
                            >
                              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <Building2 className="w-6 h-6 text-blue-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">{hospitalName}</h3>
                              <div className="flex items-center text-slate-400 text-sm gap-4">
                                <span className="flex items-center gap-1">
                                  <Stethoscope className="w-4 h-4" />
                                  {stats.doctorCount} Doctors
                                </span>
                                <span className="flex items-center gap-1">
                                  <Activity className="w-4 h-4" />
                                  {stats.totalCases} Records
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20">
                        <TrendingDown className="w-16 h-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-400">No data available for {selectedZip}</h3>
                      </div>
                    )}

                  </motion.div>
                )}

                {/* STATE 2: DOCTOR SELECTION */}
                {selectedZip && selectedHospital && (
                  <motion.div
                    key="select-doctor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.keys(data[selectedZip][selectedHospital]).map((doctorName) => {
                        const records = data[selectedZip][selectedHospital][doctorName];
                        const stats = getDoctorStats(records);

                        return (
                          <motion.div
                            key={doctorName}
                            className="relative group block"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <button
                              onClick={() => setSelectedDoctor(doctorName)}
                              className="flex flex-col text-left bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 p-6 rounded-2xl transition-all w-full h-full"
                            >
                              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                <Stethoscope className="w-6 h-6 text-emerald-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2 pr-8">{doctorName}</h3>
                              <div className="space-y-2 w-full">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">Cases Analyzed</span>
                                  <span className="text-white font-medium">{stats.totalCases}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">Avg. Markup</span>
                                  <span className={`font-bold ${stats.avgGouging > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {stats.avgGouging.toFixed(1)}x
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* 3-Dots Menu Trigger */}
                            <div className="absolute top-4 right-4 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuDoctor(activeMenuDoctor === doctorName ? null : doctorName);
                                }}
                                className="p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>

                              <AnimatePresence>
                                {activeMenuDoctor === doctorName && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChartModalData({ type: 'DONUT', doctorName, records });
                                        setActiveMenuDoctor(null);
                                      }}
                                      className="text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300 hover:text-white border-b border-slate-800/50"
                                    >
                                      Error Breakdown (Donut)
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChartModalData({ type: 'GOUGING', doctorName, records });
                                        setActiveMenuDoctor(null);
                                      }}
                                      className="text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300 hover:text-white"
                                    >
                                      Gouging Gap (Chart)
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* DOCTOR DETAIL MODAL */}
      <AnimatePresence>
        {selectedDoctor && selectedZip && selectedHospital && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDoctor(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-default"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} // Prevent click through
              className="bg-[#0B1120] border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-[#0B1120]/95 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedDoctor}</h2>
                  <p className="text-slate-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {selectedHospital}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                {(() => {
                  const records = data[selectedZip][selectedHospital][selectedDoctor];
                  const stats = getDoctorStats(records);

                  return (
                    <>
                      {/* Top Stats Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                          <p className="text-slate-400 text-sm mb-1">Total Cases</p>
                          <p className="text-2xl font-bold text-white flex items-center gap-2">
                            {stats.totalCases}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                          <p className="text-slate-400 text-sm mb-1">Avg. Charged</p>
                          <p className="text-2xl font-bold text-white">
                            ${stats.avgCharged.toFixed(0)}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                          <p className="text-slate-400 text-sm mb-1">Avg. Medicare</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            ${stats.avgMedicare.toFixed(0)}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                          <p className="text-slate-400 text-sm mb-1">Gouging Factor</p>
                          <p className={`text-2xl font-bold ${stats.avgGouging > 5 ? 'text-red-500' : 'text-orange-400'}`}>
                            {stats.avgGouging.toFixed(1)}x
                            {stats.hasInfinityGouging && <span className="text-xs ml-1 text-red-500">*</span>}
                          </p>
                        </div>
                      </div>

                      {/* Records List */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-accent" />
                          Case History
                        </h3>
                        <div className="space-y-3">
                          {records.map((record, idx) => (
                            <div key={idx} className="bg-slate-800/30 border border-slate-800 p-5 rounded-xl hover:bg-slate-800/50 transition-colors">
                              <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm font-mono text-slate-300 border border-slate-600">
                                    CPT {record.cpt_code}
                                  </div>
                                  {record.error_type && (
                                    <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/20">
                                      {record.error_type}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex flex-col items-end">
                                    <span className="text-slate-500 text-xs">Charged</span>
                                    <span className="text-white font-medium">${record.charged_amount}</span>
                                  </div>
                                  <div className="w-px h-8 bg-slate-700 hidden md:block" />
                                  <div className="flex flex-col items-end">
                                    <span className="text-slate-500 text-xs">Medicare</span>
                                    <span className="text-emerald-400 font-medium">${record.medicare_rate}</span>
                                  </div>
                                  <div className="w-px h-8 bg-slate-700 hidden md:block" />
                                  <div className="flex flex-col items-end">
                                    <span className="text-slate-500 text-xs">Multiple</span>
                                    <span className="text-red-400 font-bold">{record.gouging_multiple}x</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-[1fr,1.5fr] gap-4 mt-2">
                                {record.reason && (
                                  <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/30">
                                    <p className="text-red-200 text-xs font-semibold mb-1">ISSUE DETECTED</p>
                                    <p className="text-slate-300 text-sm">{record.reason}</p>
                                  </div>
                                )}
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                  <p className="text-slate-500 text-xs font-semibold mb-1">CLINICAL EVIDENCE</p>
                                  <p className="text-slate-400 text-sm italic">"{record.evidence_quote}"</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* CHART MODAL */}
      <AnimatePresence>
        {chartModalData && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChartModalData(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 cursor-default"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {chartModalData.type === 'DONUT' ? 'Error Classification' : 'The Gouging Gap'}
                  </h2>
                  <p className="text-slate-400 text-sm">{chartModalData.doctorName}</p>
                </div>
                <button
                  onClick={() => setChartModalData(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 min-h-[400px] flex items-center justify-center bg-slate-950/50">
                {chartModalData.type === 'DONUT' && (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={calculateErrorBreakdown(chartModalData.records)}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {calculateErrorBreakdown(chartModalData.records).map((entry, index) => {
                            const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />;
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {chartModalData.type === 'GOUGING' && (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={calculateGougingGap(chartModalData.records)}
                        margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="id" stroke="#94A3B8" label={{ value: 'Case ID (Sorted by Cost)', position: 'insideBottom', offset: -10, fill: '#94A3B8' }} />
                        <YAxis stroke="#94A3B8" label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="medicare" name="Medicare Rate" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="charged" name="Charged Amount" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="text-center text-slate-400 text-sm mt-4">
                      <span className="text-red-400 font-bold">Red Area</span> represents the overcharge above Medicare rates.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>


      {/* GENERAL STATS MODAL */}
      <AnimatePresence>
        {showStatsModal && selectedZip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatsModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 cursor-default"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Hospital Risk Quadrant</h2>
                  <p className="text-slate-400 text-sm">Zip Code {selectedZip} Analysis</p>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 h-[500px] bg-slate-950/50 relative">
                {/* Axis Labels Overlay */}
                <div className="absolute top-10 right-10 text-red-500 font-bold text-sm bg-red-950/30 px-3 py-1 rounded-full border border-red-900/50">
                  HIGH RISK (Audit Now)
                </div>
                <div className="absolute bottom-16 left-20 text-emerald-500 font-bold text-sm bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/50">
                  LOW RISK
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{
                      top: 20,
                      right: 20,
                      bottom: 40,
                      left: 40,
                    }}
                  >
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Avg. Price Multiplier"
                      unit="x"
                      stroke="#94A3B8"
                      domain={[0, 'auto']}
                      label={{ value: 'Average Price Multiplier (vs Medicare)', position: 'insideBottom', offset: -20, fill: '#94A3B8' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Error Rate"
                      unit=""
                      stroke="#94A3B8"
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      label={{ value: 'Fraud/Error Rate (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8', offset: -10 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl">
                              <p className="text-white font-bold mb-1">{data.name}</p>
                              <p className="text-slate-300 text-sm">
                                Multiplier: <span className="text-accent">{data.x}x</span>
                              </p>
                              <p className="text-slate-300 text-sm">
                                Error Rate: <span className="text-red-400">{(data.y * 100).toFixed(1)}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Reference Lines for Quadrants (Approximate Center) */}
                    <ReferenceLine x={8} stroke="#64748B" strokeDasharray="5 5" />
                    <ReferenceLine y={0.5} stroke="#64748B" strokeDasharray="5 5" />

                    <Scatter name="Hospitals" data={calculateZipRiskData(selectedZip)} fill="#8884d8">
                      {calculateZipRiskData(selectedZip).map((entry, index) => {
                        // Dynamic coloring based on risk
                        let color = "#10B981"; // Green (Low Risk)
                        if (entry.x > 8 && entry.y > 0.5) color = "#EF4444"; // Red (High Risk)
                        else if (entry.x > 8 || entry.y > 0.5) color = "#F59E0B"; // Orange (Med Risk)

                        return <Cell key={`cell-${index}`} fill={color} stroke="#fff" strokeWidth={2} />;
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div >
  );
}


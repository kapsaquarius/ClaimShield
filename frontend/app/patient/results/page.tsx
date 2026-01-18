'use client';

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, AlertTriangle, AlertOctagon, Info, ChevronRight, ChevronLeft, X, ZoomIn, ZoomOut, Download, FileText, FileDown, Eye, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";


const APPEAL_LEVELS = {
    1: {
        title: "Confused Patient",
        description: "Write a curious, collaborative email asking for clarification. Use phrases like 'I was confused by this item' and 'Could you help me understand?' Do not accuse them of error yet."
    },
    2: {
        title: "Sharp Observer",
        description: "Write a polite but specific message pointing out a discrepancy. Assume it is a typo. Use phrases like 'I noticed the bill lists X, but my doctor mentioned Y' and 'Please double-check the records.'"
    },
    3: {
        title: "Professional Auditor",
        description: "Write a formal, direct business letter. State the facts clearly: 'The clinical evidence does not support Code X.' Request a specific correction and re-issuance of the bill. Do not use 'I feel' statements; stick to the data."
    },
    4: {
        title: "Policy Enforcer",
        description: "Write a stern, authoritative objection. Explicitly state that the charge is invalid according to standard billing guidelines. Use phrases like 'This claim is rejected based on lack of medical necessity' and 'Immediate removal of this charge is required.'"
    },
    5: {
        title: "Legal Threat",
        description: "Write a firm, legal notice citing the No Surprises Act and Federal False Claims Act. Demand a written response within 30 days and mention reporting this to the State Insurance Commissioner if not resolved."
    }
};

const COLORS = [
    "bg-cyan-200/50 border-cyan-500",
    "bg-fuchsia-200/50 border-fuchsia-500",
    "bg-emerald-200/50 border-emerald-500",
    "bg-orange-200/50 border-orange-500",
];

const RAW_COLORS = [
    "cyan", "fuchsia", "emerald", "orange"
];

const findFuzzyRanges = (fullText: string, quotes: any[]) => {
    if (!fullText) return [];

    const normMap: number[] = [];
    const normalizedTextBuilder: string[] = [];

    for (let i = 0; i < fullText.length; i++) {
        const char = fullText[i].toLowerCase();
        if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
            normalizedTextBuilder.push(char);
            normMap.push(i);
        }
    }
    const normalizedText = normalizedTextBuilder.join('');

    const ranges: { start: number; end: number; highlight: any }[] = [];

    quotes.forEach(item => {
        if (!item.evidence_quote) return;
        const normQuote = item.evidence_quote.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!normQuote) return;

        let searchPos = 0;
        while (true) {
            const index = normalizedText.indexOf(normQuote, searchPos);
            if (index === -1) break;
            const startOrigin = normMap[index];
            const endNormIndex = index + normQuote.length - 1;
            const endOrigin = normMap[endNormIndex] + 1;

            ranges.push({
                start: startOrigin,
                end: endOrigin,
                highlight: item
            });

            searchPos = index + normQuote.length;
            break;
        }
    });

    return ranges.sort((a, b) => a.start - b.start);
};

const HighlightableText = ({ text, highlights, onHighlightClick, selectedCpt, getHighlightStyle }: any) => {
    if (!text) return <div className="p-8 text-gray-400 italic">No text content available.</div>;

    const ranges = findFuzzyRanges(text, highlights);
    const parts: { text: string; highlight?: any }[] = [];
    let currentCursor = 0;

    ranges.forEach(range => {
        if (range.start < currentCursor) return;

        if (range.start > currentCursor) {
            parts.push({ text: text.slice(currentCursor, range.start) });
        }

        parts.push({
            text: text.slice(range.start, range.end),
            highlight: range.highlight
        });

        currentCursor = range.end;
    });

    if (currentCursor < text.length) {
        parts.push({ text: text.slice(currentCursor) });
    }

    return (
        <div className="whitespace-pre-wrap font-sans text-sm md:text-[15px] leading-8 text-slate-700 tracking-wide">
            {parts.map((part, i) => {
                if (part.highlight) {
                    const isSelected = selectedCpt === part.highlight.cpt_code;
                    const style = getHighlightStyle(part.highlight.cpt_code);
                    return (
                        <span
                            key={i}
                            className={cn(
                                "px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer font-medium",
                                style,
                                isSelected ? "ring-2 ring-offset-2 ring-blue-500 shadow-sm transform scale-[1.02]" : "hover:bg-opacity-80"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onHighlightClick(part.highlight.cpt_code);
                            }}
                        >
                            {part.text}
                        </span>
                    );
                }
                return <span key={i}>{part.text}</span>;
            })}
        </div>
    );
};

export default function ResultsPage() {
    const [selectedCpt, setSelectedCpt] = useState<string | null>(null);
    const [showAppeal, setShowAppeal] = useState(false);
    const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [soapPdf, setSoapPdf] = useState<string | null>(null);
    const [billPdf, setBillPdf] = useState<string | null>(null);
    const [appealData, setAppealData] = useState<any>(null);
    const [appealLevel, setAppealLevel] = useState(3);
    const [isConfiguringAppeal, setIsConfiguringAppeal] = useState(false);

    const [notePage, setNotePage] = useState(0);
    const [billPage, setBillPage] = useState(0);

    const [viewingFile, setViewingFile] = useState<'soap' | 'bill' | null>(null);

    useEffect(() => {
        const storedResult = localStorage.getItem("auditResult");
        if (storedResult) {
            try {
                setAuditResult(JSON.parse(storedResult));
            } catch (error) {
                console.error("Failed to parse stored audit result:", error);
            }
        }
        setSoapPdf(localStorage.getItem("uploadedSoapPdf"));
        setBillPdf(localStorage.getItem("uploadedBillPdf"));
    }, []);

    const handleGenerateAppeal = async () => {
        setIsConfiguringAppeal(false);
        setIsGeneratingAppeal(true);
        try {
            const response = await fetch("http://localhost:8000/api/generate-appeal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    audit_result: auditResult,
                    level: appealLevel
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate appeal");
            }

            const data = await response.json();
            let parsedLetter = data.appeal_letter;
            if (typeof parsedLetter === 'string') {
                try {
                    parsedLetter = JSON.parse(parsedLetter);
                } catch (e) {
                    console.error("Error parsing appeal letter JSON string", e);
                }
            }

            setAppealData(parsedLetter);
            setShowAppeal(true);
        } catch (error) {
            console.error("Error generating appeal:", error);
            alert("Failed to generate appeal. Please try again.");
        } finally {
            setIsGeneratingAppeal(false);
        }
    };

    const getHighlightStyle = (cptCode: string) => {
        const index = auditResult.flagged_items.findIndex((item: any) => item.cpt_code === cptCode);
        if (index === -1) return "";
        return COLORS[index % COLORS.length];
    };

    const getRawColor = (cptCode: string) => {
        const index = auditResult.flagged_items.findIndex((item: any) => item.cpt_code === cptCode);
        if (index === -1) return "slate";
        return RAW_COLORS[index % RAW_COLORS.length];
    };

    if (!auditResult) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative flex items-center justify-center w-24 h-24 mb-6 mx-auto">
                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }} />
                        <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />

                        {/* Shield Logo */}
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                            <Shield className="w-10 h-10 text-blue-400 fill-blue-500/20" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-lg font-medium animate-pulse">Generating Audit Report...</p>
                </div>
            </div>
        );
    }

    const selectedItem = auditResult.flagged_items.find((i: any) => i.cpt_code === selectedCpt);
    const gougingDetails = auditResult.price_gouging_details.find((i: any) => i.cpt_code === selectedCpt);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-900">

            { }
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950 shadow-md sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <Link href="/patient" className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <span className="text-lg font-semibold text-white">Audit Result Review</span>
                </div>
                <div className="flex items-center space-x-4">
                    { }
                    <button
                        onClick={() => setIsConfiguringAppeal(true)}
                        disabled={isGeneratingAppeal}
                        className={cn(
                            "flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95",
                            isGeneratingAppeal && "opacity-80 cursor-wait"
                        )}
                    >
                        {isGeneratingAppeal ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                <span>Generate Appeal Letter</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center space-x-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20 text-sm font-medium">
                        <AlertOctagon className="w-4 h-4 mr-2" />
                        Discrepancies Found
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex relative">
                    <div className="w-1/2 p-4 md:p-8 overflow-y-auto bg-slate-800/50 flex flex-col items-center border-r border-white/5">
                        <div className="mb-4 flex items-center justify-between w-full max-w-4xl text-slate-400 text-sm">
                            <span>CLINICAL_NOTES</span>
                            <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">Digitized Record</span>
                        </div>

                        <div className="w-full max-w-4xl min-h-[60rem] bg-white text-slate-800 shadow-2xl p-10 md:p-16 relative selection:bg-blue-100 transition-all">
                            <div className="w-full border-b border-gray-100 pb-6 mb-8 flex justify-between items-center opacity-60">
                                <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-400">Medical Record Extract</div>
                                <div className="flex items-center space-x-4">
                                    {soapPdf && (
                                        <button
                                            onClick={() => setViewingFile('soap')}
                                            className="flex items-center space-x-1 text-[10px] font-bold uppercase text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>View Original</span>
                                        </button>
                                    )}

                                    {auditResult.clinical_notes_pages && auditResult.clinical_notes_pages.length > 1 && (
                                        <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setNotePage(Math.max(0, notePage - 1))}
                                                disabled={notePage === 0}
                                                className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-slate-500" />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-500 min-w-[3rem] text-center">
                                                {notePage + 1} / {auditResult.clinical_notes_pages.length}
                                            </span>
                                            <button
                                                onClick={() => setNotePage(Math.min(auditResult.clinical_notes_pages.length - 1, notePage + 1))}
                                                disabled={notePage === auditResult.clinical_notes_pages.length - 1}
                                                className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="h-4 w-4 rounded-full bg-gray-100"></div>
                                </div>
                            </div>

                            <HighlightableText
                                text={
                                    auditResult.clinical_notes_pages
                                        ? auditResult.clinical_notes_pages[notePage]
                                        : (auditResult.clinical_notes_text || "No clinical notes text provided.")
                                }
                                highlights={auditResult.flagged_items}
                                onHighlightClick={setSelectedCpt}
                                selectedCpt={selectedCpt}
                                getHighlightStyle={getHighlightStyle}
                            />
                        </div>
                    </div>

                    <div className="w-1/2 p-4 md:p-8 overflow-y-auto bg-slate-800/50 flex flex-col items-center">
                        <div className="mb-4 flex items-center justify-between w-full max-w-4xl text-slate-400 text-sm">
                            <span>HOSPITAL_BILL</span>
                            <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">Digitized Record</span>
                        </div>

                        <div className="w-full max-w-4xl min-h-[60rem] bg-white text-slate-800 shadow-2xl p-10 md:p-16 relative selection:bg-blue-100 transition-all">
                            <div className="w-full border-b border-gray-100 pb-6 mb-8 flex justify-between items-center opacity-60">
                                <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-400">Billing Statement Extract</div>
                                <div className="flex items-center space-x-4">
                                    {billPdf && (
                                        <button
                                            onClick={() => setViewingFile('bill')}
                                            className="flex items-center space-x-1 text-[10px] font-bold uppercase text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>View Original</span>
                                        </button>
                                    )}

                                    {auditResult.hospital_bill_pages && auditResult.hospital_bill_pages.length > 1 && (
                                        <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setBillPage(Math.max(0, billPage - 1))}
                                                disabled={billPage === 0}
                                                className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-slate-500" />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-500 min-w-[3rem] text-center">
                                                {billPage + 1} / {auditResult.hospital_bill_pages.length}
                                            </span>
                                            <button
                                                onClick={() => setBillPage(Math.min(auditResult.hospital_bill_pages.length - 1, billPage + 1))}
                                                disabled={billPage === auditResult.hospital_bill_pages.length - 1}
                                                className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="h-4 w-4 rounded-full bg-gray-100"></div>
                                </div>
                            </div>

                            <HighlightableText
                                text={
                                    auditResult.hospital_bill_pages
                                        ? auditResult.hospital_bill_pages[billPage]
                                        : (auditResult.hospital_bill_text || "No hospital bill text provided.")
                                }
                                highlights={auditResult.flagged_items.map((item: any) => ({
                                    ...item,
                                    evidence_quote: item.cpt_code
                                }))}
                                onHighlightClick={setSelectedCpt}
                                selectedCpt={selectedCpt}
                                getHighlightStyle={getHighlightStyle}
                            />
                        </div>
                    </div>

                </div>

                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ x: "100%", boxShadow: "none" }}
                            animate={{ x: 0, boxShadow: "-10px 0 30px rgba(0,0,0,0.5)" }}
                            exit={{ x: "100%", boxShadow: "none" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute top-0 right-0 w-[400px] h-full bg-slate-950 border-l border-white/10 z-20 overflow-y-auto"
                        >
                            <div className="p-6 space-y-8 pb-24">
                                <div className="flex items-center justify-between sticky top-0 bg-slate-950 py-2 z-10 border-b border-white/5">
                                    <h3 className="text-xl font-bold text-white">Issue Details</h3>
                                    <button
                                        onClick={() => setSelectedCpt(null)}
                                        className="p-2 bg-white/5 hover:bg-white/20 rounded-full text-slate-200 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                        <span className="sr-only">Close</span>
                                    </button>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-5 rounded-2xl border bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden",
                                        `border-${getRawColor(selectedItem.cpt_code)}-500/30`
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-0 right-0 p-32 blur-3xl rounded-full -mr-16 -mt-16 opacity-20",
                                        `bg-${getRawColor(selectedItem.cpt_code)}-500`
                                    )} />

                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <span className={cn(
                                            "text-4xl font-mono font-bold",
                                            `text-${getRawColor(selectedItem.cpt_code)}-400`
                                        )}>
                                            {selectedItem.cpt_code}
                                        </span>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                            `bg-${getRawColor(selectedItem.cpt_code)}-500/20 text-${getRawColor(selectedItem.cpt_code)}-400`
                                        )}>
                                            {selectedItem.error_type}
                                        </div>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed relative z-10">
                                        {selectedItem.reason}
                                    </p>
                                </motion.div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-500 mr-2" />
                                        Evidence Found
                                    </h4>
                                    <div className={cn(
                                        "p-4 rounded-xl border-l-4 bg-slate-900/50 italic text-slate-300",
                                        `border-${getRawColor(selectedItem.cpt_code)}-500`
                                    )}>
                                        "{selectedItem.evidence_quote}"
                                    </div>
                                </div>

                                {selectedItem.suggested_code && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                            Suggested Correction
                                        </h4>
                                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2 relative">
                                            <CheckCircle className="absolute top-4 right-4 text-green-500 w-5 h-5" />
                                            <div className="flex items-center text-green-400 font-bold mb-1 text-lg">
                                                {selectedItem.suggested_code}
                                            </div>
                                            <p className="text-sm text-green-100/70 leading-relaxed">
                                                {selectedItem.suggested_code_explanation}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {gougingDetails && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                            Cost Analysis
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                <div className="text-xs text-slate-500 mb-1">You Were Charged</div>
                                                <div className="text-xl font-bold text-white">${gougingDetails.charged_amount}</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                <div className="text-xs text-slate-500 mb-1">Medicare Rate</div>
                                                <div className="text-xl font-bold text-slate-300">${gougingDetails.medicare_rate}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>{gougingDetails.gouging_multiple}x higher than standard rate</span>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isConfiguringAppeal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsConfiguringAppeal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-8">
                                    <h2 className="text-2xl font-bold text-white mb-2">Configure Appeal Tone</h2>
                                    <p className="text-slate-400 mb-8">How aggressively should we challenge this claim?</p>

                                    <div className="space-y-8">
                                        <div className="relative pt-6 pb-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="1"
                                                value={appealLevel}
                                                onChange={(e) => setAppealLevel(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                            <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                                                <span>COLLABORATIVE</span>
                                                <span>AGGRESSIVE</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5 transition-all">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                    appealLevel <= 2 ? "bg-green-500/20 text-green-400" :
                                                        appealLevel <= 4 ? "bg-yellow-500/20 text-yellow-400" :
                                                            "bg-red-500/20 text-red-400"
                                                )}>
                                                    {appealLevel}
                                                </div>
                                                <h3 className={cn(
                                                    "text-lg font-bold",
                                                    appealLevel <= 2 ? "text-green-400" :
                                                        appealLevel <= 4 ? "text-yellow-400" :
                                                            "text-red-400"
                                                )}>
                                                    {APPEAL_LEVELS[appealLevel as keyof typeof APPEAL_LEVELS].title}
                                                </h3>
                                            </div>
                                            <p className="text-slate-300 leading-relaxed text-sm">
                                                {APPEAL_LEVELS[appealLevel as keyof typeof APPEAL_LEVELS].description}
                                            </p>
                                        </div>

                                        <div className="flex space-x-4 pt-4">
                                            <button
                                                onClick={() => setIsConfiguringAppeal(false)}
                                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleGenerateAppeal}
                                                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02]"
                                            >
                                                Generate Letter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAppeal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <FileText className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">Generated Appeal Letter</h2>
                                            <p className="text-sm text-slate-400">Ready for download and submission</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => {
                                                const doc = new jsPDF();

                                                doc.setFont("times", "normal");
                                                doc.setFontSize(11);

                                                const margin = 20;
                                                let yPos = 20;

                                                doc.text("May 16, 2024", 190, yPos, { align: "right" });
                                                yPos += 10;

                                                doc.setFont("times", "bold");
                                                doc.text("Billing Department", margin, yPos);
                                                yPos += 5;
                                                doc.text("Mercy General Hospital", margin, yPos);
                                                yPos += 5;
                                                doc.setFont("times", "normal");
                                                doc.text("123 Health Ave, Metropolis, NY 10012", margin, yPos);
                                                yPos += 10;

                                                doc.setFont("times", "bold");
                                                doc.text("RE: Formal Appeal for Account #8492043", margin, yPos);
                                                yPos += 5;
                                                doc.text("Patient: John Doe", margin, yPos);
                                                yPos += 15;

                                                doc.text(appealData?.subject || "Appeal Request", margin, yPos);
                                                yPos += 10;

                                                doc.setFont("times", "normal");
                                                doc.text(appealData?.salutation || "To Whom It May Concern,", margin, yPos);
                                                yPos += 10;

                                                const splitBody = doc.splitTextToSize(appealData?.body || "", 170); // 210 - 2*20 = 170
                                                doc.text(splitBody, margin, yPos);
                                                yPos += splitBody.length * 5 + 10;
                                                doc.setFont("times", "bold");
                                                const splitCTA = doc.splitTextToSize(appealData?.call_to_action || "", 170);
                                                doc.text(splitCTA, margin, yPos);
                                                yPos += splitCTA.length * 5 + 10;

                                                doc.setFont("times", "normal");
                                                const signOffLines = (appealData?.sign_off || "").replace("[Your Name]", "John Doe").split("\n");
                                                signOffLines.forEach((line: string) => {
                                                    doc.text(line, margin, yPos);
                                                    yPos += 5;
                                                });

                                                doc.save("Appeal_Letter_8492043.pdf");
                                            }}
                                            className="flex items-center px-4 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors text-sm"
                                        >
                                            <FileDown className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={() => setShowAppeal(false)}
                                            className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 bg-slate-800/50 flex justify-center">
                                    <div className="w-full max-w-[8.5in] bg-white text-black shadow-xl p-[1in] min-h-[11in] font-serif text-[11pt] leading-relaxed">
                                        <div className="mb-8">
                                            <div className="text-right text-gray-500 text-sm mb-4">May 16, 2024</div>
                                            <div className="font-bold mb-4">
                                                Billing Department<br />
                                                Mercy General Hospital<br />
                                                123 Health Ave, Metropolis, NY 10012
                                            </div>
                                            <div className="font-bold">
                                                RE: Formal Appeal for Account #8492043<br />
                                                Patient: John Doe
                                            </div>
                                        </div>

                                        <div className="font-bold mb-4">{appealData?.subject}</div>
                                        <div className="mb-4">{appealData?.salutation}</div>

                                        <div className="space-y-4 mb-6 text-justify">
                                            <p>{appealData?.body}</p>
                                        </div>

                                        <div className="font-bold mb-8">{appealData?.call_to_action}</div>

                                        <div className="whitespace-pre-line">
                                            {(appealData?.sign_off || "").replace("[Your Name]", "John Doe")}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {viewingFile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                            onClick={() => setViewingFile(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative bg-transparent w-full max-w-6xl h-[90vh] flex flex-col items-center justify-center pointer-events-none"
                            >
                                <button
                                    onClick={() => setViewingFile(null)}
                                    className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white pointer-events-auto transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="w-full h-full pointer-events-auto rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                        const fileData = viewingFile === 'soap' ? soapPdf : billPdf;
                                        if (!fileData) return <div className="text-white">File not found.</div>;

                                        const isPdf = fileData.startsWith('data:application/pdf');

                                        if (isPdf) {
                                            return (
                                                <object
                                                    data={fileData}
                                                    type="application/pdf"
                                                    className="w-full h-full"
                                                >
                                                    <p className="text-white p-4">
                                                        Your browser does not support PDFs.
                                                        <a href={fileData} download className="text-blue-400 hover:underline ml-1">Download the PDF</a>.
                                                    </p>
                                                </object>
                                            );
                                        } else {
                                            return (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={fileData}
                                                    alt="Original Document"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            );
                                        }
                                    })()}
                                </div>
                                <div className="mt-4 text-white/50 text-sm font-medium">
                                    Viewing Original {viewingFile === 'soap' ? 'Clinical Notes' : 'Hospital Bill'} Upload
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

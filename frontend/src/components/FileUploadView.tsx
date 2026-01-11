"use client";


import { API_BASE_URL } from "@/lib/api";
import React, { useState } from "react";
import {
    CloudUpload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    Download,
    Newspaper,
    Activity,
    X,
    FileStack
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileProgress {
    file: File;
    status: "pending" | "uploading" | "processing" | "complete" | "error";
    error?: string;
    result?: any;
    id?: string;
}

export function FileUploadView({
    onProcessingStart,
    onProcessingComplete
}: {
    onProcessingStart?: (log: string) => void;
    onProcessingComplete?: () => void;
}) {
    const [queue, setQueue] = useState<FileProgress[]>([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                status: "pending" as const
            }));
            setQueue(prev => [...prev, ...newFiles]);
        }
    };

    const removeFromFileQueue = (index: number) => {
        if (isProcessingBatch) return;
        setQueue(prev => prev.filter((_, i) => i !== index));
    };

    const processBatch = async () => {
        if (queue.length === 0 || isProcessingBatch) return;

        setIsProcessingBatch(true);
        const updatedQueue = [...queue];

        for (let i = 0; i < updatedQueue.length; i++) {
            if (updatedQueue[i].status === "complete") continue;

            try {
                // 1. Upload
                updatedQueue[i].status = "uploading";
                setQueue([...updatedQueue]);
                onProcessingStart?.(`BATCH: Starting upload for ${updatedQueue[i].file.name}`);

                const formData = new FormData();
                formData.append("file", updatedQueue[i].file);

                const token = localStorage.getItem("token");
                const uploadRes = await fetch("${API_BASE_URL}/pdfs/upload/", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Upload failed.");
                const uploadJson = await uploadRes.json();
                updatedQueue[i].id = uploadJson.id;

                // 2. Process
                updatedQueue[i].status = "processing";
                setQueue([...updatedQueue]);
                onProcessingStart?.(`BATCH: Analyzing ${updatedQueue[i].file.name}...`);

                const pipelineRes = await fetch(`${API_BASE_URL}/pipeline/${uploadJson.id}/pipeline`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!pipelineRes.ok) throw new Error("Processing failed.");
                const pipelineJson = await pipelineRes.json();

                updatedQueue[i].result = pipelineJson;
                updatedQueue[i].status = "complete";
                onProcessingStart?.(`BATCH SUCCESS: ${updatedQueue[i].file.name} successfully indexed.`);
                setQueue([...updatedQueue]);

            } catch (err: any) {
                updatedQueue[i].status = "error";
                updatedQueue[i].error = err.message;
                onProcessingStart?.(`BATCH ERROR: ${updatedQueue[i].file.name} - ${err.message}`);
                setQueue([...updatedQueue]);
            }
        }

        setIsProcessingBatch(false);
        onProcessingComplete?.();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Upload Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border-2 border-dashed border-white/10 rounded-[2.5rem] p-12 text-center relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500"
            >
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isProcessingBatch}
                />

                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <CloudUpload className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Select Media Batch</h3>
                    <p className="text-white/40 max-w-sm mx-auto mb-8 font-medium italic">
                        Select one or more PDF news documents to process them simultaneously into the Knowledge Bank.
                    </p>
                </div>
            </motion.div>

            {/* Queue Section */}
            <AnimatePresence>
                {queue.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <FileStack className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-bold text-white uppercase tracking-wider text-xs">Media Processing Queue ({queue.length})</h4>
                            </div>
                            {!isProcessingBatch && (
                                <button
                                    onClick={processBatch}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    Process Batch
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {queue.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass border border-white/5 p-4 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                            item.status === 'complete' ? "bg-emerald-500/10 text-emerald-400" :
                                                item.status === 'error' ? "bg-red-500/10 text-red-400" :
                                                    "bg-white/5 text-white/40"
                                        )}>
                                            {item.status === 'processing' || item.status === 'uploading' ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : item.status === 'complete' ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                                <FileText className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-sm">{item.file.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest",
                                                    item.status === 'complete' ? "text-emerald-400" :
                                                        item.status === 'error' ? "text-red-400" :
                                                            item.status === 'processing' ? "text-indigo-400" :
                                                                "text-white/20"
                                                )}>
                                                    • {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {item.status === 'complete' && (
                                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
                                                {item.result?.articles?.length || 0} Articles
                                            </div>
                                        )}
                                        {!isProcessingBatch && item.status !== 'complete' && (
                                            <button
                                                onClick={() => removeFromFileQueue(idx)}
                                                className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

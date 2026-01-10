"use client";

import { useState } from "react";

export default function FileUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setResult(null);
        setUploadedFileId(null);

        try {
            // 1. Upload
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("http://localhost:8000/api/v1/pdfs/upload/", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const uploadJson = await uploadRes.json();
            const fileId = uploadJson.id;
            setUploadedFileId(fileId);

            // 2. Process Pipeline
            const pipelineRes = await fetch(`http://localhost:8000/api/v1/pipeline/${fileId}/pipeline`, {
                method: "POST",
            });

            if (!pipelineRes.ok) throw new Error("Processing failed");

            const pipelineJson = await pipelineRes.json();
            setResult(pipelineJson);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">PDF Ingestion Pipeline</h1>

            <div className="flex items-center space-x-4">
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
          "
                />
                <button
                    onClick={handleProcess}
                    disabled={!file || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {uploading ? "Processing..." : "Process PDF"}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Extracted Articles</h2>
                        {uploadedFileId && (
                            <a
                                href={`http://localhost:8000/api/v1/export/${uploadedFileId}/excel`}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                target="_blank"
                            >
                                Download Excel
                            </a>
                        )}
                    </div>
                    <div className="space-y-4">
                        {result.articles.map((article: any, idx: number) => (
                            <div key={idx} className="border p-4 rounded-md">
                                <h3 className="font-bold text-lg">{article.headline}</h3>
                                <div className="flex gap-2 my-2 text-xs">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{article.department || "General"}</span>
                                    <span className={`px-2 py-1 rounded-full ${article.sentiment_label === 'Positive' ? 'bg-green-100 text-green-800' : article.sentiment_label === 'Negative' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {article.sentiment_label || "Neutral"}
                                    </span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Cluster: {article.topic_cluster_id?.split('_')[1] || "None"}</span>
                                </div>
                                <p className="mt-2 text-gray-700 text-sm">{article.body}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    Confidence: {article.confidence}
                                </div>
                            </div>
                        ))}

                        {result.unassigned_segments.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <h3 className="font-bold text-gray-500">Unassigned Text</h3>
                                <div className="text-xs text-gray-400 mt-2">
                                    {result.unassigned_segments.map((s: any) => s.text).join(" ")}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

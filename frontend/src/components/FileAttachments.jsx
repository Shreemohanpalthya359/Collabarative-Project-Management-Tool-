import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { Paperclip, Upload, Trash2, Download, File } from 'lucide-react';

const fmt = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileAttachments = ({ taskId }) => {
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const fetchAttachments = useCallback(async () => {
        try {
            const res = await api.get(`/attachments/task/${taskId}`);
            setAttachments(res.data);
        } catch (_e) { /* ignore */ }
    }, [taskId]);

    useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const form = new FormData();
        form.append('file', file);
        try {
            await api.post(`/attachments/task/${taskId}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchAttachments();
        } catch (_e) { /* ignore */ } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/attachments/${id}`);
            setAttachments(prev => prev.filter(a => a.id !== id));
        } catch (_e) { /* ignore */ }
    };

    const handleDownload = (a) => {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/attachments/download/${a.id}`;
        // Open with token in a new tab (simple approach)
        window.open(`${url}?token=${token}`, '_blank');
    };

    return (
        <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center"><Paperclip className="w-3.5 h-3.5 mr-1.5" /> Attachments ({attachments.length})</span>
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40">
                    <Upload className="w-3 h-3" /><span>{uploading ? 'Uploading…' : 'Upload'}</span>
                </button>
            </h4>

            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />

            {/* Drag-drop zone */}
            <div
                className="border-2 border-dashed border-gray-700 hover:border-indigo-500/50 rounded-xl p-4 text-center mb-3 transition-colors cursor-pointer"
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (!file) return;
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    inputRef.current.files = dt.files;
                    handleUpload({ target: inputRef.current });
                }}
            >
                <Upload className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <p className="text-xs text-gray-600">Drop file here or click to upload</p>
                <p className="text-[10px] text-gray-700 mt-0.5">PNG, JPG, PDF, DOCX, ZIP, CSV (any file)</p>
            </div>

            {/* File list */}
            <div className="space-y-2">
                {attachments.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-3 py-2 border border-white/5 group">
                        <div className="flex items-center space-x-2.5 min-w-0">
                            <File className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-200 truncate">{a.filename}</p>
                                <p className="text-[10px] text-gray-600">{fmt(a.size_bytes)} · {a.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <button onClick={() => handleDownload(a)}
                                className="p-1.5 text-gray-500 hover:text-indigo-400 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(a.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileAttachments;

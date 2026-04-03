import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Download, Send, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function App() {
  const [mode, setMode] = useState('file');
  const [files, setFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [uploadKey, setUploadKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [progress, setProgress] = useState(0);
  const [remoteData, setRemoteData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    if (key) setInputKey(key);
  }, []);

  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_BASE}/metadata/${inputKey}`);
      setRemoteData(res.data);
    } catch (err) {
      alert("Invalid Key");
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setUploadKey(''); // Clear previous key on new drop
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total))
      });
      setUploadKey(res.data.key);
      setFiles([]); // Clear files after successful upload
    } catch (err) { 
      alert("Upload failed"); 
      setProgress(0);
    }
  };

  const handleTextShare = async () => {
    try {
      const res = await axios.post(`${API_BASE}/upload-text`, { text: textContent });
      setUploadKey(res.data.key);
      setTextContent(''); // Clear text after sharing
    } catch (err) { alert("Failed to share text"); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#6c5ce7] font-sans text-gray-800">
      <div className="mb-10 text-center text-white">
        <h1 className="text-4xl font-extrabold">ShareIt</h1>
        <p className="opacity-80">Instant File & Text Sharing</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        {/* SEND CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 flex-1">
          <div className="flex border-b mb-6">
            <button onClick={() => setMode('file')} className={`flex-1 pb-2 font-bold transition-colors ${mode === 'file' ? 'border-b-4 border-indigo-500 text-indigo-600' : 'text-gray-400'}`}>Files</button>
            <button onClick={() => setMode('text')} className={`flex-1 pb-2 font-bold transition-colors ${mode === 'text' ? 'border-b-4 border-indigo-500 text-indigo-600' : 'text-gray-400'}`}>Text</button>
          </div>

          {mode === 'file' ? (
            <div className="space-y-4">
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-4 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                  ${isDragging 
                    ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-[1.02]' 
                    : 'border-gray-100 hover:border-indigo-400 hover:bg-indigo-50'
                  }
                `}
              >
                <Plus className={`mb-2 transition-transform ${isDragging ? 'scale-125 text-indigo-600' : 'text-indigo-500'}`} />
                <span className={`text-sm font-medium ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {files.length > 0 ? `${files.length} files selected` : 'Add or Drop Files'}
                </span>
                <input type="file" hidden multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
              </label>
              
              <button 
                onClick={handleUpload} 
                disabled={files.length === 0 || (progress > 0 && progress < 100)}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  files.length === 0 ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Send size={18} />
                {progress > 0 && progress < 100 ? `Uploading ${progress}%` : 'Send Files'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} className="w-full h-48 p-4 bg-gray-50 rounded-2xl outline-none resize-none border-2 border-dashed border-gray-100 focus:border-indigo-400 transition-colors" placeholder="Paste text or code..." />
              <button onClick={handleTextShare} disabled={!textContent} className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${!textContent ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <Send size={18} /> Share Text
              </button>
            </div>
          )}

          {uploadKey && (
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-center animate-in zoom-in">
              <QRCodeSVG value={`${window.location.origin}?key=${uploadKey}`} size={120} className="mx-auto mb-2" />
              <p className="text-3xl font-mono font-bold text-green-600">{uploadKey}</p>
            </div>
          )}
        </div>

        {/* RECEIVE CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 flex-1">
          <h2 className="text-2xl font-bold mb-6">Receive</h2>
          <input type="text" value={inputKey} onChange={(e) => setInputKey(e.target.value)} className="w-full bg-gray-50 border-2 rounded-xl py-4 text-center text-3xl font-mono mb-4 outline-none focus:border-indigo-400 transition-all" placeholder="000000" />
          
          {!remoteData ? (
            <button onClick={fetchMetadata} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold transition-colors">Check Key</button>
          ) : (
            <div className="space-y-4">
              {remoteData.type === 'text' ? (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap mb-4 font-mono">{remoteData.content}</pre>
                  <button onClick={() => navigator.clipboard.writeText(remoteData.content)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors"><Copy size={14}/> Copy to Clipboard</button>
                </div>
              ) : (
                <>
                  <button onClick={() => window.location.href = `${API_BASE}/download/${inputKey}`} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex justify-center gap-2 transition-colors"><Download size={18}/> Download ZIP</button>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {remoteData.files.map(f => (
                      <div key={f.index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-sm truncate pr-4">{f.name}</span>
                        <Download size={16} className="cursor-pointer text-indigo-600 hover:text-indigo-800 flex-shrink-0" onClick={() => window.location.href=`${API_BASE}/download/${inputKey}?index=${f.index}`} />
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => {setRemoteData(null); setInputKey('');}} className="text-xs text-gray-400 hover:text-gray-600 underline w-full transition-colors">Clear and Receive Another</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

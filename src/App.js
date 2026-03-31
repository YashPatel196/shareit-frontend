import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Download, Send, Files } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [uploadKey, setUploadKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [progress, setProgress] = useState(0);
  const [remoteFiles, setRemoteFiles] = useState([]);

  // This will use your Render URL once set in Vercel Environment Variables
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchMetadata = async () => {
    try {
      // ngrok headers removed for production
      const res = await axios.get(`${API_BASE}/metadata/${inputKey}`);
      setRemoteFiles(res.data.files);
    } catch (err) {
      alert("Invalid Key or Files Expired");
      setRemoteFiles([]);
    }
  };

  const onFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setUploadKey('');
    setProgress(0);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file); 
    });

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total))
      });
      setUploadKey(res.data.key);
      setProgress(100);
    } catch (err) {
      console.error(err);
      alert("Error: Check if the backend server is awake!");
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#6c5ce7]">
      <div className="mb-10 text-center text-white">
        <h1 className="text-4xl font-extrabold tracking-tight">ShareIt</h1>
        <p className="opacity-80">Instant, multi-file sharing</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
        
        {/* SEND CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full md:w-96">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Send</h2>
          
          <label className="border-4 border-dashed border-gray-100 rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
            {files.length > 0 ? (
              <div className="text-center p-4">
                <Files size={48} className="text-indigo-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">
                  {files.length} {files.length === 1 ? 'file' : 'files'} selected
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-indigo-50 p-4 rounded-full inline-block">
                  <Plus size={32} className="text-indigo-500" />
                </div>
                <p className="mt-3 text-sm text-gray-400 font-medium">Add Files</p>
              </div>
            )}
            <input type="file" onChange={onFileChange} hidden multiple />
          </label>

          <button 
            onClick={handleUpload}
            disabled={files.length === 0 || (progress > 0 && progress < 100)}
            className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              files.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Send size={18} /> 
            {progress > 0 && progress < 100 ? `Uploading ${progress}%` : "Send"}
          </button>

          {uploadKey && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100 text-center animate-bounce">
              <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Your Key</span>
              <p className="text-4xl font-mono font-bold text-green-700">{uploadKey}</p>
            </div>
          )}
        </div>

        {/* RECEIVE CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full md:w-96">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Receive</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Input key" 
              maxLength="6"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-5 text-center text-3xl font-mono font-bold text-gray-700 focus:border-indigo-400 outline-none"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
            
            {remoteFiles.length === 0 ? (
              <button 
                onClick={fetchMetadata}
                disabled={inputKey.length < 6}
                className="w-full py-4 rounded-xl font-bold bg-pink-500 text-white hover:bg-pink-600 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Check Key
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                <button 
                  onClick={() => window.location.href = `${API_BASE}/download/${inputKey}`}
                  className="w-full py-3 rounded-xl font-bold bg-indigo-600 text-white flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download All (ZIP)
                </button>
                
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Individual Files</p>
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                    {remoteFiles.map((file) => (
                      <div key={file.index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <span className="text-sm truncate w-40 text-gray-700">{file.name}</span>
                        <button 
                          onClick={() => window.location.href = `${API_BASE}/download/${inputKey}?index=${file.index}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => {setRemoteFiles([]); setInputKey('');}} className="text-xs text-gray-400 underline w-full">Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

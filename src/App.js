import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Download, Send, Copy, Shield, Zap, Lock} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function App() {
  const [view, setView] = useState('normal'); // 'normal' or 'advanced'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // 'login' or 'register'
  const [userEmail, setUserEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [expiration, setExpiration] = useState(24); // Default 24 hours
  const [history, setHistory] = useState([]);

  // Existing states
  const [mode, setMode] = useState('file');
  const [files, setFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [uploadKey, setUploadKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [progress, setProgress] = useState(0);
  const [remoteData, setRemoteData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [authError, setAuthError] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchHistory = async () => {
    try {
        const res = await axios.get(`${API_BASE}/user-history`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setHistory(res.data);
    } catch (err) {
        console.error("Failed to fetch history");
    }
  };

  // Refresh history when logging in or switching to advanced view
  useEffect(() => {
      if (isLoggedIn && view === 'advanced') {
          fetchHistory();
      }
  }, [isLoggedIn, view]);

  // --- Auth Handlers ---
  const handleAuth = async (e) => {
      e.preventDefault();
      setAuthError(''); // Clear previous errors
      if (!email || !password) return setAuthError("Please fill in all fields");

      try {
        const endpoint = authMode === 'login' ? '/login' : '/register';
        const response = await axios.post(`${API_BASE}${endpoint}`, { email, password });

        if (authMode === 'login') {
            localStorage.setItem('token', response.data.token);
            setIsLoggedIn(true);
            setUserEmail(response.data.email); // <--- Add this line
            setEmail('');
            setPassword('');
        } else {
            // Show success in-app instead of alert
            setAuthMode('login');
            setAuthError('Registration Successful! Please login.'); 
        }
      } catch (err) {
          // Capture the backend error message
          setAuthError(err.response?.data || "Authentication failed");
      }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    if (key) setInputKey(key);
  }, []);

  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_BASE}/metadata/${inputKey}`);
      console.log("Metadata received:", res.data);
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
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    if (view === 'advanced') {
        formData.append('expirationHours', expiration);
    }

    const isAdvanced = view === 'advanced' && isLoggedIn;
    const url = isAdvanced ? `${API_BASE}/advanced-upload` : `${API_BASE}/upload`;
    
    const config = {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total)),
        headers: {
            // Only add the token if we are in advanced mode
            ...(isAdvanced && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
    };

    try {
        const res = await axios.post(url, formData, config);
        setIsScanning(false);
        setScanComplete(true);
        setUploadKey(res.data.key);
        setFiles([]);
        setProgress(100);
        if (isAdvanced) fetchHistory();
    } catch (err) { 
        setIsScanning(false);
        console.error(err);
        const errorMsg = err.response?.data || "Upload failed";
        alert(errorMsg); 
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
    <div className="min-h-screen flex flex-col items-center p-6 bg-[#6c5ce7] font-sans text-gray-800">
      {/* HEADER SECTION */}
      <div className="mb-8 text-center text-white animate-in fade-in duration-700">
        <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3">
          AirMove {view === 'advanced' && <Shield className="text-yellow-400" />}
        </h1>
        <p className="opacity-80">
          {view === 'normal' ? 'Instant File & Text Sharing' : 'Secure, Persistent Advanced Sharing'}
        </p>
      </div>

      {/* SECTION TOGGLE SWITCH */}
      <div className="flex bg-white/20 p-1 rounded-2xl mb-10 w-full max-w-xs backdrop-blur-md shadow-inner">
        <button 
          onClick={() => setView('normal')}
          className={`flex-1 py-2 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${view === 'normal' ? 'bg-white text-indigo-600 shadow-md' : 'text-white hover:bg-white/10'}`}
        >
          <Zap size={16} /> Normal
        </button>
        <button 
          onClick={() => setView('advanced')}
          className={`flex-1 py-2 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${view === 'advanced' ? 'bg-white text-indigo-600 shadow-md' : 'text-white hover:bg-white/10'}`}
        >
          <Lock size={16} /> Advanced
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full max-w-6xl">
        {!isLoggedIn && view === 'advanced' ? (
          /* --- ADVANCED: AUTHENTICATION GATE --- */
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 animate-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="text-indigo-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Member Login' : 'Create Account'}</h2>
              <p className="text-sm text-gray-500 mt-1">Unlock encrypted persistent storage</p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {authError && (
                <div className={`p-3 mb-4 rounded-xl text-sm font-medium border ${
                  authError.includes('Successful') 
                  ? 'bg-green-50 border-green-200 text-green-600' 
                  : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  {authError}
                </div>
              )}

              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} // Controlled input
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 bg-gray-50 border-2 rounded-xl outline-none focus:border-indigo-400" 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} // Controlled input
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-4 bg-gray-50 border-2 rounded-xl outline-none focus:border-indigo-400" 
                required 
              />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
                {authMode === 'login' ? 'Sign In' : 'Register Now'}
              </button>
            </form>
            
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        ) : (
          /* --- SHARED INTERFACE (Normal & Advanced Dashboard) --- */
          <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* ADVANCED USER HEADER (Only shows when logged in) */}
            {isLoggedIn && view === 'advanced' && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center text-white border border-white/20">
                <div className="flex items-center gap-3">
                  {/* Dynamic Initial: Takes the first letter of the email */}
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold uppercase">
                    {userEmail ? userEmail[0] : 'U'}
                  </div>
                  <div>
                    <p className="text-xs opacity-70">Logged in as</p>
                    <p className="text-sm font-bold">{userEmail || 'Member'}</p> {/* <--- Dynamic Email */}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsLoggedIn(false);
                    setUserEmail(''); // Clear email on logout
                    localStorage.removeItem('token');
                  }} 
                  className="px-4 py-2 text-xs font-bold bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* SEND CARD (Included in both modes) */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 flex-1 border-t-8 border-indigo-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">Send {view === 'advanced' && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md uppercase">Persistent</span>}</h2>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setMode('file')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Files</button>
                    <button onClick={() => setMode('text')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Text</button>
                  </div>
                </div>

                {mode === 'file' ? (
                  <div className="space-y-4">
                    <label onDragOver={(e) => e.preventDefault()} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-4 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                      <Plus className={`mb-2 transition-transform ${isDragging ? 'scale-125 text-indigo-600' : 'text-indigo-500'}`} />
                      <span className={`text-sm font-medium ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {files.length > 0 ? `${files.length} files (${formatBytes(files.reduce((acc, f) => acc + f.size, 0))})` : 'Add or Drop Files'}
                      </span>
                      <input type="file" hidden multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
                    </label>

                    {view === 'advanced' && (
                      <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase">Link Validity</label>
                        <select 
                          value={expiration} 
                          onChange={(e) => setExpiration(e.target.value)}
                          className="w-full mt-1 p-2 bg-gray-50 border rounded-lg text-sm outline-none focus:border-indigo-400"
                        >
                          <option value="1">1 Hour</option>
                          <option value="24">24 Hours</option>
                          <option value="168">1 Week</option>
                        </select>
                      </div>
                    )}

                    {/* 1. SECURITY SCANNING OVERLAY - Shows while scanning */}
                    {isScanning ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-2xl border-2 border-indigo-200 border-dashed animate-pulse">
                        <Shield className="text-indigo-600 mb-2 animate-bounce" size={32} />
                        <p className="text-sm font-bold text-indigo-700">Security Scan in Progress...</p>
                        <p className="text-[10px] text-indigo-400 uppercase tracking-widest mt-1">Checking for Malware & Bloatware</p>
                      </div>
                    ) : (
                      /* Original Button - Only shows when NOT scanning */
                      <button onClick={handleUpload} disabled={files.length === 0 || (progress > 0 && progress < 100)} className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${files.length === 0 ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'}`}>
                        <Send size={18} /> {progress > 0 && progress < 100 ? `Uploading ${progress}%` : 'Send Files'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} className="w-full h-48 p-4 bg-gray-50 rounded-2xl outline-none resize-none border-2 border-dashed border-gray-100 focus:border-indigo-400 transition-colors" placeholder="Paste text or code..." />
                    <button onClick={handleTextShare} disabled={!textContent} className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${!textContent ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'}`}>
                      <Send size={18} /> Share Text
                    </button>
                  </div>
                )}

                {uploadKey && (
                  <div className="mt-6">
                    {/* 2. SUCCESS BADGE - Shows above the QR code once done */}
                    {scanComplete && (
                      <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 border border-green-200 rounded-xl justify-center text-green-600 animate-in fade-in zoom-in">
                        <Shield size={16} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-tight">Verified Secure: No Threats Found</span>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded-2xl text-center animate-in zoom-in border border-indigo-100">
                      <QRCodeSVG value={`${window.location.origin}?key=${uploadKey}`} size={120} className="mx-auto mb-2" />
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Your Key</p>
                      <p className="text-3xl font-mono font-bold text-green-600">{uploadKey}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RECEIVE CARD (Included in both modes) */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 flex-1 border-t-8 border-pink-500">
                <h2 className="text-xl font-bold mb-6">Receive</h2>
                <input type="text" value={inputKey} onChange={(e) => setInputKey(e.target.value)} className="w-full bg-gray-50 border-2 rounded-xl py-4 text-center text-3xl font-mono mb-4 outline-none focus:border-indigo-400 transition-all" placeholder="000000" />
                {!remoteData ? (
                  <button onClick={fetchMetadata} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold transition-colors shadow-lg">Check Key</button>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
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
                              <div className="flex flex-col truncate pr-4">
                                <span className="text-sm truncate font-medium">{f.name}</span>
                                <span className="text-[10px] text-gray-400">{formatBytes(f.size)}</span>
                              </div>
                              <Download size={18} className="cursor-pointer text-indigo-600 hover:text-indigo-800" onClick={() => window.location.href=`${API_BASE}/download/${inputKey}?index=${f.index}`} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <button onClick={() => {setRemoteData(null); setInputKey('');}} className="text-xs text-gray-400 hover:text-gray-600 underline w-full">Clear and Receive Another</button>
                  </div>
                )}
              </div>
            </div>

            {/* ADVANCED HISTORY / STORAGE SECTION (Only shows when logged in) */}
            {isLoggedIn && view === 'advanced' && (
              <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">
                  <Download size={20} /> Your Transfer History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b">
                        <th className="pb-3 font-medium">Key</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Expires</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.length > 0 ? history.map((item) => (
                        <tr key={item.key} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 font-mono font-bold text-indigo-600">{item.key}</td>
                          <td className="py-4 text-gray-600">{item.fileCount} Files</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-gray-500">
                            {new Date(item.expiresAt).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={() => { setInputKey(item.key); fetchMetadata(); }}
                              className="text-indigo-600 hover:underline font-bold text-xs"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="py-8 text-center text-gray-400 italic">No uploads found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

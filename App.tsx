import React, { useState, useCallback, useRef } from 'react';
import WebcamCapture from './components/WebcamCapture';
import HistoryPanel from './components/HistoryPanel';
import { analyzeGesture } from './services/geminiService';
import { GestureResponse, AppState, HistoryItem } from './types';
import { Hand, Play, Square, AlertCircle, Info, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentResult, setCurrentResult] = useState<GestureResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // We use a ref to track processing state inside the capture callback closure
  // to avoid queueing up multiple API calls.
  const isProcessingRef = useRef(false);

  const handleCapture = useCallback(async (base64Image: string) => {
    // Prevent overlapping requests
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await analyzeGesture(base64Image);
      
      setCurrentResult(result);
      
      // Only add to history if it's a valid gesture and confidence is decent
      if (result.gesture !== 'None' && result.gesture !== 'Error' && result.confidence > 0.6) {
        setHistory(prev => {
          const newItem: HistoryItem = { timestamp: Date.now(), result };
          // Keep last 20 items
          return [newItem, ...prev].slice(0, 20);
        });
      }

    } catch (err) {
      console.error("Analysis failed", err);
      // Don't set error state globally here to avoid flashing UI, just log it
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, []);

  const toggleScanning = () => {
    if (appState === AppState.SCANNING) {
      setAppState(AppState.IDLE);
      setCurrentResult(null);
    } else {
      setAppState(AppState.SCANNING);
      setErrorMsg(null);
    }
  };

  const handleError = (msg: string) => {
    setAppState(AppState.ERROR);
    setErrorMsg(msg);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
              <Hand className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
              Gemini Gesture ID
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base max-w-xl">
              Real-time vision system using Gemini 2.5 Flash. Show a hand gesture to the camera to detect it.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Model</div>
              <div className="text-sm text-cyan-300 font-mono">gemini-2.5-flash</div>
            </div>
            <button
              onClick={toggleScanning}
              disabled={appState === AppState.ERROR}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all transform active:scale-95
                ${appState === AppState.SCANNING 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                  : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-cyan-500/25'}
                ${appState === AppState.ERROR ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {appState === AppState.SCANNING ? (
                <>
                  <Square className="w-5 h-5 fill-current" /> Stop System
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Start System
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
          
          {/* Left: Camera Feed */}
          <div className="lg:col-span-2 space-y-4 flex flex-col">
             <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800 flex-1 flex flex-col justify-center">
                <WebcamCapture 
                  isScanning={appState === AppState.SCANNING} 
                  onCapture={handleCapture}
                  onError={handleError}
                />
                
                {/* Result Overlay (Floating) */}
                {currentResult && currentResult.gesture !== 'None' && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:min-w-[300px] bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl animate-bounce-subtle">{currentResult.emoji}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{currentResult.gesture}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-400 transition-all duration-300" 
                              style={{ width: `${currentResult.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-cyan-400">{Math.round(currentResult.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    {currentResult.actionSuggested && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm text-cyan-200">
                        <Sparkles className="w-4 h-4" />
                        <span>Action: <strong>{currentResult.actionSuggested}</strong></span>
                      </div>
                    )}
                  </div>
                )}
             </div>

             {/* Processing Indicator */}
             <div className="h-6 flex items-center gap-2 px-2">
                {isProcessing && (
                  <>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    <span className="text-xs text-cyan-400 font-mono animate-pulse">Processing frame...</span>
                  </>
                )}
                {errorMsg && (
                   <span className="text-xs text-red-400 font-mono flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" /> {errorMsg}
                   </span>
                )}
             </div>
          </div>

          {/* Right: History & Info */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            
            {/* Instruction Card */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border border-indigo-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-200 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> Supported Gestures
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {['👍 Thumbs Up', '👎 Thumbs Down', '✌️ Peace', '✋ Open Palm', '✊ Fist', '☝️ Pointing', '👌 OK', '🫶 Heart', '🤞 Crossed'].map((g, i) => (
                  <div key={i} className="text-xs bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-center text-slate-300 hover:border-indigo-500/30 hover:text-white transition-colors cursor-default">
                    {g}
                  </div>
                ))}
              </div>
            </div>

            {/* History Panel */}
            <div className="flex-1 min-h-[300px]">
              <HistoryPanel history={history} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;
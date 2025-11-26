import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (base64Image: string) => void;
  isScanning: boolean;
  onError: (error: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isScanning, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setPermissionDenied(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPermissionDenied(true);
      onError("Camera access denied or unavailable.");
    }
  }, [onError]);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Capture loop
  useEffect(() => {
    const captureFrame = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current || !streamActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Flip horizontally for mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality for speed
        onCapture(imageData);
      }
    };

    if (isScanning) {
       captureFrame(); // Immediate capture on start
       
       const interval = setInterval(captureFrame, 1500); // 1.5s interval to be safe with rate limits
       return () => clearInterval(interval);
    }
  }, [isScanning, onCapture, streamActive]);

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 group">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className={`absolute inset-0 pointer-events-none ${isScanning ? 'scanning' : ''}`}>
         {/* Scan Line (via CSS) */}
         <div className="scan-line"></div>
         
         {/* Corner Brackets */}
         <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg opacity-70"></div>
         <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg opacity-70"></div>
         <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg opacity-70"></div>
         <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg opacity-70"></div>

         {/* Center Target */}
         {isScanning && (
           <div className="absolute inset-0 flex items-center justify-center opacity-30">
             <div className="w-48 h-48 border border-dashed border-cyan-400 rounded-full animate-pulse"></div>
           </div>
         )}
      </div>

      {/* States */}
      {!streamActive && !permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <RefreshCw className="w-10 h-10 animate-spin mb-2" />
          <p>Initializing Camera...</p>
        </div>
      )}

      {permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-gray-900 z-20">
          <CameraOff className="w-12 h-12 mb-2" />
          <p className="text-lg font-semibold">Camera Access Denied</p>
          <p className="text-sm mt-2 px-4 text-center">Please enable camera permissions in your browser settings to use this app.</p>
          <button 
            onClick={startCamera}
            className="mt-6 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/50 transition-colors pointer-events-auto"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
        <span className="text-xs font-mono text-white/80 uppercase tracking-wider">
          {isScanning ? 'SYSTEM ACTIVE' : 'SYSTEM IDLE'}
        </span>
      </div>
    </div>
  );
};

export default WebcamCapture;
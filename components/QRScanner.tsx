import React, { useEffect, useState, useRef } from 'react';
import { Camera, X, ScanLine, Smartphone } from 'lucide-react';
import jsQR from 'jsqr';
import { getClasses } from '../services/storageService';
import { ClassSection } from '../types';

interface QRScannerProps {
  onScan: (classData: ClassSection) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    // Load class data dynamically
    const loadedClasses = getClasses();
    setClasses(loadedClasses);

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready before starting scan loop
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             setHasPermission(true);
             setScanning(true);
             requestRef.current = requestAnimationFrame(tick);
          };
        }
      } catch (err) {
        console.error("Camera error", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Robust check for jsQR function availability
        if (typeof jsQR === 'function') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
            });

            if (code) {
            console.log("QR Code found:", code.data);
            // Parse the QR code data. 
            // It could be a full URL (https://app.com?classId=myp1-a) or just an ID (myp1-a)
            let detectedClassId = code.data;
            
            try {
                // Try to parse as URL
                const url = new URL(code.data);
                const classIdParam = url.searchParams.get('classId');
                if (classIdParam) detectedClassId = classIdParam;
            } catch (e) {
                // Not a URL, use raw data
            }

            // Find the class
            const foundClass = getClasses().find(c => c.id.toLowerCase() === detectedClassId.toLowerCase());
            
            if (foundClass) {
                onScan(foundClass);
                return; // Stop scanning
            }
            }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  // Manual fallback
  const simulateScan = (cls: ClassSection) => {
    onScan(cls);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-black/50 absolute top-0 w-full z-10 text-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ScanLine className="w-5 h-5 animate-pulse text-emerald-400" />
          Scan Class QR
        </h2>
        <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        {hasPermission === false ? (
          <div className="text-center p-6 text-white max-w-sm">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="mb-4">Camera access denied or unavailable.</p>
            <p className="text-sm text-gray-400">Please select a class manually below.</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            {/* Scan Overlay */}
            <div className="relative w-64 h-64 border-2 border-emerald-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex items-center justify-center">
               <div className="w-full h-0.5 bg-red-500 absolute animate-[ping_1.5s_ease-in-out_infinite] opacity-50 top-1/2" />
               <p className="absolute -bottom-8 text-white text-sm font-medium">Align QR code within frame</p>
            </div>
          </>
        )}
      </div>

      {/* Manual Fallback / Demo Controls */}
      <div className="bg-white p-6 rounded-t-2xl">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-2">Manual Select</p>
          <p className="text-xs text-gray-400">If scanning fails, select class below:</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => simulateScan(cls)}
              className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
            >
              <Smartphone className="w-5 h-5 mb-1 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">{cls.grade} - {cls.section}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
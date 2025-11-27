// =============================================================================
// QR Scan Page - QR 코드 스캔으로 입장
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Header, Button } from '@/shared/ui';
import { useDepartment } from '@/features/department';

export default function QRScanPage() {
  const { dept } = useParams<{ dept: string }>();
  const navigate = useNavigate();
  const { department } = useDepartment();
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
          scanQR();
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      }
    };

    const scanQR = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationId = requestAnimationFrame(scanQR);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // QR 코드 디코딩 (BarcodeDetector API 사용)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const data = barcodes[0].rawValue;
            handleQRData(data);
            return;
          }
        } catch (e) {
          // 계속 스캔
        }
      }

      animationId = requestAnimationFrame(scanQR);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const handleQRData = (data: string) => {
    // QR 데이터에서 테이블 코드 추출
    // 예상 형식: https://kupub.example.com/cs/table/A1 또는 A1
    try {
      let tableCode = data;
      
      if (data.includes('/table/')) {
        const parts = data.split('/table/');
        tableCode = parts[parts.length - 1];
      }

      // 코드 입력 페이지로 이동하면서 테이블 코드 전달
      navigate(`/${dept}/code?table=${encodeURIComponent(tableCode)}`);
    } catch (e) {
      setError('잘못된 QR 코드입니다.');
    }
  };

  return (
    <Layout>
      <Header title="QR 스캔" showBack />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate(`/${dept}/code`)}>
              코드로 입력하기
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="relative aspect-square bg-black rounded-2xl overflow-hidden mb-6">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* 스캔 영역 표시 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-2xl">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                </div>
              </div>
              
              {/* 스캔 애니메이션 */}
              {scanning && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 animate-scan" />
              )}
            </div>
            
            <p className="text-center text-neutral-500 mb-4">
              테이블의 QR 코드를 스캔해주세요
            </p>
            
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(`/${dept}/code`)}
            >
              코드로 직접 입력
            </Button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); }
          50% { transform: translateY(100px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
}


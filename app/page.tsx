'use client';

import { useRef, useState, useEffect } from 'react';
import { HomePage } from "@/components/pages/HomePage";
import { ScanPage } from "@/components/pages/ScanPage";
import { ResultPage, ScanResult } from "@/components/pages/ResultPage";
import SafeAreaWrapper from '@/components/ui/safeAreaWrapper';
import { event } from '@/lib/gtag';

// 頁面類型枚舉
enum PageType {
  HOME = 'home',
  SCAN = 'scan',
  RESULT = 'result',
}

export default function App() {
  // 狀態管理
  const [currentPage, setCurrentPage] = useState<PageType>(PageType.HOME);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 重置掃描狀態函數
  const resetScanState = () => {
    setScanResult(null);
    setScanImage(null);
    setUploadError(null);
    setIsLoading(false);
  };
  
  // 啟動相機 (在SCAN頁面時)
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      if (currentPage !== PageType.SCAN) return;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setHasCamera(true);
      } catch (err) {
        console.error('相機啟動失敗:', err);
        setHasCamera(false);
      }
    };
    
    startCamera();
    
    // 清理相機
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentPage]);

  // 拍照並處理
  const captureImage = async () => {
    event('click_start_scan', {
      event_category: 'feature_use',
      event_label: '開始辨識',
    });

    setIsLoading(true);
    setUploadError(null);
    
    if (!videoRef.current || !canvasRef.current) {
      setIsLoading(false);
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsLoading(false);
      return;
    }
    
    // 設定Canvas尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 繪製視頻幀到Canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // 將Canvas內容轉換為Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          console.log('Blob created:', blob);
          if (blob) resolve(blob);
          else throw new Error('無法創建圖片檔案');
        }, 'image/jpeg', 0.85);
      });
      
      // 創建FormData並添加圖片
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');
      
      // 發送到API進行上傳和處理
      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上傳失敗');
      }
      
      const data = await response.json();
      
      // 保存照片
      const imageUrl = URL.createObjectURL(blob);
      setScanImage(imageUrl);
      setScanResult(data);
      
      // 切換到結果頁面
      setCurrentPage(PageType.RESULT);
    } catch (error) {
      console.error('上傳圖像失敗:', error);
      setUploadError((error as Error).message || '上傳圖像失敗，請重試');
      setIsLoading(false);
    }
  };
  
  // 根據當前頁面狀態渲染相應的視圖
  const renderCurrentPage = () => {
    switch (currentPage) {
      case PageType.HOME:
        return <HomePage onScanClick={() => {
          event('click_go_to_scan', {
            event_category: 'feature_use',
            event_label: '立即開始辨識',
          });
          setCurrentPage(PageType.SCAN)
        }} />;
      case PageType.SCAN:
        return (
          <ScanPage 
            onBackClick={() => {
              resetScanState();
              setCurrentPage(PageType.HOME);
              event('click_back', {
                event_category: 'interaction',
                event_label: 'back_to_home',
              });
            }}
            captureImage={captureImage}
            isLoading={isLoading}
            uploadError={uploadError}
            hasCamera={hasCamera}
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
        );
      case PageType.RESULT:
        return (
          <ResultPage 
            scanResult={scanResult}
            scanImage={scanImage}
            onBackClick={() => {
              resetScanState();
              setCurrentPage(PageType.SCAN);
              event('click_back', {
                event_category: 'interaction',
                event_label: 'back_to_scan',
              });
            }}
            onHomeClick={() => {
              resetScanState();
              setCurrentPage(PageType.HOME);
              event('click_home', {
                event_category: 'interaction',
                event_label: 'back_to_home',
              });
            }}
            onRescanClick={() => {
              resetScanState();
              setCurrentPage(PageType.SCAN);
              event('click_back', {
                event_category: 'interaction',
                event_label: 'back_to_scan',
              });
            }}
          />
        );
      default:
        return <HomePage onScanClick={() => setCurrentPage(PageType.SCAN)} />;
    }
  };

  return <SafeAreaWrapper>
    {renderCurrentPage()}
  </SafeAreaWrapper> 
}

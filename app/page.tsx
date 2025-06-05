'use client';

import Image from "next/image";
import { useRef, useState, useEffect } from 'react';
import { CameraIcon, ArrowLeftIcon } from "@/components/icons";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// API返回的分析結果類型
interface ScanResult {
  ocrText: string;
  result: {
    type: "全素" | "蛋奶素" | "五葷素" | "非素食" | "無法判斷";
    reasoning: string;
    riskyKeywords: string[];
  }
}

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
  const scanId = `scan-${Date.now()}`;
  
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
            facingMode: 'environment',
            width: { ideal: 1080 },
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
      
      // 上傳成功，將結果保存
      const resultData = {
        ocrText: data.ocrText,
        result: data.result,
        timestamp: new Date().toISOString()
      };
      
      // 保存照片
      const imageUrl = URL.createObjectURL(blob);
      setScanImage(imageUrl);
      setScanResult(resultData);
      
      // 保存到本地存儲 (選擇性的，可以移除)
      localStorage.setItem(scanId, JSON.stringify(resultData));
      
      // 切換到結果頁面
      setCurrentPage(PageType.RESULT);
    } catch (error) {
      console.error('上傳圖像失敗:', error);
      setUploadError((error as Error).message || '上傳圖像失敗，請重試');
      setIsLoading(false);
    }
  };

  // 根據素食類型獲取結果描述
  const getResultInfo = (type: "全素" | "蛋奶素" | "五葷素" | "非素食" | "無法判斷") => {
    switch (type) {
      case "全素":
        return {
          label: '全素',
          color: 'bg-green-100 text-green-800 hover:bg-green-200',
          description: '這是純素食品，不含任何動物來源成分及五辛'
        };
      case "蛋奶素":
        return {
          label: '蛋奶素',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          description: '這是蛋奶素食品，含有蛋/奶成分，不含肉類與五辛'
        };
      case "五葷素":
        return {
          label: '五葷素',
          color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          description: '這是五葷素食品，不含肉類，但含有蔥、蒜等五辛成分'
        };
      case "非素食":
        return {
          label: '非素食',
          color: 'bg-red-100 text-red-800 hover:bg-red-200',
          description: '⚠️ 這不是素食品，含有肉、魚、雞或其他動物性成分'
        };
      case "無法判斷":
      default:
        return {
          label: '無法判斷',
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          description: '無法判斷食品類型，請參考詳細分析說明'
        };
    }
  };

  // 1. 首頁視圖
  const renderHomePage = () => {
    return (
      <div className="flex flex-col items-center min-h-screen bg-background">
        {/* Banner Image - Full Width */}
        <div className="w-full max-w-4xl mb-2">
          <AspectRatio ratio={3/2}>
            <Image
              src="/banner.png"
              alt="素食掃描儀"
              fill
              priority
              className="object-cover"
            />
          </AspectRatio>
        </div>
        <main className="flex flex-col w-full max-w-md mx-auto px-4 py-6">
          
          {/* 標題和簡介 */}
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center mb-2" style={{ color: '#4CAF50' }}>
                素食掃描器
              </CardTitle>
              <CardDescription className="text-center mb-4">
                快速辨識食品包裝是否為素食可食用！
              </CardDescription>
            </CardHeader>
            <CardContent className="mb-6">
              <p className="text-center text-muted-foreground">
                只需拍攝食品包裝照片，我們的智能AI系統將立即告訴您該食品是否適合您的飲食需求。
              </p>
            </CardContent>
          
          {/* 開始掃描按鈕 */}
          <Button 
            variant="default" 
            size="lg"
            className="w-full py-6 text-white font-bold rounded-full text-lg shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
            onClick={() => setCurrentPage(PageType.SCAN)}
          >
            <CameraIcon className="h-6 w-6" />
            開始掃描
          </Button>
          
          {/* 底部信息 */}
          <footer className="mt-12 text-center text-xs text-muted-foreground">
            <p>為健康與環保的生活方式而設計</p>
            <p className="mt-1">© {new Date().getFullYear()} 素食掃描儀</p>
          </footer>
        </main>
      </div>
    );
  };

  // 2. 掃描頁面視圖
  const renderScanPage = () => {
    return (
      <div className="flex flex-col min-h-screen w-full max-w-md mx-auto px-4 py-6">
        {/* Header with back button */}
        <header className="flex items-center mb-6">
          <Button 
            variant="link" 
            className="text-primary p-0 flex items-center gap-2"
            onClick={() => {
              resetScanState();
              setCurrentPage(PageType.HOME);
            }}
          >
            <ArrowLeftIcon className="h-6 w-6" />
            返回首頁
          </Button>
        </header>
        
        <main className="flex flex-col flex-grow items-center justify-center">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-primary">
                食品掃描
              </CardTitle>
              <CardDescription className="text-center">
                拍攝食品包裝以識別其成分
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {hasCamera ? (
                <div className="w-full aspect-square bg-black rounded-xl overflow-hidden relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-primary/30 animate-spin"></div>
                        <p className="text-white mt-4">上傳並分析中...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-muted-foreground">無法存取相機</p>
                </div>
              )}
              
              {uploadError && (
                <div className="w-full p-3 rounded bg-red-50 text-red-700 text-sm">
                  <p>{uploadError}</p>
                </div>
              )}
              
              <Button
                variant="default"
                size="lg"
                className="bg-primary hover:bg-primary/90 rounded-full px-8"
                disabled={isLoading || !hasCamera}
                onClick={captureImage}
              >
                {isLoading ? '處理中...' : '拍攝照片'}
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    如何使用？
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>使用說明</SheetTitle>
                    <SheetDescription>
                      了解如何使用素食掃描儀
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <p>1. 將食品包裝上的成分表清晰地放入相機框內</p>
                    <p>2. 點擊「拍攝照片」按鈕</p>
                    <p>3. 等待分析結果</p>
                    <p>4. 查看食品是否為素食可食用</p>
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        </main>
        
        <footer className="mt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} 素食掃描儀</p>
        </footer>
      </div>
    );
  };

  // 3. 結果頁面視圖
  const renderResultPage = () => {
    if (!scanResult) {
      return (
        <div className="flex flex-col min-h-screen w-full max-w-md mx-auto px-4 py-6">
          <header className="flex items-center mb-6">
            <Button 
              variant="link" 
              className="text-primary p-0 flex items-center gap-2"
              onClick={() => setCurrentPage(PageType.SCAN)}
            >
              <ArrowLeftIcon className="h-6 w-6" />
              返回掃描
            </Button>
          </header>
          <main className="flex flex-col flex-grow items-center justify-center">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-center text-red-600">
                  找不到結果
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p>無法找到掃描結果，請重新掃描。</p>
              </CardContent>
              <CardFooter className="flex justify-center">              <Button onClick={() => {
                resetScanState();
                setCurrentPage(PageType.SCAN);
              }}>
                重新掃描
              </Button>
              </CardFooter>
            </Card>
          </main>
        </div>
      );
    }
    
    const resultInfo = getResultInfo(scanResult.result.type);
    
    return (
      <div className="flex flex-col min-h-screen w-full max-w-md mx-auto px-4 py-6">
        {/* Header with back button */}
        <header className="flex items-center mb-6">
          <Button 
            variant="link" 
            className="text-primary p-0 flex items-center gap-2"
            onClick={() => {
              resetScanState();
              setCurrentPage(PageType.SCAN);
            }}
          >
            <ArrowLeftIcon className="h-6 w-6" />
            返回掃描
          </Button>
        </header>
        
        <main className="flex flex-col flex-grow items-center">
          <Card className="w-full mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                分析結果
              </CardTitle>
              <CardDescription className="text-center">
                掃描ID: {scanId}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {scanImage && (
                <div className="w-full mb-4">
                  <AspectRatio ratio={1/1} className="bg-muted rounded-lg overflow-hidden">
                    <Image 
                      src={scanImage}
                      alt="掃描的成分圖片"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                      priority
                    />
                  </AspectRatio>
                  <p className="text-xs text-center text-muted-foreground mt-1">上傳的食品成分圖片</p>
                </div>
              )}
              
              <div className="mb-6 text-center">
                <Badge 
                  className={`${resultInfo.color} text-lg py-2 px-6 font-medium shadow-sm ${resultInfo.label === '非素食' ? 'animate-pulse border border-red-500' : ''}`}
                >
                  {resultInfo.label === '非素食' ? '⚠️ 非素食 ⚠️' : resultInfo.label}
                </Badge>
                <p className="mt-3 text-muted-foreground">
                  {resultInfo.description}
                </p>
              </div>
              
              <div className="w-full">
                <h3 className="text-lg font-medium mb-2">分析說明</h3>
                <div className={`p-4 rounded-lg mb-4 text-sm ${scanResult.result.type === '非素食' 
                  ? 'bg-red-50 border-l-4 border-red-500' 
                  : 'bg-muted border-l-4 border-primary'}`}
                >
                  <p className="whitespace-pre-wrap">{scanResult.result.reasoning}</p>
                </div>

                {scanResult.result.riskyKeywords.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <span>有疑慮的成分</span>
                      <span className="text-xs text-red-600 font-normal">(可能含動物性或五辛成分)</span>
                    </h3>
                    <div className="p-4 bg-red-50 rounded-lg mb-4">
                      <div className="flex flex-wrap gap-2">
                        {scanResult.result.riskyKeywords.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="outline"
                            className="border-red-300 text-red-700 text-sm py-1"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <h3 className="text-lg font-medium mb-2">OCR 識別文字</h3>
                <div className="p-3 bg-muted rounded-lg mb-4 text-xs opacity-80">
                  <p className="whitespace-pre-wrap">{scanResult.ocrText}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => {
                resetScanState();
                setCurrentPage(PageType.HOME);
              }}>
                返回首頁
              </Button>
            </CardFooter>
          </Card>
        </main>
        
        <footer className="mt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} 素食掃描儀</p>
        </footer>
      </div>
    );
  };
  
  // 根據當前頁面狀態渲染相應的視圖
  const renderCurrentPage = () => {
    switch (currentPage) {
      case PageType.HOME:
        return renderHomePage();
      case PageType.SCAN:
        return renderScanPage();
      case PageType.RESULT:
        return renderResultPage();
      default:
        return renderHomePage();
    }
  };

  return renderCurrentPage();
}

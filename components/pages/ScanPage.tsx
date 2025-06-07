import { ArrowLeftIcon } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ScanPageProps {
  onBackClick: () => void;
  captureImage: () => void;
  isLoading: boolean;
  uploadError: string | null;
  hasCamera: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function ScanPage({ 
  onBackClick, 
  captureImage, 
  isLoading, 
  uploadError, 
  hasCamera,
  videoRef,
  canvasRef
}: ScanPageProps) {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-6 bg-gradient-to-b from-amber-50 to-green-50">
      {/* Header with back button */}
      <header className="flex items-center mb-6">
        <Button 
          variant="link" 
          className="text-green-700 p-0 flex items-center gap-2 hover:text-green-800"
          onClick={onBackClick}
        >
          <ArrowLeftIcon className="h-6 w-6" />
          返回首頁
        </Button>
      </header>
      
      <main className="flex flex-col flex-grow items-center justify-center">
        <Card className="w-full border border-green-100 shadow-sm rounded-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">
              食品掃描
            </CardTitle>
            <CardDescription className="text-center">
              拍攝食品成分表以識別其成分
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
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 shadow-md transition-all"
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
                  className="mt-2 text-green-700 border-green-200 hover:bg-green-50"
                >
                  如何使用？
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl p-6">
                <SheetHeader>
                  <SheetTitle>如何使用素食掃描儀</SheetTitle>
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
}

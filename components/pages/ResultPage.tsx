import Image from "next/image";
import { ArrowLeftIcon } from "@/components/icons";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// API返回的分析結果類型
export interface ScanResult {
  ocrText: string;
  result: {
    type: "全素" | "蛋奶素" | "五葷素" | "非素食" | "無法判斷";
    reasoning: string;
    riskyKeywords: string[];
  }
}

// 結果信息類型
interface ResultInfo {
  label: string;
  color: string;
  description: string;
}

interface ResultPageProps {
  scanResult: ScanResult | null;
  scanImage: string | null;
  scanId: string;
  onBackClick: () => void;
  onHomeClick: () => void;
  onRescanClick: () => void;
}

// 根據素食類型獲取結果描述
const getResultInfo = (type: "全素" | "蛋奶素" | "五葷素" | "非素食" | "無法判斷"): ResultInfo => {
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

export function ResultPage({ scanResult, scanImage, scanId, onBackClick, onHomeClick, onRescanClick }: ResultPageProps) {
  if (!scanResult) {
    return (
      <div className="flex flex-col w-full max-w-md mx-auto px-4 py-6 bg-gradient-to-b from-amber-50 to-green-50">
        <header className="flex items-center mb-6">
          <Button 
            variant="link" 
            className="text-green-700 p-0 flex items-center gap-2 hover:text-green-800"
            onClick={onBackClick}
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
            <CardFooter className="flex justify-center">
              <Button onClick={onRescanClick}>
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
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto px-4 py-6 bg-gradient-to-b from-amber-50 to-green-50">
      {/* Header with back button */}
      <header className="flex items-center mb-6">
        <Button 
          variant="link" 
          className="text-green-700 p-0 flex items-center gap-2 hover:text-green-800"
          onClick={onBackClick}
        >
          <ArrowLeftIcon className="h-6 w-6" />
          返回掃描
        </Button>
      </header>
      
      <main className="flex flex-col flex-grow items-center">
        <Card className="w-full mb-6 border border-green-100 shadow-sm rounded-xl bg-white/80 backdrop-blur-sm">
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
            <Button onClick={onHomeClick}>
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
}

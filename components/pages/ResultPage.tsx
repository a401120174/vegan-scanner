import Image from "next/image";
import { ArrowLeftIcon } from "@/components/icons";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react"; // Added ThumbsUp, ThumbsDown
import { useState } from "react"; // Added useState import
import { event } from "@/lib/gtag";

type FlagLevel = "caution" | "warning";
type ResultType = "ok" | "caution" | "warning" | "unknown";

// API返回的分析結果類型
export interface ScanResult {
  ocrText: string;
  result: {
    flags: Array<{ ingredient: string; level: FlagLevel }>;
    reasoning: string[];
    suggestion: string;
    type: ResultType;
  };
}

interface ResultPageProps {
  scanResult: ScanResult | null;
  scanImage: string | null;
  onBackClick: () => void;
  onHomeClick: () => void;
  onRescanClick: () => void;
}

const getResultInfo = (type: ResultType): string => {
  switch (type) {
    case "ok":
      return '此產品不含任何動物性或五辛成分，符合全素食飲食原則。'
    case "caution":
      return '此產品含有部分素食者可能會避開的成分（如：蛋、奶、蜂蜜或蔥蒜五辛等）。';
    case "warning":
      return '此產品含有明確的動物性成分（如肉類、魚介、明膠等），不符合素食者飲食原則。';
    default:
      return '無法判斷食品類型，可能不是食品成分表或資訊過少，無法判斷是否符合素食。'
  }
};

export function ResultPage({ scanResult, scanImage, onBackClick, onHomeClick, onRescanClick }: ResultPageProps) {
  // Add state for feedback
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);

  // Feedback handler function
  const handleFeedback = (type: 'up' | 'down') => {
    setFeedbackGiven(type);
    setShowFeedbackThanks(true);
    
    // Hide the thank you message after 3 seconds
    setTimeout(() => {
      setShowFeedbackThanks(false);
    }, 3000);

    event('feedback_given', {
      feedback_type: type,
      scan_result: scanResult?.ocrText || '',
    });
    
  };
  
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

  console.log("Scan Result:", scanResult);
  
  const resultInfo = getResultInfo(scanResult.result.type);
  
  // Helper function to get the icon based on result type
  const getResultIcon = (type: ResultType) => {
    switch (type) {
      case "ok":
        return <CheckCircle className="h-12 w-12" />;
      case "caution":
        return <AlertCircle className="h-12 w-12" />;
      case "warning":
        return <XCircle className="h-12 w-12" />;
      default:
        return <HelpCircle className="h-12 w-12" />;
    }
  };

  // Get result icon color based on type
  const getResultIconColor = (type: ResultType) => {
    switch (type) {
      case "ok":
        return "text-green-600";
      case "caution":
        return "text-amber-600";
      case "warning":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Get badge color based on level
  const getFlagBadgeStyle = (level: "caution" | "warning") => {
    switch (level) {
      case "warning":
        return "border-red-400 bg-red-100 text-red-800";
      case "caution":
        return "border-amber-400 bg-amber-50 text-amber-800";
      default:
        return "border-red-300 text-red-700";
    }
  };

  const resultIconColor = getResultIconColor(scanResult.result.type);

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
        <Card className="w-full mb-6 shadow-sm rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              分析結果
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* 圖片區域 */}
            {scanImage && (
                <div className="max-w-xs mx-auto">
                  <AspectRatio ratio={1/1} className="bg-muted rounded-lg overflow-hidden shadow-sm">
                    <Image 
                      src={scanImage}
                      alt="掃描的成分圖片"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                      priority
                    />
                  </AspectRatio>
                  <p className="text-xs text-center text-muted-foreground mt-2">上傳的食品成分圖片</p>
                </div>
            )}
                          
            {/* 結果圖標區域 */}
            <div className="py-8 bg-white border-b border-green-100 text-center">
              <div className="flex justify-center items-center mb-4">
                <div className={`p-4 rounded-full bg-gray-50 shadow-sm ${resultIconColor}`}>
                  {getResultIcon(scanResult.result.type)}
                </div>
              </div>
              <p className="px-8 text-center font-medium">
                {resultInfo}
              </p>
            </div>
            
            {/* 內容區域 */}
            <div className="p-6 space-y-6">
              {/* 有疑慮的成分 */}
              {scanResult.result.flags.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-left flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    有疑慮的成分
                  </h3>
                  <div className="p-4 rounded-lg border border-red-100">
                    <div className="flex flex-wrap gap-2">
                      {scanResult.result.flags.map((flag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline"
                          className={`${getFlagBadgeStyle(flag.level)} text-sm py-1`}
                        >
                          {flag.ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 分析說明 */}
              {scanResult.result.reasoning.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-left">分析說明</h3>
                <div className={`p-4 rounded-lg text-sm border ${scanResult.result.type === 'warning' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-muted border-slate-200'}`}
                >
                  <ul className="list-disc pl-5 space-y-1">
                    {scanResult.result.reasoning.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </section>
              )}

              {/* 建議 */}
              {scanResult.result.suggestion && scanResult.result.suggestion.trim() !== '' && (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-left">建議</h3>
                  <div className="p-4 text-sm italic bg-amber-50 border border-amber-200 rounded-lg">
                    {scanResult.result.suggestion}
                  </div>
                </section>
              )}

              {/* OCR 識別文字 */}
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-left">識別出的文字</h3>
                <div className="pl-4 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-s text-gray-600">
                  <p className="whitespace-pre-wrap">{scanResult.ocrText}</p>
                </div>
              </section>
              
              {/* Feedback section */}
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-left">這個結果是否對你有幫助？</h3>
                <div className="flex items-center justify-center gap-8 py-2">
                  <Button 
                    variant="outline" 
                    className={`flex items-center gap-2 px-6 py-2 ${feedbackGiven === 'up' ? 'bg-green-100 border-green-500' : ''}`} 
                    onClick={() => handleFeedback('up')}
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsUp className="h-5 w-5" />
                    有幫助
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`flex items-center gap-2 px-6 py-2 ${feedbackGiven === 'down' ? 'bg-red-100 border-red-500' : ''}`} 
                    onClick={() => handleFeedback('down')}
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsDown className="h-5 w-5" />
                    沒幫助
                  </Button>
                </div>
                {showFeedbackThanks && (
                  <div className="text-center text-green-600 animate-fade-in py-2">
                    感謝您的反饋！我們會繼續改進。
                  </div>
                )}
              </section>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-6 border-t border-green-100 bg-green-50/50">
            <Button onClick={onHomeClick} className="px-8">
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

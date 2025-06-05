import Image from "next/image";
import { CameraIcon } from "@/components/icons";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose 
} from "@/components/ui/sheet";
import { useState } from "react";

interface HomePageProps {
  onScanClick: () => void;
}

interface FAQItem {
  id: number;
  question: string;
  answer: React.ReactNode;
}

export function HomePage({ onScanClick }: HomePageProps) {
  const [openSheet, setOpenSheet] = useState<number | null>(null);
  
  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: "我們怎麼判斷素食？",
      answer: (
        <div className="space-y-4">
          <p>我們使用 AI 圖像辨識技術與成分比對模型，來判斷食品是否符合不同的素食標準。</p>
          <p>當您拍下食品成分表，我們的系統會分析其中的關鍵字，交叉比對常見的動物性成分（如「魚露」、「雞肉萃取」、「蛋白」等），並結合專業素食分類（全素、蛋奶素、五辛素）給出判斷結果。</p>
          <p>我們的目標是協助使用者更方便地識別每日飲食中的成分，降低誤食風險。</p>
        </div>
      )
    },
    {
      id: 2,
      question: "🔐 隱私問題與安全性",
      answer: (
        <div className="space-y-4">
          <p>我們非常重視您的隱私。</p>
          <p>您拍攝的照片僅會在您的裝置與我們的伺服器之間進行即時分析，不會被儲存、瀏覽或用於其他用途。</p>
          <p>我們不會紀錄您的裝置資訊或個人資料，所有處理均符合隱私權保護原則。</p>
          <p>使用本 App，即表示您同意我們以匿名、暫時的方式使用照片進行分析，處理完畢後即會自動清除。</p>
        </div>
      )
    },
    {
      id: 3,
      question: "📸 如何使用這個 App？",
      answer: (
        <div className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>開啟 App 後，點選「開始拍照」</li>
            <li>對準食品的成分標示</li>
            <li>點擊拍照按鈕後，系統會自動分析內容</li>
            <li>幾秒鐘內，即可看到食品是否為全素、蛋奶素、五辛素或非素食</li>
            <li>分析結果會附上「成分說明」與「風險標示」</li>
          </ol>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-50 to-green-50">
      {/* Banner Image - Full Width */}
      <div className="w-full max-w-4xl mb-2 drop-shadow-sm">
        <AspectRatio ratio={3/2}>
          <Image
            src="/banner.png"
            alt="素食掃描儀"
            fill
            priority
            className="object-cover rounded-b-xl"
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
              快速辨識食品是否為素食可食用！
            </CardDescription>
          </CardHeader>
          <CardContent className="mb-6">
            <p className="text-center text-muted-foreground">
              只需拍攝食品成分照片，我們的智能AI系統將立即告訴您該食品是否適合您的飲食需求。
            </p>
          </CardContent>
        
        {/* 開始掃描按鈕 */}
        <Button 
          variant="default" 
          size="lg"
          className="w-full py-6 text-white font-bold rounded-full text-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg"
          style={{ backgroundColor: '#8BC34A', borderColor: '#8BC34A' }}
          onClick={onScanClick}
        >
          <CameraIcon className="h-6 w-6" />
          開始掃描
        </Button>
        
        {/* Q&A 區塊 */}
        <div className="mt-8">
          <h2 className="text-xl text-center font-semibold text-green-800 mb-4">常見問題</h2>
          <div className="space-y-3 w-full">
            {faqItems.map((item) => (
              <Sheet key={item.id} open={openSheet === item.id} onOpenChange={(open) => {
                setOpenSheet(open ? item.id : null);
              }}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full py-4 text-left justify-between bg-white hover:bg-green-50 border border-green-100"
                  >
                    <span>{item.question}</span>
                    <span className="text-green-600">→</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl p-6">
                  <SheetHeader className="border-b pb-4 mb-4">
                    <SheetTitle className="text-xl text-green-800">{item.question}</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto pr-1 text-gray-700 leading-relaxed">
                    {item.answer}
                  </div>
                  <div className="mt-6 text-center">
                    <SheetClose asChild>
                      <Button variant="outline" className="rounded-full">
                        關閉
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </div>
        
        {/* 底部信息 */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>為健康與環保的生活方式而設計</p>
          <p className="mt-1">© {new Date().getFullYear()} 素食掃描儀</p>
        </footer>
      </main>
    </div>
  );
}

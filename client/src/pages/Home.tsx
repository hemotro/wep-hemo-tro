import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const { data: seriesList, isLoading } = trpc.series.list.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoPlay || !seriesList || seriesList.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % seriesList.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, seriesList]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setAutoPlay(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!seriesList || seriesList.length === 0) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % seriesList.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + seriesList.length) % seriesList.length);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المسلسلات...</p>
        </div>
      </div>
    );
  }

  if (!seriesList || seriesList.length === 0) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">مرحباً بك في hemo tro</h1>
          <p className="text-muted-foreground">لا توجد مسلسلات حالياً</p>
        </div>
      </div>
    );
  }

  const currentSeries = seriesList[currentSlide];
  const currentBanner = currentSeries?.posterUrl;

  return (
    <div className="flex-1 pb-20">
      {/* Carousel في الأعلى */}
      <div className="relative w-full">
        {currentSeries && (
          <div
            ref={carouselRef}
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* الصورة الكبيرة بدون غلاف */}
            <div className="relative w-full h-80 md:h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-br from-primary/20 to-background">
              {currentBanner && (
                <>
                  <img
                    src={currentBanner}
                    alt={currentSeries.titleAr}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                </>
              )}

              {/* الشعار والقائمة العلوية - بدون خلفية سوداء */}
              <div className="absolute top-0 left-0 right-0 z-20 px-4 md:px-8 py-4 flex items-center justify-between">
                {/* الشعار */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-primary font-bold text-base md:text-lg">HT</span>
                  </div>
                  <span className="text-white font-bold text-xl md:text-2xl drop-shadow-lg">hemo tro</span>
                </div>

                {/* قائمة التنقل */}
                <div className="hidden md:flex items-center gap-6 text-white text-sm drop-shadow-lg">
                  <button className="hover:text-primary transition-colors">مسلسلات</button>
                  <button className="hover:text-primary transition-colors">أفلام</button>
                  <button className="hover:text-primary transition-colors">رياضة</button>
                  <button className="hover:text-primary transition-colors">بث مباشر</button>
                </div>
              </div>

              {/* معلومات المسلسل - تظهر عند التمرير للأسفل */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black via-black/50 to-transparent translate-y-0 transition-transform duration-300">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{currentSeries.titleAr}</h2>
                <p className="text-primary text-base md:text-lg mb-4">{currentSeries.genre}</p>
                <Link href={`/series/${currentSeries.id}`}>
                  <a>
                    <Button className="w-full md:w-64 bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3">
                      <Play className="w-5 h-5 mr-2" />
                      شاهد الآن
                    </Button>
                  </a>
                </Link>
              </div>

              {/* مؤشرات الشرائح - بدون أزرار تنقل */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {seriesList.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      setAutoPlay(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? "bg-primary w-6" : "bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`انتقل إلى الشريحة ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* قائمة أفقية للمسلسلات */}
      <div className="px-4 py-6">
        <h3 className="text-lg font-bold text-foreground mb-4">جميع المسلسلات</h3>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-min">
            {seriesList.map((series) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <a className="flex-shrink-0 group">
                  <div className="relative w-32 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-background">
                    {series.posterUrl ? (
                      <>
                        <img
                          src={series.posterUrl}
                          alt={series.titleAr}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Play className="w-3 h-3 mr-1" />
                            شاهد
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                        <p className="text-sm font-semibold text-foreground mb-2">{series.titleAr}</p>
                        <p className="text-xs text-muted-foreground">{series.totalEpisodes} حلقة</p>
                      </div>
                    )}
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: seriesList, isLoading } = trpc.series.list.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || !seriesList || seriesList.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % seriesList.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, seriesList]);

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % seriesList.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + seriesList.length) % seriesList.length);
    setAutoPlay(false);
  };

  return (
    <div className="flex-1 pb-20">
      {/* Carousel في الأعلى */}
      <div className="relative w-full">
        {currentSeries && (
          <div className="relative">
            {/* الصورة الكبيرة */}
            <div className="relative w-full h-80 md:h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-br from-primary/20 to-background">
              {currentBanner && (
                <>
                  <img
                    src={currentBanner}
                    alt={currentSeries.titleAr}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                </>
              )}

              {/* معلومات المسلسل */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black via-black/50 to-transparent">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{currentSeries.titleAr}</h2>
                <p className="text-primary text-base md:text-lg mb-4">{currentSeries.genre}</p>
                <Link href={`/series/${currentSeries.id}`}>
                  <a>
                    <Button className="w-full md:w-64 bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3">
                      <Play className="w-5 h-5 mr-2" />
                      شاهالآن
                    </Button>
                  </a>
                </Link>
              </div>

              {/* أزرار التنقل */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* مؤشرات الشرائح */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {seriesList.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      setAutoPlay(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? "bg-primary w-6" : "bg-white/50"
                    }`}
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

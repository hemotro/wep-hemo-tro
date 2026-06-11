import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // استدعاء البيانات
  const { data: sliderData, isLoading: sliderLoading } = trpc.slider.list.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: seriesList, isLoading: seriesLoading } = trpc.series.list.useQuery();

  // معالجة التمرير
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // تحديد السلاسل المراد عرضها في السلايدر
  const displaySeries = sliderData && sliderData.length > 0
    ? sliderData.map((slider: any) => 
        seriesList?.find((s: any) => s.id === slider.seriesId)
      ).filter(Boolean)
    : [];

  // تحديث الشريحة تلقائياً
  useEffect(() => {
    if (!autoPlay || displaySeries.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySeries.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, displaySeries.length]);

  if (sliderLoading || categoriesLoading || seriesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const currentSeries = displaySeries[currentSlide];
  const currentBanner = currentSeries?.posterUrl;

  // حساب Parallax offset
  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="flex-1 pb-20">
      {/* السلايدر الرئيسي */}
      <div className="relative w-full overflow-hidden">
        {displaySeries && displaySeries.length > 0 && currentSeries ? (
          <div className="relative w-full h-screen max-h-[600px] overflow-hidden">
            {/* الخلفية مع Parallax */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{
                backgroundImage: `url('${currentBanner}')`,
                backgroundPosition: `center ${parallaxOffset}px`,
                filter: "brightness(0.4)",
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

            {/* المحتوى */}
            <div className="relative h-full flex flex-col justify-center px-4 sm:px-8 md:px-12">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                  {currentSeries.titleAr}
                </h2>
                <p className="text-primary text-sm md:text-lg mb-4 drop-shadow-lg">
                  {(currentSeries as any).genre || ""}
                </p>
                <Link href={`/series/${currentSeries.id}`}>
                  <a>
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 px-8 rounded-lg">
                      <Play className="w-5 h-5 mr-2" />
                      شاهد الآن
                    </Button>
                  </a>
                </Link>
              </div>
            </div>

            {/* أزرار التنقل */}
            {displaySeries.length > 1 && (
              <>
                <button
                  onClick={() => {
                    setCurrentSlide((prev) => (prev - 1 + displaySeries.length) % displaySeries.length);
                    setAutoPlay(false);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
                  aria-label="الشريحة السابقة"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => {
                    setCurrentSlide((prev) => (prev + 1) % displaySeries.length);
                    setAutoPlay(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
                  aria-label="الشريحة التالية"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* مؤشرات الشرائح */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {displaySeries.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setAutoPlay(false);
                  }}
                  className={`rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-primary w-6 h-2"
                      : "bg-white/50 hover:bg-white/70 w-2 h-2"
                  }`}
                  aria-label={`انتقل إلى الشريحة ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* عرض الأقسام */}
      {categories && categories.length > 0 && seriesList && (
        <div className="space-y-8 px-4 sm:px-8 md:px-12 py-12 max-w-7xl mx-auto">
          {categories.map((category: any) => {
            const categorySeriesList = seriesList?.filter(
              (series: any) => (series as any).categoryId === category.id
            ) || [];

            if (categorySeriesList.length === 0) return null;

            return (
              <div key={category.id} className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">{category.titleAr}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {categorySeriesList.map((series: any) => (
                    <button
                      key={series.id}
                      onClick={() => {
                        setLocation(`/series/${series.id}`);
                        window.scrollTo(0, 0);
                      }}
                      className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:ring-2 hover:ring-primary/50 active:scale-95"
                    >
                      {/* صورة المسلسل */}
                      <div className="relative w-full bg-muted overflow-hidden rounded-lg" style={{ aspectRatio: "3 / 4" }}>
                        {series.posterUrl ? (
                          <img
                            src={series.posterUrl}
                            alt={series.titleAr}
                            className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-center text-muted-foreground text-sm px-2">
                              {series.titleAr}
                            </span>
                          </div>
                        )}

                        {/* overlay عند التمرير */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-primary/90 p-2.5 rounded-full">
                            <svg
                              className="w-5 h-5 text-white fill-white"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* معلومات المسلسل */}
                      <div className="mt-3">
                        <p className="font-semibold text-foreground text-sm line-clamp-2">{series.titleAr}</p>
                        <p className="text-xs text-muted-foreground mt-1">{series.totalSeasons || 0} موسم</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* حالة عدم وجود بيانات */}
      {(!categories || categories.length === 0) && !categoriesLoading && (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">لا توجد بيانات متاحة حالياً</p>
        </div>
      )}
    </div>
  );
}

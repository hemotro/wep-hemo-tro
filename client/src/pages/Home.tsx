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
  const [scrollY, setScrollY] = useState(0);
  const [showSmallHeader, setShowSmallHeader] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // معالج التمرير للـ Parallax و Header الذكي
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setScrollY(scrollPos);
      // إظهار Header الصغير عند التمرير 200px
      setShowSmallHeader(scrollPos > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // حساب Parallax offset
  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="flex-1 pb-20">
      {/* Header الذكي - يظهر عند التمرير */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showSmallHeader
            ? "bg-background/80 backdrop-blur-md border-b border-border/30 py-2"
            : "bg-transparent border-b border-transparent py-3"
        }`}
      >
        <div className="flex items-center justify-end px-4 md:px-6">
          <Link href="/">
            <a className="hover:opacity-80 transition-opacity">
              <img
                src="/logo-new.png"
                alt="hemo tro"
                className={`w-auto object-contain drop-shadow-lg transition-all duration-300 ${
                  showSmallHeader ? "h-8" : "h-0 opacity-0"
                }`}
              />
            </a>
          </Link>
        </div>
      </header>

      {/* Hero Section - 60vh على الهاتف، 70vh على الشاشات الكبيرة */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden bg-gradient-to-br from-primary/20 to-background">
        {currentSeries && (
          <div
            ref={carouselRef}
            className="relative w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* الصورة مع Parallax Effect */}
            {currentBanner && (
              <>
                <img
                  src={currentBanner}
                  alt={currentSeries.titleAr}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `translateY(${parallaxOffset}px)`,
                    transition: "transform 0.1s ease-out",
                  }}
                />
                {/* Gradient أسود خفيف في الأعلى */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>
              </>
            )}

            {/* Gradient أسود قوي في الأسفل */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

            {/* الشعار الصغير في الأعلى اليمين */}
            <Link href="/">
              <a className="absolute top-4 md:top-6 right-4 md:right-6 z-30 hover:opacity-80 transition-opacity">
                <img
                  src="/logo-new.png"
                  alt="hemo tro"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain drop-shadow-lg"
                />
              </a>
            </Link>

            {/* معلومات المسلسل - في الأسفل */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                  {currentSeries.titleAr}
                </h2>
                <p className="text-primary text-sm sm:text-base md:text-lg mb-4 drop-shadow-lg">
                  {currentSeries.genre}
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

            {/* مؤشرات الشرائح */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {seriesList.map((_, index) => (
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
        )}
      </div>

      {/* قائمة أفقية للمسلسلات */}
      <div className="px-4 py-6 md:py-8">
        <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">جميع المسلسلات</h3>
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

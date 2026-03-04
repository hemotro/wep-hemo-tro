/**
 * Hero Section - سلايدر متحرك احترافي
 * يعرض صور المسلسلات الجديدة بتأثيرات احترافية
 */
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Link } from "wouter";

interface HeroSlide {
  id: number;
  seriesId: number;
  imageUrl: string;
  title: string;
  titleAr: string;
}

interface HeroSectionProps {
  slides: HeroSlide[];
  isLoading?: boolean;
}

export default function HeroSection({ slides, isLoading = false }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // التشغيل التلقائي
  useEffect(() => {
    if (autoPlay && slides.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, slides.length]);

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = e.touches[0].clientX;
    setAutoPlay(false);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndRef.current = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEndRef.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (isLoading || slides.length === 0) {
    return (
      <div className="w-full h-96 md:h-screen bg-muted animate-pulse flex items-center justify-center">
        <div className="text-muted-foreground">جاري تحميل...</div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: isDesktop ? "100vh" : "60vh" }}
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* الصور */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.titleAr}
              className="w-full h-full object-cover"
            />
            {/* تدرج داكن */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* محتوى الشريحة */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {currentSlide.titleAr}
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-6 line-clamp-2">
            مسلسل جديد - شاهد الآن
          </p>
          <Link href={`/series/${currentSlide.seriesId}`}>
            <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              <Play className="w-5 h-5 fill-current" />
              شاهد الآن
            </button>
          </Link>
        </div>
      </div>

      {/* أزرار التنقل - فقط على الكمبيوتر */}
      {isDesktop && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm"
            title="السابق"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm"
            title="التالي"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* مؤشرات الشرائح */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setAutoPlay(false);
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/50 w-2 hover:bg-white/70"
            }`}
            title={`الشريحة ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

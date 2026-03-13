import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Play, Info, LogIn } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: seriesList, isLoading } = trpc.series.list.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
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
      <div className="flex-1 pb-20 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">جاري تحميل المسلسلات...</p>
        </div>
      </div>
    );
  }

  if (!seriesList || seriesList.length === 0) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🎬 مرحباً بك في hemo tro</h1>
          <p className="text-gray-300 text-lg">لا توجد مسلسلات حالياً</p>
        </div>
      </div>
    );
  }

  const currentSeries = seriesList[currentSlide];
  const currentBanner = currentSeries?.posterUrl;

  // حساب Parallax offset
  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="flex-1 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header الذكي - يظهر عند التمرير */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showSmallHeader
            ? "bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20 py-2 shadow-lg"
            : "bg-transparent border-b border-transparent py-3"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/30">
                <span className="text-2xl">{user.avatar ? "🎭" : "👤"}</span>
                <span className="text-sm text-purple-300 font-medium">{user.displayName || user.name}</span>
              </div>
            )}
          </div>
          <Link href="/">
            <a className="hover:opacity-80 transition-opacity">
              <span className={`text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent transition-all duration-300 ${
                showSmallHeader ? "text-lg" : "text-2xl"
              }`}>
                🎬 hemo tro
              </span>
            </a>
          </Link>
        </div>
      </header>

      {/* Hero Section - 60vh على الهاتف، 70vh على الشاشات الكبيرة */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900">
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
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent"></div>
              </>
            )}

            {/* Gradient قوي في الأسفل */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

            {/* الشعار الصغير في الأعلى اليمين */}
            <Link href="/">
              <a className="absolute top-4 md:top-6 right-4 md:right-6 z-30 hover:opacity-80 transition-opacity">
                <span className="text-2xl md:text-3xl font-bold">🎬</span>
              </a>
            </Link>

            {/* معلومات المسلسل - في الأسفل */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="max-w-3xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                  {currentSeries.titleAr}
                </h2>
                <p className="text-purple-300 text-sm sm:text-base md:text-lg mb-2 drop-shadow-lg font-semibold">
                  {currentSeries.genre}
                </p>
                <p className="text-gray-300 text-sm sm:text-base mb-6 line-clamp-2 drop-shadow-lg">
                  {currentSeries.descriptionAr}
                </p>
                
                {/* الأزرار */}
                <div className="flex gap-3 flex-wrap">
                  {user ? (
                    <Link href={`/series/${currentSeries.id}`}>
                      <a>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base py-3 px-8 rounded-lg font-semibold">
                          <Play className="w-5 h-5 mr-2" />
                          شاهد الآن
                        </Button>
                      </a>
                    </Link>
                  ) : (
                    <Button 
                      onClick={() => setLocation("/login")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base py-3 px-8 rounded-lg font-semibold"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      سجل الدخول لمشاهدة
                    </Button>
                  )}
                  <Link href={`/series/${currentSeries.id}`}>
                    <a>
                      <Button variant="outline" className="border-purple-500/50 text-white hover:bg-purple-500/10 text-base py-3 px-8 rounded-lg font-semibold">
                        <Info className="w-5 h-5 mr-2" />
                        معلومات
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>
            </div>

            {/* مؤشرات الشرائح */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {seriesList.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setAutoPlay(false);
                  }}
                  className={`rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 w-8 h-2"
                      : "bg-white/40 hover:bg-white/60 w-2 h-2"
                  }`}
                  aria-label={`انتقل إلى الشريحة ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* قائمة المسلسلات */}
      <div className="px-4 py-8 md:py-12">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">جميع المسلسلات</h3>
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-4 min-w-min">
            {seriesList.map((series) => (
              <div key={series.id} className="flex-shrink-0 group">
                <Link href={`/series/${series.id}`}>
                  <a className="block">
                    <div className="relative w-40 h-56 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                      {series.posterUrl ? (
                        <>
                          <img
                            src={series.posterUrl}
                            alt={series.titleAr}
                            className="w-full h-full object-cover group-hover:brightness-50 transition-all duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full">
                              <Play className="w-4 h-4 mr-1" />
                              شاهد
                            </Button>
                            <div className="text-right">
                              <p className="text-xs text-gray-300">{series.totalEpisodes} حلقة</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-purple-900/60 to-slate-900">
                          <p className="text-sm font-semibold text-white mb-2">{series.titleAr}</p>
                          <p className="text-xs text-gray-300">{series.totalEpisodes} حلقة</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mt-2 font-medium truncate">{series.titleAr}</p>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* إذا لم يكن المستخدم مسجل دخول - عرض دعوة للتسجيل */}
      {!user && (
        <div className="mx-4 mb-8 p-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl text-center">
          <h3 className="text-2xl font-bold text-white mb-3">🎉 انضم إلينا الآن</h3>
          <p className="text-gray-300 mb-6">استمتع بمشاهدة أفضل المسلسلات والأفلام بدون حدود</p>
          <Button 
            onClick={() => setLocation("/login")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg"
          >
            إنشاء حساب مجاني
          </Button>
        </div>
      )}
    </div>
  );
}

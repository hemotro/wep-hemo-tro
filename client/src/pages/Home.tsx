import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, AlertCircle, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { data: user } = trpc.auth.me.useQuery();

  // استدعاء البيانات الديناميكية
  const { data: latestSeries, isLoading: latestLoading, error: latestError } = trpc.likes.getLatest.useQuery({ limit: 6 });
  const { data: topRatedSeries, isLoading: topRatedLoading, error: topRatedError } = trpc.likes.getTopRated.useQuery({ limit: 5 });
  const { isLoading: sliderLoading, error: sliderError } = trpc.slider.list.useQuery();

  // معالجة التمرير
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // تحديد آخر 4 مسلسلات للسلايدر
  const sliderSeries = latestSeries?.slice(0, 4) || [];

  // تحديث الشريحة تلقائياً
  useEffect(() => {
    if (!autoPlay || sliderSeries.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderSeries.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, sliderSeries.length]);

  // حالة التحميل
  if (latestLoading || topRatedLoading || sliderLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
      </div>
    );
  }

  // حالة الخطأ
  if (latestError || topRatedError || sliderError) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">حدث خطأ في تحميل البيانات</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            إعادة محاولة
          </Button>
        </div>
      </div>
    );
  }

  const currentSeries = sliderSeries[currentSlide];
  const currentBanner = currentSeries?.bannerUrl || currentSeries?.posterUrl;

  // حساب Parallax offset
  const parallaxOffset = scrollY * 0.5;

  // معالج Swipe
  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sliderSeries.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % sliderSeries.length);
    } else if (isRightSwipe && sliderSeries.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + sliderSeries.length) % sliderSeries.length);
    }
  };

  return (
    <div className="flex-1 pb-20">
      {/* زر Admin Panel - للمسؤولين فقط */}
      {user?.role === "admin" && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={() => setLocation("/admin-panel")}
            className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            title="لوحة الإدارة"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* السلايدر الرئيسي - تصميم جديد يناسب الهاتف */}
      {sliderSeries && sliderSeries.length > 0 && currentSeries ? (
        <div className="relative w-full overflow-hidden">
          {/* السلايدر - مناسب للموبايل والويب */}
          <div 
            className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchEnd={(e) => {
              setTouchEnd(e.changedTouches[0].clientX);
              handleSwipe();
            }}
          >
            {/* الخلفية مع Parallax */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{
                backgroundImage: `url('${currentBanner}')`,
                backgroundPosition: `center ${parallaxOffset}px`,
                filter: "brightness(0.3)",
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* المحتوى - في الأسفل */}
            <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-6 md:px-10 lg:px-16 pb-6 sm:pb-8 md:pb-10">
              <div className="flex flex-col gap-4">
                {/* اللوقو */}
                {currentSeries.logoUrl && (
                  <div className="flex items-center">
                    <img
                      src={currentSeries.logoUrl}
                      alt="Logo"
                      className="h-12 sm:h-16 md:h-20 object-contain"
                    />
                  </div>
                )}

                {/* التصنيف */}
                <div className="flex gap-2 flex-wrap">
                  {currentSeries.genre && (
                    <span className="inline-block px-3 py-1 bg-primary/80 text-primary-foreground text-xs sm:text-sm rounded-full">
                      {currentSeries.genre}
                    </span>
                  )}
                </div>

                {/* العنوان */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg line-clamp-2">
                  {currentSeries.titleAr}
                </h2>

                {/* الوصف */}
                {currentSeries.descriptionAr && (
                  <p className="text-xs sm:text-sm md:text-base text-white/80 line-clamp-2 max-w-2xl">
                    {currentSeries.descriptionAr}
                  </p>
                )}

                {/* زر شاهد الآن */}
                <div className="flex gap-3 pt-2">
                  <Link href={`/series/${currentSeries.id}`}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8 rounded-lg flex items-center gap-2">
                      <Play className="w-4 sm:w-5 h-4 sm:h-5" />
                      شاهد الآن
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* مؤشرات الشرائح فقط */}
            {sliderSeries.length > 1 && (
              <div className="absolute bottom-24 sm:bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {sliderSeries.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? "bg-primary w-6 sm:w-8" : "bg-white/50"
                    }`}
                    aria-label={`اذهب إلى الشريحة ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* القسم الثاني: المسلسلات الجديدة - عمودي */}
      {latestSeries && latestSeries.length > 0 && (
        <section className="px-3 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 bg-background">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">المسلسلات الجديدة</h3>
          {/* عرض عمودي - grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {latestSeries.map((series: any) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <div className="group cursor-pointer">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-0">
                      {/* صورة المسلسل - طولي */}
                      <div className="relative overflow-hidden bg-muted aspect-[2/3] w-full">
                        <img
                          src={series.posterUrl}
                          alt={series.titleAr}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* overlay عند التمرير */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                      </div>
                      {/* معلومات المسلسل */}
                      <div className="p-2 bg-card">
                        <h4 className="font-semibold text-xs sm:text-sm text-card-foreground truncate">
                          {series.titleAr}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* القسم الثالث: المسلسلات الأفضل تقييماً - عمودي */}
      {topRatedSeries && topRatedSeries.length > 0 && (
        <section className="px-3 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 bg-muted/50">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">الأفضل تقييماً</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {topRatedSeries.map((series: any) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <div className="group cursor-pointer">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden bg-muted aspect-[2/3] w-full">
                        <img
                          src={series.posterUrl}
                          alt={series.titleAr}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                      </div>
                      <div className="p-2 bg-card">
                        <h4 className="font-semibold text-xs sm:text-sm text-card-foreground truncate">
                          {series.titleAr}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

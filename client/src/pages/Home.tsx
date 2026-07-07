import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ChevronLeft, ChevronRight, Heart, AlertCircle, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [scrollY, setScrollY] = useState(0);
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
          <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] overflow-hidden">
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

            {/* أزرار التنقل */}
            {sliderSeries.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderSeries.length) % sliderSeries.length)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 text-white p-1.5 sm:p-2 rounded-full transition-all"
                  aria-label="الشريحة السابقة"
                >
                  <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderSeries.length)}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 text-white p-1.5 sm:p-2 rounded-full transition-all"
                  aria-label="الشريحة التالية"
                >
                  <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6" />
                </button>

                {/* مؤشرات الشرائح */}
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
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* القسم الثاني: المسلسلات الجديدة - آخر 6 مسلسلات */}
      {latestSeries && latestSeries.length > 0 && (
        <section className="px-3 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 bg-background">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">المسلسلات الجديدة</h3>
          {/* عرض أفقي - scroll horizontal */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 sm:gap-3 md:gap-4 pb-2">
              {latestSeries.map((series: any) => (
                <Link key={series.id} href={`/series/${series.id}`}>
                  <div className="group cursor-pointer flex-shrink-0">
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                      <CardContent className="p-0">
                        {/* صورة المسلسل - حجم صغير */}
                        <div className="relative overflow-hidden bg-muted aspect-[2/3] w-24 sm:w-28 md:w-32 lg:w-36">
                          <img
                            src={series.posterUrl}
                            alt={series.titleAr}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* overlay عند التمرير */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                        {/* معلومات المسلسل */}
                        <div className="p-2 bg-card hidden sm:block">
                          <h4 className="font-semibold text-xs text-card-foreground truncate">
                            {series.titleAr}
                          </h4>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* القسم الثالث: المسلسلات الأفضل تقييماً */}
      {topRatedSeries && topRatedSeries.length > 0 && (
        <section className="px-3 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 bg-muted/50">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">الأفضل تقييماً</h3>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 sm:gap-3 md:gap-4 pb-2">
              {topRatedSeries.map((series: any) => (
                <Link key={series.id} href={`/series/${series.id}`}>
                  <div className="group cursor-pointer flex-shrink-0">
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden bg-muted aspect-[2/3] w-24 sm:w-28 md:w-32 lg:w-36">
                          <img
                            src={series.posterUrl}
                            alt={series.titleAr}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                        <div className="p-2 bg-card hidden sm:block">
                          <h4 className="font-semibold text-xs text-card-foreground truncate">
                            {series.titleAr}
                          </h4>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

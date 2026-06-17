import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // استدعاء البيانات الديناميكية
  const { data: latestSeries, isLoading: latestLoading } = trpc.likes.getLatest.useQuery({ limit: 6 });
  const { data: topRatedSeries, isLoading: topRatedLoading } = trpc.likes.getTopRated.useQuery({ limit: 5 });
  const { data: sliderData, isLoading: sliderLoading } = trpc.slider.list.useQuery();
  const { data: seriesList, isLoading: seriesLoading } = trpc.series.list.useQuery();

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

  if (latestLoading || topRatedLoading || sliderLoading || seriesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const currentSeries = sliderSeries[currentSlide];
  const currentBanner = currentSeries?.posterUrl;

  // حساب Parallax offset
  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="flex-1 pb-20">
      {/* السلايدر الرئيسي - آخر 4 مسلسلات */}
      {sliderSeries && sliderSeries.length > 0 && currentSeries ? (
        <div className="relative w-full overflow-hidden">
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
            {sliderSeries.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderSeries.length) % sliderSeries.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderSeries.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* مؤشرات الشرائح */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                  {sliderSeries.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide ? "bg-primary w-8" : "bg-white/50"
                      }`}
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
        <section className="px-4 sm:px-8 md:px-12 py-12 bg-background">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">المسلسلات الجديدة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {latestSeries.map((series: any) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <a>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <img
                        src={series.posterUrl}
                        alt={series.titleAr}
                        className="w-full h-64 object-cover"
                      />
                      <div className="p-3 bg-card">
                        <h4 className="font-semibold text-sm text-card-foreground truncate">
                          {series.titleAr}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* القسم الثالث: الأعلى تقييماً - أفضل 5 مسلسلات */}
      {topRatedSeries && topRatedSeries.length > 0 && (
        <section className="px-4 sm:px-8 md:px-12 py-12 bg-muted/30">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">الأعلى تقييماً</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topRatedSeries.map((series: any) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <a>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <img
                        src={series.posterUrl}
                        alt={series.titleAr}
                        className="w-full h-64 object-cover"
                      />
                      <div className="p-3 bg-card">
                        <h4 className="font-semibold text-sm text-card-foreground truncate">
                          {series.titleAr}
                        </h4>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          <span>محبوب</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* رسالة عندما لا توجد بيانات */}
      {(!latestSeries || latestSeries.length === 0) && (
        <div className="flex-1 pb-20 flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-lg">لا توجد مسلسلات متاحة حالياً</p>
        </div>
      )}
    </div>
  );
}

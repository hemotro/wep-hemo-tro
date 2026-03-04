import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: seriesList, isLoading: seriesLoading } = trpc.series.list.useQuery();
  const { data: heroSlides, isLoading: slidesLoading } = trpc.heroSlides.list.useQuery();
  const { data: announcements } = trpc.announcements.list.useQuery();
  const [newSeries, setNewSeries] = useState<typeof seriesList>([]);

  // الحصول على أحدث 5 مسلسلات
  useEffect(() => {
    if (seriesList) {
      const sorted = [...seriesList].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setNewSeries(sorted.slice(0, 5));
    }
  }, [seriesList]);

  if (seriesLoading || slidesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل...</p>
        </div>
      </div>
    );
  }

  // تحويل بيانات السلايدات للـ HeroSection
  const heroSlidesData = (heroSlides || []).map((slide: any) => ({
    id: slide.id,
    seriesId: slide.seriesId,
    imageUrl: slide.imageUrl,
    title: slide.title,
    titleAr: slide.titleAr,
  }));

  return (
    <div className="flex-1 pb-20">
      {/* التنويهات */}
      {announcements && announcements.length > 0 && (
        <div className="px-4 pt-4 space-y-2">
          {announcements.map((announcement: any) => (
            <div
              key={announcement.id}
              className={`p-4 rounded-lg border-l-4 ${
                announcement.type === "warning"
                  ? "bg-yellow-500/10 border-yellow-500 text-yellow-700"
                  : announcement.type === "error"
                  ? "bg-red-500/10 border-red-500 text-red-700"
                  : announcement.type === "success"
                  ? "bg-green-500/10 border-green-500 text-green-700"
                  : "bg-blue-500/10 border-blue-500 text-blue-700"
              }`}
            >
              <h4 className="font-semibold">{announcement.titleAr}</h4>
              <p className="text-sm mt-1">{announcement.contentAr}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hero Section */}
      {heroSlidesData.length > 0 ? (
        <HeroSection slides={heroSlidesData} isLoading={slidesLoading} />
      ) : null}

      {/* قسم الجديد */}
      {newSeries && newSeries.length > 0 && (
        <div className="px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">الجديد</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {newSeries.map((series: any) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <a className="group">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    {series.posterUrl ? (
                      <>
                        <img
                          src={series.posterUrl}
                          alt={series.titleAr}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center px-2">
                          {series.titleAr}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground truncate">
                    {series.titleAr}
                  </p>
                  <p className="text-xs text-muted-foreground">{series.genre}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* قائمة جميع المسلسلات */}
      {seriesList && seriesList.length > 0 && (
        <div className="px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">جميع المسلسلات</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {seriesList.map((series: any) => (
              <Link key={series.id} href={`/series/${series.id}`}>
                <a className="group">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    {series.posterUrl ? (
                      <>
                        <img
                          src={series.posterUrl}
                          alt={series.titleAr}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center px-2">
                          {series.titleAr}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground truncate">
                    {series.titleAr}
                  </p>
                  <p className="text-xs text-muted-foreground">{series.genre}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!seriesList || seriesList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">مرحباً بك في hemo tro</h1>
            <p className="text-muted-foreground">لا توجد مسلسلات حالياً</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

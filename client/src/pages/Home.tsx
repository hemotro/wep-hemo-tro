import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Play } from "lucide-react";

export default function Home() {
  const { data: seriesList, isLoading } = trpc.series.list.useQuery();

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

  const getBannerUrl = (titleAr: string) => {
    if (titleAr === "تخاريف") return "/takhareef-banner.jpg";
    return null;
  };

  return (
    <div className="flex-1 pb-20">
      <div className="px-0 py-0">
        <h1 className="text-3xl font-bold text-foreground px-4 py-6">المسلسلات</h1>
        
        <div className="space-y-4">
          {seriesList.map((series) => {
            const bannerUrl = getBannerUrl(series.titleAr);
            
            return (
              <Link key={series.id} href={`/series/${series.id}`}>
                <a className="block">
                  {bannerUrl ? (
                    <div className="relative group cursor-pointer overflow-hidden">
                      <img
                        src={bannerUrl}
                        alt={series.titleAr}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                        <div className="text-center">
                          <Play className="w-16 h-16 text-white mx-auto mb-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="text-white text-lg font-bold">{series.titleAr}</p>
                          <p className="text-white/80 text-sm">{series.genre}</p>
                          <p className="text-white/70 text-xs mt-2">{series.totalEpisodes} حلقة</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-primary/20 to-background p-6 mx-4 rounded-lg border border-border hover:border-primary transition-colors">
                      <h2 className="text-2xl font-bold text-foreground mb-2">{series.titleAr}</h2>
                      <p className="text-muted-foreground mb-3">{series.genre}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {series.totalEpisodes} حلقة
                        </span>
                        <span className="text-sm text-muted-foreground">
                          الموسم {series.currentSeason}
                        </span>
                      </div>
                    </div>
                  )}
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

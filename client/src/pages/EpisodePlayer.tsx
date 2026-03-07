import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";

export default function EpisodePlayer() {
  const { seriesId, episodeNumber } = useParams<{ seriesId: string; episodeNumber: string }>();
  const [, setLocation] = useLocation();
  
  const series_id = parseInt(seriesId || "0");
  const episode_num = parseInt(episodeNumber || "1");

  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery({ id: series_id });
  const { data: episodes, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery({ seriesId: series_id });

  const currentEpisode = episodes?.find(ep => ep.episodeNumber === episode_num);
  const currentIndex = episodes?.findIndex(ep => ep.episodeNumber === episode_num) ?? -1;
  const nextEpisode = currentIndex >= 0 && currentIndex < (episodes?.length ?? 0) - 1 ? episodes?.[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? episodes?.[currentIndex - 1] : null;

  const handleNextEpisode = () => {
    if (nextEpisode) {
      setLocation(`/episode/${series_id}/${nextEpisode.episodeNumber}`);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevEpisode = () => {
    if (prevEpisode) {
      setLocation(`/episode/${series_id}/${prevEpisode.episodeNumber}`);
      window.scrollTo(0, 0);
    }
  };

  if (seriesLoading || episodesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!series || !currentEpisode) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">الحلقة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* المشغل بملء الشاشة */}
      <div className="w-full bg-black">
        <div className="aspect-video">
          <VideoPlayer
            videoUrl={currentEpisode.videoUrl}
            title={`${series.titleAr} - الحلقة ${currentEpisode.episodeNumber}: ${currentEpisode.titleAr}`}
            episodeNumber={`${currentEpisode.episodeNumber}`}
            isLive={false}
          />
        </div>
      </div>

      {/* معلومات الحلقة */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* عنوان المسلسل والحلقة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{series.titleAr}</h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">{series.genre}</span>
            <span className="text-sm text-primary font-semibold">الحلقة {currentEpisode.episodeNumber}</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-4">{currentEpisode.titleAr}</h2>
        </div>

        {/* الوصف */}
        {series.descriptionAr && (
          <div className="mb-8 pb-8 border-b border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{series.descriptionAr}</p>
          </div>
        )}

        {/* أزرار التنقل */}
        <div className="flex gap-3 mb-12">
          <Button
            onClick={handlePrevEpisode}
            disabled={!prevEpisode}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 h-12"
          >
            <ChevronRight className="w-4 h-4" />
            الحلقة السابقة
          </Button>
          
          <Button
            onClick={() => {
              setLocation(`/series/${series_id}`);
              window.scrollTo(0, 0);
            }}
            variant="outline"
            className="flex-1 h-12"
          >
            العودة للمسلسل
          </Button>

          <Button
            onClick={handleNextEpisode}
            disabled={!nextEpisode}
            className="flex-1 flex items-center justify-center gap-2 h-12"
          >
            الحلقة التالية
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* قائمة الحلقات */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-6">جميع الحلقات</h3>
          
          {episodesLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
            </div>
          ) : episodes && episodes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {episodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => {
                    setLocation(`/episode/${series_id}/${episode.episodeNumber}`);
                    window.scrollTo(0, 0);
                  }}
                  className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                    currentEpisode.id === episode.id
                      ? "ring-2 ring-primary"
                      : "hover:ring-2 hover:ring-primary/50"
                  }`}
                >
                  {/* صورة الحلقة */}
                  <div className="relative w-full bg-muted overflow-hidden rounded-lg" style={{ aspectRatio: '3 / 2' }}>
                    {episode.thumbnailUrl ? (
                      <img
                        src={episode.thumbnailUrl}
                        alt={`الحلقة ${episode.episodeNumber}`}
                        className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {episode.episodeNumber}
                        </span>
                      </div>
                    )}
                    
                    {/* overlay عند التمرير */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-primary/90 p-2.5 rounded-full">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>

                    {/* شارة الحلقة الحالية */}
                    {currentEpisode.id === episode.id && (
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded">
                        الحالية
                      </div>
                    )}
                  </div>

                  {/* معلومات الحلقة */}
                  <div className="mt-3">
                    <p className="font-semibold text-foreground text-sm">الحلقة {episode.episodeNumber}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{episode.titleAr}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">لا توجد حلقات</p>
          )}
        </div>
      </div>
    </div>
  );
}

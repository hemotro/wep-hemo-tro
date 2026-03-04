import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";

export default function EpisodePlayer() {
  const { seriesId, episodeNumber } = useParams<{ seriesId: string; episodeNumber: string }>();
  const [, setLocation] = useLocation();
  
  const series_id = parseInt(seriesId || "0");
  const episode_num = parseInt(episodeNumber || "1");

  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery({ id: series_id });
  const { data: episodes, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery({ seriesId: series_id });
  const { data: images = [] } = trpc.seriesImages.getAll.useQuery({ seriesId: series_id });

  const currentEpisode = episodes?.find(ep => ep.episodeNumber === episode_num);
  const currentIndex = episodes?.findIndex(ep => ep.episodeNumber === episode_num) ?? -1;
  const nextEpisode = currentIndex >= 0 && currentIndex < (episodes?.length ?? 0) - 1 ? episodes?.[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? episodes?.[currentIndex - 1] : null;

  const handleNextEpisode = () => {
    if (nextEpisode) {
      setLocation(`/episode/${series_id}/${nextEpisode.episodeNumber}`);
    }
  };

  const handlePrevEpisode = () => {
    if (prevEpisode) {
      setLocation(`/episode/${series_id}/${prevEpisode.episodeNumber}`);
    }
  };

  if (seriesLoading || episodesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!series || !currentEpisode) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">الحلقة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* المشغل الكامل */}
      <div className="w-full bg-black">
        <VideoPlayer
          src={currentEpisode.videoUrl}
          title={`${series.titleAr} - الحلقة ${currentEpisode.episodeNumber}: ${currentEpisode.titleAr}`}
          poster={currentEpisode.thumbnailUrl || undefined}
        />
      </div>

      {/* معلومات الحلقة */}
      <div className="px-4 py-6 border-b border-border">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">{series.titleAr}</h1>
          <p className="text-primary text-sm mb-2">{series.genre}</p>
          <div>
            <p className="text-foreground font-semibold">الحلقة {currentEpisode.episodeNumber}</p>
            <p className="text-muted-foreground text-sm">{currentEpisode.titleAr}</p>
          </div>
        </div>

        {/* الوصف */}
        {series.descriptionAr && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{series.descriptionAr}</p>
          </div>
        )}
      </div>

      {/* أزرار التنقل بين الحلقات */}
      <div className="px-4 py-6 flex gap-3">
        <Button
          onClick={handlePrevEpisode}
          disabled={!prevEpisode}
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          الحلقة السابقة
        </Button>
        
        <Button
          onClick={() => setLocation(`/series/${series_id}`)}
          variant="outline"
          className="flex-1"
        >
          العودة للمسلسل
        </Button>

        <Button
          onClick={handleNextEpisode}
          disabled={!nextEpisode}
          className="flex-1 flex items-center justify-center gap-2"
        >
          الحلقة التالية
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* قائمة الحلقات */}
      <div className="px-4 py-6 border-t border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">جميع الحلقات</h2>
        {episodesLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className="space-y-2">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => setLocation(`/episode/${series_id}/${episode.episodeNumber}`)}
                className={`w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${
                  currentEpisode.id === episode.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* صورة مصغرة */}
                {episode.thumbnailUrl ? (
                  <img
                    src={episode.thumbnailUrl}
                    alt={`الحلقة ${episode.episodeNumber}`}
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {episode.episodeNumber}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">الحلقة {episode.episodeNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">{episode.titleAr}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">لا توجد حلقات</p>
        )}
      </div>
    </div>
  );
}

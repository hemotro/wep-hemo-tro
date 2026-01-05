import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Play } from "lucide-react";

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const seriesId = parseInt(id || "0");
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery({ id: seriesId });
  const { data: episodes, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery({ seriesId });

  if (seriesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">المسلسل غير موجود</p>
      </div>
    );
  }

  const currentEpisode = episodes?.find(ep => ep.episodeNumber === selectedEpisode);
  const bannerUrl = series.titleAr === "تخاريف" ? "/takhareef-banner.jpg" : null;

  // استخراج معرف الفيديو من رابط يوتيوب
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  return (
    <div className="flex-1 pb-20">
      {/* البانر */}
      {bannerUrl && (
        <div className="relative w-full h-64 overflow-hidden">
          <img
            src={bannerUrl}
            alt={series.titleAr}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
      )}

      {/* مشغل الفيديو الحالي */}
      {currentEpisode && (
        <div className="w-full aspect-video bg-black">
          <iframe
            width="100%"
            height="100%"
            src={getYoutubeEmbedUrl(currentEpisode.videoUrl)}
            title={`${series.titleAr} - الحلقة ${currentEpisode.episodeNumber}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      )}

      {/* معلومات المسلسل والحلقة */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">{series.titleAr}</h1>
        <p className="text-primary text-sm mb-2">{series.genre}</p>
        {currentEpisode && (
          <div>
            <p className="text-foreground font-semibold">الحلقة {currentEpisode.episodeNumber}</p>
            <p className="text-muted-foreground text-sm">من {series.totalEpisodes} حلقة</p>
          </div>
        )}
      </div>

      {/* قائمة الحلقات */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">الحلقات</h2>

        <div className="space-y-2">
          {episodes && episodes.length > 0 ? (
            episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => setSelectedEpisode(episode.episodeNumber)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-right flex items-center gap-3 ${
                  selectedEpisode === episode.episodeNumber
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50 hover:border-primary/50"
                }`}
              >
                {/* رقم الحلقة */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-foreground text-sm">{episode.episodeNumber}</span>
                </div>

                {/* معلومات الحلقة */}
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">الحلقة {episode.episodeNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {episode.title || `الحلقة ${episode.episodeNumber}`}
                  </p>
                </div>

                {/* أيقونة التشغيل */}
                {selectedEpisode === episode.episodeNumber && (
                  <Play className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                )}
              </button>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد حلقات متاحة</p>
          )}
        </div>
      </div>
    </div>
  );
}

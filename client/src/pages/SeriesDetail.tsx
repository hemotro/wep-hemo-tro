import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Play, ChevronDown } from "lucide-react";

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
      {/* البانر والفيديو */}
      <div className="relative w-full bg-background">
        {/* الصورة البانر */}
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

        {/* مشغل الفيديو */}
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

        {/* معلومات المسلسل والحلقة الحالية */}
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">{series.titleAr}</h1>
          <p className="text-primary text-sm mb-3">{series.genre}</p>
          {currentEpisode && (
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground font-semibold mb-1">الحلقة {currentEpisode.episodeNumber}</p>
              <p className="text-muted-foreground text-sm">{series.totalEpisodes} حلقة</p>
            </div>
          )}
        </div>
      </div>

      {/* قائمة الحلقات */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
          <ChevronDown className="w-5 h-5 mr-2" />
          الحلقات
        </h2>

        <div className="space-y-3">
          {episodes && episodes.length > 0 ? (
            episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => setSelectedEpisode(episode.episodeNumber)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
                  selectedEpisode === episode.episodeNumber
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">الحلقة {episode.episodeNumber}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {episode.title || `الحلقة ${episode.episodeNumber}`}
                    </p>
                  </div>
                  {selectedEpisode === episode.episodeNumber && (
                    <Play className="w-5 h-5 text-primary ml-3 flex-shrink-0" />
                  )}
                </div>
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

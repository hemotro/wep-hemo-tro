import { useParams as useWouterParams, useLocation as useWouterLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

// دالة لاستخراج معرف YouTube من الرابط
function extractYoutubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}

export default function EpisodeDetail() {
  const { seriesId, episodeNumber } = useWouterParams<{ seriesId: string; episodeNumber: string }>();
  const [, setLocation] = useWouterLocation();
  const [selectedQuality, setSelectedQuality] = useState<"1080p" | "720p" | "480p">("720p");

  const series_id = parseInt(seriesId || "0");
  const episode_num = parseInt(episodeNumber || "0");

  const { data: series } = trpc.series.getById.useQuery({ id: series_id });
  const { data: episodes } = trpc.series.getEpisodes.useQuery({ seriesId: series_id });

  // البحث عن الحلقة الحالية
  const episode = useMemo(() => {
    return episodes?.find((ep: any) => ep.episodeNumber === episode_num);
  }, [episodes, episode_num]);

  if (!episode) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">الحلقة غير موجودة</p>
          <Button onClick={() => setLocation(`/series/${series_id}`)}>
            العودة إلى المسلسل
          </Button>
        </div>
      </div>
    );
  }

  // اختيار رابط الفيديو حسب الجودة المختارة
  let videoUrl: string | null = episode.videoUrl || null;
  const availableQualities: ("1080p" | "720p" | "480p")[] = [];

  if (episode.video1080pUrl) {
    availableQualities.push("1080p");
    if (selectedQuality === "1080p") videoUrl = episode.video1080pUrl;
  }
  if (episode.video720pUrl) {
    availableQualities.push("720p");
    if (selectedQuality === "720p") videoUrl = episode.video720pUrl;
  }
  if (episode.video480pUrl) {
    availableQualities.push("480p");
    if (selectedQuality === "480p") videoUrl = episode.video480pUrl;
  }

  // إذا لم تكن الجودة المختارة متاحة، استخدم أول جودة متاحة
  if (!videoUrl && availableQualities.length > 0) {
    const fallbackQuality = availableQualities[0];
    setSelectedQuality(fallbackQuality);
    if (fallbackQuality === "1080p" && episode.video1080pUrl) videoUrl = episode.video1080pUrl;
    else if (fallbackQuality === "720p" && episode.video720pUrl) videoUrl = episode.video720pUrl;
    else if (fallbackQuality === "480p" && episode.video480pUrl) videoUrl = episode.video480pUrl;
  }

  const currentIndex = episodes?.findIndex((e: any) => e.episodeNumber === episode_num) ?? -1;
  const previousEpisode = currentIndex > 0 ? episodes?.[currentIndex - 1] : null;
  const nextEpisode = currentIndex < (episodes?.length ?? 0) - 1 ? episodes?.[currentIndex + 1] : null;

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* مشغل الفيديو */}
      <div className="w-full bg-black">
        <div className="w-full max-w-6xl mx-auto px-4 py-4">
          {videoUrl ? (
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
              {episode.videoType === "youtube" ? (
                <iframe
                  key={videoUrl}
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  key={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  src={videoUrl}
                />
              )}
            </div>
          ) : (
            <div className="relative w-full bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16 / 9" }}>
              <p className="text-white text-lg">لا يوجد فيديو متاح</p>
            </div>
          )}

          {/* خيارات الجودة */}
          {availableQualities.length > 1 && (
            <div className="mt-4 flex gap-2">
              <span className="text-sm text-muted-foreground self-center">الجودة:</span>
              {availableQualities.map((quality) => (
                <Button
                  key={quality}
                  variant={selectedQuality === quality ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedQuality(quality)}
                >
                  {quality}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* معلومات الحلقة */}
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {series?.titleAr} - الحلقة {episode.episodeNumber}
          </h1>
          <p className="text-lg font-semibold text-primary mb-4">{episode.titleAr}</p>
          {episode.descriptionAr && (
            <p className="text-muted-foreground leading-relaxed">{episode.descriptionAr}</p>
          )}
        </div>

        {/* أزرار التنقل */}
        <div className="flex gap-4 mb-8">
          {previousEpisode && (
            <Button
              variant="outline"
              onClick={() => {
                setLocation(`/episode/${series_id}/${previousEpisode.episodeNumber}`);
                window.scrollTo(0, 0);
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              الحلقة السابقة
            </Button>
          )}
          {nextEpisode && (
            <Button
              onClick={() => {
                setLocation(`/episode/${series_id}/${nextEpisode.episodeNumber}`);
                window.scrollTo(0, 0);
              }}
            >
              الحلقة التالية
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation(`/series/${series_id}`)}
            className="mr-auto"
          >
            العودة إلى المسلسل
          </Button>
        </div>

        {/* قائمة الحلقات الأخرى */}
        {episodes && episodes.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>الحلقات الأخرى</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setLocation(`/episode/${series_id}/${ep.episodeNumber}`);
                      window.scrollTo(0, 0);
                    }}
                    className={`p-3 rounded-lg transition-all ${
                      ep.episodeNumber === episode_num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <p className="font-semibold text-sm">الحلقة {ep.episodeNumber}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex-1 pb-20">
      <div className="px-4 py-6 space-y-6">
        {/* رأس المسلسل */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-gradient-to-b from-primary/20 to-background p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">{series.titleAr}</h1>
            <p className="text-muted-foreground mb-4">{series.genre}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-foreground">الموسم: {series.currentSeason}</span>
              <span className="text-foreground">الحلقات: {series.totalEpisodes}</span>
            </div>
          </div>
        </Card>

        {/* مشغل الفيديو */}
        {currentEpisode && (
          <Card className="bg-card border-border overflow-hidden">
            <div className="aspect-video bg-background">
              <iframe
                width="100%"
                height="100%"
                src={currentEpisode.videoUrl}
                title={currentEpisode.titleAr}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <CardHeader>
              <CardTitle className="text-foreground">{currentEpisode.titleAr}</CardTitle>
              <CardDescription className="text-muted-foreground">
                الحلقة {currentEpisode.episodeNumber} - الموسم {currentEpisode.season}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* قائمة الحلقات */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">الحلقات</h2>
          <div className="grid grid-cols-2 gap-3">
            {episodesLoading ? (
              <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
            ) : (
              episodes?.map((ep) => (
                <Button
                  key={ep.id}
                  onClick={() => setSelectedEpisode(ep.episodeNumber)}
                  variant={selectedEpisode === ep.episodeNumber ? "default" : "outline"}
                  className={`flex items-center gap-2 ${
                    selectedEpisode === ep.episodeNumber
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-background"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>الحلقة {ep.episodeNumber}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

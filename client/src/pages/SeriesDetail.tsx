import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Play, ChevronDown } from "lucide-react";

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const seriesId = parseInt(id || "0");
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [expandEpisodes, setExpandEpisodes] = useState(false);

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

  return (
    <div className="flex-1 pb-20">
      {/* البانر */}
      {bannerUrl && (
        <div className="relative w-full h-80 overflow-hidden">
          <img
            src={bannerUrl}
            alt={series.titleAr}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-4xl font-bold text-foreground mb-2">{series.titleAr}</h1>
            <p className="text-primary text-lg font-semibold">{series.genre}</p>
          </div>
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {/* معلومات المسلسل */}
        {!bannerUrl && (
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
        )}

        {/* معلومات إضافية */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">الموسم</p>
            <p className="text-xl font-bold text-foreground">{series.currentSeason}</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">عدد الحلقات</p>
            <p className="text-xl font-bold text-foreground">{series.totalEpisodes}</p>
          </Card>
        </div>

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
          <button
            onClick={() => setExpandEpisodes(!expandEpisodes)}
            className="w-full flex items-center justify-between bg-card border border-border rounded-lg p-4 mb-4 hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-bold text-foreground">الحلقات</h2>
            <ChevronDown
              className={`w-5 h-5 text-primary transition-transform ${
                expandEpisodes ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandEpisodes && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {episodesLoading ? (
                <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
              ) : (
                episodes?.map((ep) => (
                  <Button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep.episodeNumber);
                      setExpandEpisodes(false);
                    }}
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
          )}

          {/* عرض الحلقة الحالية المختارة */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">الحلقة المختارة</p>
            <p className="text-lg font-semibold text-foreground">
              الحلقة {selectedEpisode}: {currentEpisode?.titleAr}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

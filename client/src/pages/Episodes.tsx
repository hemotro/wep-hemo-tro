import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import VideoPlayer from "@/components/VideoPlayer";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface Episode {
  id: number;
  seriesId: number;
  season: number;
  episodeNumber: number;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  videoUrl: string;
  videoType: "youtube" | "m3u8" | "mp4" | "telegram" | null;
  createdAt: Date;
}

interface Series {
  id: number;
  title?: string;
  titleAr: string;
}

export default function Episodes() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [series, setSeries] = useState<Series[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // جلب المسلسلات
  const { data: seriesData, isLoading: seriesLoading } = trpc.series.list.useQuery();

  useEffect(() => {
    if (seriesData) {
      setSeries(seriesData);
      if (seriesData.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(seriesData[0].id);
      }
      setLoadingSeries(false);
    }
  }, [seriesData, selectedSeriesId]);

  // جلب الحلقات عند تغيير المسلسل
  const { data: episodesData, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery(
    { seriesId: selectedSeriesId || 0 },
    { enabled: !!selectedSeriesId }
  );

  useEffect(() => {
    if (episodesData) {
      setEpisodes(episodesData);
      if (episodesData.length > 0) {
        setSelectedEpisode(episodesData[0]);
      }
      setLoadingEpisodes(false);
    }
  }, [episodesData]);

  // تصفية الحلقات حسب الموسم والبحث
  useEffect(() => {
    let filtered = episodes.filter((ep) => ep.season === selectedSeason);

    if (searchQuery) {
      filtered = filtered.filter(
        (ep) =>
          ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.titleAr.includes(searchQuery)
      );
    }

    setFilteredEpisodes(filtered);
  }, [episodes, selectedSeason, searchQuery]);

  const seasons = Array.from(
    new Set(episodes.map((ep) => ep.season))
  ).sort((a, b) => a - b);

  const currentSeries = series.find((s) => s.id === selectedSeriesId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* عنوان الصفحة */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎬 الحلقات</h1>
          <p className="text-muted-foreground">اختر مسلسلك المفضل واستمتع بمشاهدة الحلقات</p>
        </div>

        {/* اختيار المسلسل */}
        {seriesLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">اختر المسلسل</label>
            <select
              value={selectedSeriesId || ""}
              onChange={(e) => setSelectedSeriesId(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg bg-background text-foreground"
            >
              <option value="">-- اختر مسلسل --</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titleAr} {s.title ? `(${s.title})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedSeriesId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* قائمة الحلقات */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-4 sticky top-4">
                {/* البحث */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن حلقة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* اختيار الموسم */}
                {seasons.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">الموسم</label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                    >
                      {seasons.map((season) => (
                        <option key={season} value={season}>
                          الموسم {season}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* قائمة الحلقات */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {episodesLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : filteredEpisodes.length > 0 ? (
                    filteredEpisodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => setSelectedEpisode(episode)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedEpisode?.id === episode.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          الحلقة {episode.episodeNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {episode.titleAr}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      لا توجد حلقات
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* مشغل الفيديو وتفاصيل الحلقة */}
            <div className="lg:col-span-2">
              {selectedEpisode ? (
                <div className="space-y-4">
                  {/* مشغل الفيديو */}
                  <VideoPlayer
                    videoUrl={selectedEpisode.videoUrl}
                    videoType={(selectedEpisode.videoType as any) || "mp4"}
                    title={selectedEpisode.titleAr}
                    episodeNumber={selectedEpisode.episodeNumber.toString()}
                  />

                  {/* تفاصيل الحلقة */}
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedEpisode.titleAr}
                    </h2>
                    {selectedEpisode.title && (
                      <p className="text-muted-foreground mb-4">
                        {selectedEpisode.title}
                      </p>
                    )}

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        الموسم {selectedEpisode.season} • الحلقة{" "}
                        {selectedEpisode.episodeNumber}
                      </p>
                    </div>

                    {selectedEpisode.descriptionAr && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">الوصف</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedEpisode.descriptionAr}
                        </p>
                      </div>
                    )}

                    {selectedEpisode.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedEpisode.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border p-8 text-center">
                  <p className="text-muted-foreground">اختر حلقة لعرض تفاصيلها</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

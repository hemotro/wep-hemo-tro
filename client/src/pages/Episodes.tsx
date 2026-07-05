'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import VideoPlayer from '@/components/VideoPlayer';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Play } from 'lucide-react';

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
  videoType: 'youtube' | 'm3u8' | 'mp4' | 'telegram' | null;
  createdAt: Date;
}

interface Series {
  id: number;
  title?: string;
  titleAr: string;
  genre?: string | null;
  descriptionAr?: string | null;
}

export default function Episodes() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-primary/20 py-8 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            🎬 الحلقات
          </h1>
          <p className="text-muted-foreground text-lg">اختر مسلسلك المفضل واستمتع بالمشاهدة</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* اختيار المسلسل */}
        {seriesLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {series.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSeriesId(s.id);
                    setSelectedSeason(1);
                    setSelectedEpisode(null);
                  }}
                  className={`relative group overflow-hidden rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    selectedSeriesId === s.id
                      ? 'ring-2 ring-primary shadow-lg shadow-primary/50'
                      : 'hover:ring-2 hover:ring-primary/50'
                  }`}
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-3">
                    <div className="text-center">
                      <p className="font-bold text-sm line-clamp-2">{s.titleAr}</p>
                      {s.genre && <p className="text-xs text-muted-foreground mt-1">{s.genre}</p>}
                    </div>
                  </div>
                  {selectedSeriesId === s.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary fill-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSeriesId && currentSeries && (
          <div className="space-y-8">
            {/* معلومات المسلسل */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">{currentSeries.titleAr}</h2>
              {currentSeries.genre && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-semibold">النوع:</span> {currentSeries.genre}
                </p>
              )}
              {currentSeries.descriptionAr && (
                <p className="text-sm text-muted-foreground line-clamp-2">{currentSeries.descriptionAr}</p>
              )}
            </div>

            {/* المشغل */}
            {selectedEpisode && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-black shadow-2xl">
                  <VideoPlayer
                    videoUrl={selectedEpisode.videoUrl}
                    videoType={(selectedEpisode.videoType || 'telegram') as 'youtube' | 'm3u8' | 'mp4' | 'telegram'}
                    title={selectedEpisode.titleAr}
                  />
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-xl font-bold mb-2">
                    الحلقة {selectedEpisode.episodeNumber}: {selectedEpisode.titleAr}
                  </h3>
                  {selectedEpisode.descriptionAr && (
                    <p className="text-muted-foreground">{selectedEpisode.descriptionAr}</p>
                  )}
                </div>
              </div>
            )}

            {/* اختيار الموسم والبحث */}
            <div className="space-y-4">
              {seasons.length > 1 && (
                <div>
                  <label className="text-sm font-semibold mb-3 block">الموسم:</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {seasons.map((season) => (
                      <button
                        key={season}
                        onClick={() => setSelectedSeason(season)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          selectedSeason === season
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        الموسم {season}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* البحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث عن حلقة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10"
                />
              </div>
            </div>

            {/* قائمة الحلقات */}
            {loadingEpisodes ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredEpisodes.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-bold">الحلقات المتاحة ({filteredEpisodes.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEpisodes.map((episode) => (
                    <button
                      key={episode.id}
                      onClick={() => setSelectedEpisode(episode)}
                      className={`group relative overflow-hidden rounded-lg transition-all duration-300 text-left ${
                        selectedEpisode?.id === episode.id
                          ? 'ring-2 ring-primary shadow-lg shadow-primary/50'
                          : 'hover:ring-2 hover:ring-primary/50'
                      }`}
                    >
                      <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 h-full border border-border group-hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm">الحلقة {episode.episodeNumber}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {episode.titleAr}
                            </p>
                          </div>
                          {selectedEpisode?.id === episode.id && (
                            <Play className="w-5 h-5 text-primary fill-primary ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">لا توجد حلقات متاحة</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

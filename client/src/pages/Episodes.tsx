'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import VideoPlayer from '@/components/VideoPlayer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Play, Heart, Share2, Download, X } from 'lucide-react';

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
  posterUrl?: string | null;
  totalEpisodes?: number | null;
  totalSeasons?: number | null;
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
      setLoadingSeries(false);
    }
  }, [seriesData]);

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
          ep.titleAr.includes(searchQuery) ||
          ep.episodeNumber.toString().includes(searchQuery)
      );
    }

    setFilteredEpisodes(filtered);
  }, [episodes, selectedSeason, searchQuery]);

  const seasons = Array.from(
    new Set(episodes.map((ep) => ep.season))
  ).sort((a, b) => a - b);

  const currentSeries = series.find((s) => s.id === selectedSeriesId);

  if (!selectedSeriesId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-primary/20 py-8 mb-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">🎬 الحلقات</h1>
            <p className="text-muted-foreground text-lg">اختر مسلسلك المفضل واستمتع بالمشاهدة</p>
          </div>
        </div>

        {/* Series Grid */}
        <div className="container mx-auto px-4 pb-12">
          {seriesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {series.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSeriesId(s.id);
                    setSelectedSeason(1);
                    setSelectedEpisode(null);
                  }}
                  className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-3 relative overflow-hidden">
                    {s.posterUrl ? (
                      <img
                        src={s.posterUrl}
                        alt={s.titleAr}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="font-bold text-sm line-clamp-2">{s.titleAr}</p>
                        {s.genre && <p className="text-xs text-muted-foreground mt-1">{s.genre}</p>}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-2 bg-card">
                    <p className="font-semibold text-xs truncate">{s.titleAr}</p>
                    <p className="text-xs text-muted-foreground">{s.totalEpisodes || 0} حلقة</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      {selectedEpisode && currentSeries?.posterUrl && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src={currentSeries.posterUrl}
            alt={currentSeries.titleAr}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 pb-12">
        {/* Back Button & Series Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{currentSeries?.titleAr}</h1>
            {currentSeries?.genre && (
              <p className="text-muted-foreground">{currentSeries.genre}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSeriesId(null);
              setSelectedEpisode(null);
            }}
            className="h-10 w-10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Series Description */}
        {currentSeries?.descriptionAr && (
          <p className="text-sm md:text-base text-muted-foreground mb-6 line-clamp-3">
            {currentSeries.descriptionAr}
          </p>
        )}

        {/* Series Meta */}
        <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">الحلقات:</span>
            <span className="font-bold text-lg">{currentSeries?.totalEpisodes || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">المواسم:</span>
            <span className="font-bold text-lg">{currentSeries?.totalSeasons || 1}</span>
          </div>
        </div>

        {/* Video Player */}
        {selectedEpisode && (
          <div className="mb-8">
            <div className="bg-black rounded-lg overflow-hidden mb-4 shadow-2xl">
              <VideoPlayer
                videoUrl={selectedEpisode.videoUrl}
                videoType={(selectedEpisode.videoType || 'telegram') as 'youtube' | 'm3u8' | 'mp4' | 'telegram'}
                title={selectedEpisode.titleAr}
              />
            </div>

            {/* Episode Info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  الحلقة {selectedEpisode.episodeNumber}
                </h2>
                {selectedEpisode.titleAr && (
                  <p className="text-muted-foreground">{selectedEpisode.titleAr}</p>
                )}
                {selectedEpisode.descriptionAr && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {selectedEpisode.descriptionAr}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4 mb-8">
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    الموسم {season}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
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

        {/* Episodes List */}
        {loadingEpisodes ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredEpisodes.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">الحلقات المتاحة ({filteredEpisodes.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary mb-2">{episode.episodeNumber}</p>
                      <Play className="w-8 h-8 text-primary mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3 bg-card border-t border-border">
                    <h4 className="font-semibold text-sm truncate">الحلقة {episode.episodeNumber}</h4>
                    {episode.titleAr && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{episode.titleAr}</p>
                    )}
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
    </div>
  );
}

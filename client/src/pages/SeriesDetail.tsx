'use client';

import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Heart, Share2, Download, ArrowLeft } from 'lucide-react';

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

export default function SeriesDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const seriesId = params.id ? parseInt(params.id) : 0;

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);

  // جلب بيانات المسلسل
  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery(
    { id: seriesId },
    { enabled: !!seriesId }
  );

  // جلب الحلقات
  const { data: episodesData, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery(
    { seriesId },
    { enabled: !!seriesId }
  );

  useEffect(() => {
    if (episodesData) {
      setEpisodes(episodesData);
      const firstEpisode = episodesData[0];
      if (firstEpisode) {
        setSelectedEpisode(firstEpisode);
        setSelectedSeason(firstEpisode.season);
      }
    }
  }, [episodesData]);

  // تصفية الحلقات حسب الموسم
  useEffect(() => {
    const filtered = episodes.filter((ep) => ep.season === selectedSeason);
    setFilteredEpisodes(filtered);
  }, [episodes, selectedSeason]);

  const seasons = Array.from(new Set(episodes.map((ep) => ep.season))).sort((a, b) => a - b);

  if (seriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">المسلسل غير موجود</p>
          <Button onClick={() => setLocation('/')}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 overflow-hidden group">
        {series.posterUrl ? (
          <img
            src={series.posterUrl}
            alt={series.titleAr}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 pb-12">
        {/* Series Info */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{series.titleAr}</h1>
          {series.genre && <p className="text-muted-foreground text-lg mb-4">{series.genre}</p>}

          {/* Description */}
          {series.descriptionAr && (
            <p className="text-sm md:text-base text-muted-foreground mb-6 line-clamp-3">
              {series.descriptionAr}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">الحلقات:</span>
              <span className="font-bold text-lg">{series.totalEpisodes || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">المواسم:</span>
              <span className="font-bold text-lg">{series.totalSeasons || 1}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            {selectedEpisode && (
              <>
                <Button className="gap-2">
                  <Play className="w-4 h-4" />
                  شاهد الآن
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
              </>
            )}
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
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">
                الحلقة {selectedEpisode.episodeNumber}
              </h2>
              {selectedEpisode.titleAr && (
                <p className="text-lg text-muted-foreground mb-2">{selectedEpisode.titleAr}</p>
              )}
              {selectedEpisode.descriptionAr && (
                <p className="text-sm text-muted-foreground">{selectedEpisode.descriptionAr}</p>
              )}
            </div>
          </div>
        )}

        {/* Episodes Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">الحلقات</h3>

          {/* Season Filter */}
          {seasons.length > 1 && (
            <div className="mb-6">
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

          {/* Episodes Grid */}
          {episodesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : filteredEpisodes.length > 0 ? (
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
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">لا توجد حلقات متاحة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

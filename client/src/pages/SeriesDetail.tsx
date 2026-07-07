'use client';

import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Heart, Share2, Download, ArrowLeft, ThumbsUp } from 'lucide-react';

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
  bannerUrl?: string | null;
  logoUrl?: string | null;
  totalEpisodes?: number | null;
  totalSeasons?: number | null;
}

export default function SeriesDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const seriesId = params.id ? parseInt(params.id) : 0;

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

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

  // جلب الإعجابات
  const { data: isLiked } = trpc.likes.isLiked.useQuery({ seriesId }, { enabled: !!seriesId });
  const { data: likeCount } = trpc.likes.getLikeCount.useQuery({ seriesId }, { enabled: !!seriesId });
  const addLikeMutation = trpc.likes.addLike.useMutation();
  const removeLikeMutation = trpc.likes.removeLike.useMutation();

  useEffect(() => {
    if (episodesData) {
      setEpisodes(episodesData);
      if (episodesData.length > 0 && !selectedEpisode) {
        setSelectedEpisode(episodesData[0]);
      }
    }
  }, [episodesData, selectedEpisode]);

  const handleLikeToggle = async () => {
    try {
      if (isLiked) {
        await removeLikeMutation.mutateAsync({ seriesId });
      } else {
        await addLikeMutation.mutateAsync({ seriesId });
      }
    } catch (error) {
      console.error('خطأ في تحديث الإعجاب:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/series/${seriesId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: series?.titleAr || '',
          text: (series?.descriptionAr || '').substring(0, 100),
          url: shareUrl,
        });
      } catch (error) {
        console.error('خطأ في المشاركة:', error);
      }
    } else {
      // نسخ الرابط إلى الحافظة
      navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ الرابط إلى الحافظة');
    }
  };

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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* البانر والإعلان */}
      <div className="relative h-64 md:h-96 overflow-hidden group">
        {series.bannerUrl ? (
          <img
            src={series.bannerUrl}
            alt={series.titleAr}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* زر العودة */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* اللوقو والمعلومات */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6 mb-8">
          {/* اللوقو */}
          {series.logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={series.logoUrl}
                alt={series.titleAr}
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-2 border-primary/20"
              />
            </div>
          )}

          {/* المعلومات */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{series.titleAr}</h1>
            
            {/* التصنيفات */}
            {series.genre && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {series.genre.split(',').map((genre, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                    {genre.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* الوصف */}
            {series.descriptionAr && (
              <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-3">
                {series.descriptionAr}
              </p>
            )}

            {/* الإحصائيات */}
            <div className="flex gap-6 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">الحلقات:</span>
                <span className="font-bold">{series.totalEpisodes || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">المواسم:</span>
                <span className="font-bold">{series.totalSeasons || 1}</span>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 flex-wrap">
              {selectedEpisode && (
                <>
                  <Button 
                    className="gap-2"
                    onClick={() => {
                      setIsPlayerOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Play className="w-4 h-4" />
                    شاهد الآن
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleLikeToggle}
                    className={isLiked ? 'bg-primary/20 text-primary' : ''}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* عدد الإعجابات */}
            {likeCount !== undefined && likeCount > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                {likeCount} شخص أعجب بهذا المسلسل
              </p>
            )}
          </div>
        </div>

        {/* المشغل */}
        {selectedEpisode && isPlayerOpen && (
          <div className="mb-8">
            <div className="bg-black rounded-lg overflow-hidden mb-4 shadow-2xl">
              <VideoPlayer
                videoUrl={selectedEpisode.videoUrl}
                videoType={((selectedEpisode.videoType || 'telegram') as any) as 'youtube' | 'm3u8' | 'mp4' | 'telegram'}
                title={selectedEpisode.titleAr}
              />
            </div>

            {/* معلومات الحلقة */}
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

        {/* الحلقات - عمودية */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">الحلقات</h3>

          {episodesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => {
                    setSelectedEpisode(episode);
                    setIsPlayerOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex gap-4 p-4 rounded-lg transition-all duration-300 text-left ${
                    selectedEpisode?.id === episode.id
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-card border border-border hover:border-primary/50 hover:bg-card/80'
                  }`}
                >
                  {/* صورة الحلقة */}
                  <div className="flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden bg-muted">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{episode.episodeNumber}</p>
                        <Play className="w-5 h-5 text-primary mx-auto mt-1 opacity-60" />
                      </div>
                    </div>
                  </div>

                  {/* معلومات الحلقة */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base md:text-lg truncate">
                      الحلقة {episode.episodeNumber}
                    </h4>
                    {episode.titleAr && (
                      <p className="text-sm md:text-base text-muted-foreground truncate mt-1">
                        {episode.titleAr}
                      </p>
                    )}
                    {episode.descriptionAr && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-2">
                        {episode.descriptionAr}
                      </p>
                    )}
                  </div>

                  {/* أيقونة التشغيل */}
                  <div className="flex-shrink-0 flex items-center">
                    <div className="bg-primary/20 p-2 rounded-full">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
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

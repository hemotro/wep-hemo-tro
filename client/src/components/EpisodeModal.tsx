import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { Button } from "./ui/button";

interface Episode {
  id: number;
  episodeNumber: number;
  titleAr: string;
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface Series {
  id: number;
  titleAr: string;
}

interface EpisodeModalProps {
  isOpen: boolean;
  episode: Episode | null;
  series: Series | null;
  episodes: Episode[];
  onClose: () => void;
  onEpisodeChange: (episode: Episode) => void;
}

export default function EpisodeModal({
  isOpen,
  episode,
  series,
  episodes,
  onClose,
  onEpisodeChange,
}: EpisodeModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !episode || !series) return null;

  const currentIndex = episodes.findIndex((ep) => ep.id === episode.id);
  const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;

  const handleNextEpisode = () => {
    if (nextEpisode) {
      onEpisodeChange(nextEpisode);
    }
  };

  const handlePrevEpisode = () => {
    if (prevEpisode) {
      onEpisodeChange(prevEpisode);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${
        isFullscreen ? "p-0" : "p-4"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-background rounded-lg overflow-hidden ${
          isFullscreen ? "w-full h-full" : "w-full max-w-4xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس Modal */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{series.titleAr}</p>
            <p className="text-sm font-semibold text-foreground">
              الحلقة {episode.episodeNumber}: {episode.titleAr}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* محتوى Modal */}
        <div className={`bg-black ${isFullscreen ? "h-full flex flex-col" : ""}`}>
          {/* المشغل */}
          <div className={`${isFullscreen ? "flex-1" : "aspect-video"}`}>
            <VideoPlayer
              src={episode.videoUrl}
              title={`${series.titleAr} - الحلقة ${episode.episodeNumber}`}
              poster={episode.thumbnailUrl || undefined}
            />
          </div>

          {/* أزرار التنقل */}
          {!isFullscreen && (
            <div className="flex gap-2 p-4 border-t border-border bg-muted/50">
              <Button
                onClick={handlePrevEpisode}
                disabled={!prevEpisode}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                السابقة
              </Button>
              <Button
                onClick={handleNextEpisode}
                disabled={!nextEpisode}
                className="flex-1 flex items-center justify-center gap-2"
              >
                التالية
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

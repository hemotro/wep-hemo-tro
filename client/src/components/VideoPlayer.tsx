/**
 * مشغل فيديو احترافي مخصص لـ hemo tro
 * يدعم جميع تنسيقات الفيديو والجودات المتعددة
 */
import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, AlertCircle, Settings } from "lucide-react";

interface VideoQuality {
  label: string;
  url: string;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  onEnded?: () => void;
  type?: 'video/mp4' | 'application/x-mpegURL' | 'application/dash+xml' | 'auto';
  qualities?: VideoQuality[];
}

export default function VideoPlayer({
  src,
  title = "الحلقة",
  poster,
  onEnded,
  type = 'auto',
  qualities = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const controlsTimeoutRef = useRef<any>(null);
  const qualitiesRef = useRef<HTMLDivElement>(null);

  const selectedQuality = qualities[currentQuality]?.label || "خودکار";

  // تحديد نوع الفيديو تلقائياً
  const detectVideoType = (url: string): string => {
    if (type !== 'auto') return type;
    
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.m3u8') || urlLower.includes('m3u8')) {
      return 'application/x-mpegURL';
    }
    if (urlLower.includes('.mpd') || urlLower.includes('dash')) {
      return 'application/dash+xml';
    }
    return 'video/mp4';
  };

  const videoType = detectVideoType(currentSrc);
  const hasQualities = qualities && qualities.length > 0;

  // تشغيل/إيقاف الفيديو - فقط عند الضغط على الزر
  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setVideoError('فشل تشغيل الفيديو');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // منع التشغيل/الإيقاف عند الضغط على الفيديو
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // كتم الصوت
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ملء الشاشة
  const toggleFullscreen = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("خطأ في ملء الشاشة:", error);
    }
  };

  // تحديث الوقت الحالي
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // تحديث المدة الكلية
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  // معالجة أخطاء الفيديو
  const handleVideoError = () => {
    setVideoError('فشل تحميل الفيديو. يرجى التحقق من رابط الفيديو.');
    setIsLoading(false);
  };

  // تغيير الجودة
  const handleQualityChange = (index: number) => {
    if (qualities[index]) {
      const currentTimeBackup = videoRef.current?.currentTime || 0;
      const wasPlaying = isPlaying;
      
      setCurrentQuality(index);
      setCurrentSrc(qualities[index].url);
      setShowQualityMenu(false);
      setIsLoading(true);

      // استئناف التشغيل من نفس النقطة
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTimeBackup;
          if (wasPlaying) {
            videoRef.current.play().catch(() => {
              setVideoError('فشل تشغيل الفيديو');
            });
          }
        }
      }, 500);
    }
  };

  // تغيير الوقت
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // تغيير مستوى الصوت
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  // تغيير سرعة التشغيل
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // إخفاء التحكم بعد فترة من عدم الحركة
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // إغلاق قائمة الجودات عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (qualitiesRef.current && !qualitiesRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };

    if (showQualityMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showQualityMenu]);

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // حساب نسبة التقدم
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="w-full bg-black rounded-lg overflow-hidden group relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      {/* الفيديو */}
      {videoError ? (
        <div className="w-full aspect-video bg-black flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-500 mb-2">{videoError}</p>
            <p className="text-muted-foreground text-xs break-all max-w-xs">{currentSrc}</p>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            poster={poster}
            className="w-full h-auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={onEnded}
            onClick={handleVideoClick}
            onError={handleVideoError}
            crossOrigin="anonymous"
            controls={false}
          >
            {videoType === 'application/x-mpegURL' ? (
              <source src={currentSrc} type="application/x-mpegURL" />
            ) : videoType === 'application/dash+xml' ? (
              <source src={currentSrc} type="application/dash+xml" />
            ) : (
              <source src={currentSrc} type="video/mp4" />
            )}
            متصفحك لا يدعم عنصر الفيديو.
          </video>

          {/* مؤشر التحميل */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </>
      )}

      {/* التحكم */}
      {!videoError && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-2 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* شريط التقدم */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-0.5 bg-gray-700 rounded cursor-pointer appearance-none hover:h-1 transition-all"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
              }}
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-between gap-1 text-xs">
            {/* الأزرار اليسرى */}
            <div className="flex items-center gap-1">
              {/* زر التشغيل/الإيقاف */}
              <button
                onClick={togglePlayPause}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isPlaying ? "إيقاف" : "تشغيل"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-white" />
                )}
              </button>

              {/* التحكم بالصوت */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={toggleMute}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-12 h-0.5 bg-gray-700 rounded cursor-pointer appearance-none hidden sm:inline-block"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`,
                  }}
                />
              </div>

              {/* عرض الوقت */}
              <span className="text-white/80 whitespace-nowrap min-w-fit">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* الأزرار اليمنى */}
            <div className="flex items-center gap-1">
              {/* قائمة الجودات */}
              {hasQualities && (
                <div className="relative" ref={qualitiesRef}>
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="p-1 hover:bg-white/20 rounded transition-colors flex items-center gap-0.5"
                    title="الجودة"
                  >
                    <Settings className="w-4 h-4 text-white" />
                    <span className="text-white hidden sm:inline">{selectedQuality}</span>
                  </button>
                  
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded border border-white/20 overflow-hidden z-10">
                      {qualities.map((quality, index) => (
                        <button
                          key={index}
                          onClick={() => handleQualityChange(index)}
                          className={`block w-full px-3 py-1 text-left text-white hover:bg-primary/50 transition-colors ${
                            currentQuality === index ? "bg-primary" : ""
                          }`}
                        >
                          {quality.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* زر ملء الشاشة */}
              <button
                onClick={toggleFullscreen}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isFullscreen ? "خروج ملء الشاشة" : "ملء الشاشة"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-white" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

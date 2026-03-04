/**
 * مشغل فيديو احترافي مخصص لـ hemo tro
 * يدعم جميع تنسيقات الفيديو (MP4, HLS, DASH) والتحكم الكامل
 */
import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  onEnded?: () => void;
  type?: 'video/mp4' | 'application/x-mpegURL' | 'application/dash+xml' | 'auto';
}

export default function VideoPlayer({
  src,
  title = "الحلقة",
  poster,
  onEnded,
  type = 'auto',
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
  const controlsTimeoutRef = useRef<any>(null);

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

  const videoType = detectVideoType(src);

  // تشغيل/إيقاف الفيديو
  const togglePlay = () => {
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

  // كتم الصوت
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ملء الشاشة
  const toggleFullscreen = async () => {
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
            <p className="text-muted-foreground text-xs break-all max-w-xs">{src}</p>
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
            onClick={togglePlay}
            onError={handleVideoError}
            crossOrigin="anonymous"
            controls={false}
          >
            {videoType === 'application/x-mpegURL' ? (
              <source src={src} type="application/x-mpegURL" />
            ) : videoType === 'application/dash+xml' ? (
              <source src={src} type="application/dash+xml" />
            ) : (
              <source src={src} type="video/mp4" />
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
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* شريط التقدم */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded cursor-pointer appearance-none hover:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
              }}
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-between">
            {/* الأزرار اليسرى */}
            <div className="flex items-center gap-2">
              {/* زر التشغيل/الإيقاف */}
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title={isPlaying ? "إيقاف" : "تشغيل"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              {/* التحكم بالصوت */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-700 rounded cursor-pointer appearance-none"
                />
              </div>

              {/* الوقت */}
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* الأزرار اليمنى */}
            <div className="flex items-center gap-2">
              {/* سرعة التشغيل */}
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-gray-800 text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* زر ملء الشاشة */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* عنوان الحلقة */}
          {title && <p className="text-white text-sm mt-2">{title}</p>}
        </div>
      )}

      {/* زر التشغيل الكبير في المنتصف */}
      {!isPlaying && !videoError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors"
          onClick={togglePlay}
        >
          <div className="bg-blue-600 hover:bg-blue-700 p-4 rounded-full transition-colors">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface VideoPlayerProps {
  videoUrl: string;
  video480pUrl?: string;
  video720pUrl?: string;
  video1080pUrl?: string;
  isLive?: boolean;
  title?: string;
  episodeNumber?: string;
  videoType?: "youtube" | "m3u8" | "mp4" | "telegram";
}

export default function VideoPlayer({ videoUrl, video480pUrl, video720pUrl, video1080pUrl, isLive = false, title, episodeNumber, videoType = "mp4" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [telegramVideoUrl, setTelegramVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب رابط الفيديو من Telegram
  useEffect(() => {
    if (videoType === "telegram" && videoUrl) {
      const fetchTelegramUrl = async () => {
        setLoading(true);
        setError(null);
        try {
          // استدعاء API للحصول على رابط الفيديو من Telegram
          const response = await fetch(`/api/get-telegram-video?fileId=${encodeURIComponent(videoUrl)}`);
          if (!response.ok) {
            throw new Error("فشل جلب الفيديو من Telegram");
          }
          const data = await response.json();
          setTelegramVideoUrl(data.url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "خطأ في جلب الفيديو");
          console.error("Error fetching Telegram video:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTelegramUrl();
    }
  }, [videoUrl, videoType]);

  // إعداد مشغل الفيديو
  useEffect(() => {
    // إذا كان نوع الفيديو Telegram وليس لدينا الرابط بعد
    if (videoType === "telegram" && !telegramVideoUrl) {
      return;
    }

    // تحديد الرابط الفعلي للفيديو
    const actualUrl = videoType === "telegram" ? telegramVideoUrl : videoUrl;
    if (!actualUrl) return;

    // تحميل مكتبات Plyr و HLS من CDN
    const loadScripts = async () => {
      // تحميل Plyr CSS
      if (!document.querySelector('link[href*="plyr.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
        document.head.appendChild(link);
      }

      // تحميل Plyr JS
      if (!window.Plyr) {
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.plyr.io/3.7.8/plyr.polyfilled.js';
        script1.async = true;
        document.body.appendChild(script1);

        await new Promise(resolve => {
          script1.onload = resolve;
        });
      }

      // تحميل HLS.js
      if (!window.Hls) {
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script2.async = true;
        document.body.appendChild(script2);

        await new Promise(resolve => {
          script2.onload = resolve;
        });
      }

      // إعداد المشغل
      if (videoRef.current && window.Plyr) {
        setupPlayer(actualUrl);
      }
    };

    loadScripts();

    return () => {
      if (plyrRef.current) {
        plyrRef.current.destroy();
      }
    };
  }, [telegramVideoUrl, videoUrl, videoType]);

  const setupPlayer = (url: string) => {
    if (!videoRef.current || !window.Plyr) return;

    const isHls = url.endsWith('.m3u8');

    if (isHls) {
      // بث مباشر HLS
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
      } else {
        videoRef.current.src = url;
      }

      // إعداد Plyr للبث المباشر (بدون شريط progress)
      plyrRef.current = new window.Plyr(videoRef.current, {
        controls: ['play', 'rewind', 'fast-forward', 'speed', 'fullscreen'],
        rewind: 10,
        fastForward: 10,
        settings: ['speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      });
    } else {
      // فيديو عادي MP4
      videoRef.current.src = url;
      videoRef.current.setAttribute('controls', 'true');

      // إعداد Plyr للفيديو العادي (شريط كامل)
      plyrRef.current = new window.Plyr(videoRef.current, {
        controls: [
          'play-large',
          'play',
          'rewind',
          'fast-forward',
          'progress',
          'current-time',
          'mute',
          'volume',
          'settings',
          'speed',
          'fullscreen',
        ],
        rewind: 10,
        fastForward: 10,
        settings: ['speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      });
    }
  };

  return (
    <div ref={containerRef} className="w-full bg-black rounded-lg overflow-hidden">
      {/* عنوان الحلقة والمسلسل */}
      {(title || episodeNumber) && (
        <div className="bg-gray-900 px-4 py-2 text-sm text-gray-300 flex items-center justify-between">
          <div>
            {title && <span className="font-semibold">{title}</span>}
            {episodeNumber && <span className="text-gray-400 mr-2">الحلقة {episodeNumber}</span>}
          </div>
          {isLive && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              LIVE
            </div>
          )}
        </div>
      )}

      {/* المشغل */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
              <p>جاري تحميل الفيديو...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white text-center">
              <p className="text-red-400 mb-2">❌ {error}</p>
              <p className="text-sm text-gray-400">يرجى المحاولة لاحقاً</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            crossOrigin="anonymous"
          />
        )}
      </div>
    </div>
  );
}

// تعريف أنواع النوافذ العامة
declare global {
  interface Window {
    Plyr: any;
    Hls: any;
  }
}

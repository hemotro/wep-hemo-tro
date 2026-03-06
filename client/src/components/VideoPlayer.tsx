import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  isLive?: boolean;
  title?: string;
  episodeNumber?: string;
}

export default function VideoPlayer({ videoUrl, isLive = false, title, episodeNumber }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        setupPlayer();
      }
    };

    loadScripts();

    return () => {
      if (plyrRef.current) {
        plyrRef.current.destroy();
      }
    };
  }, [videoUrl]);

  const setupPlayer = () => {
    if (!videoRef.current || !window.Plyr) return;

    const isHls = videoUrl.endsWith('.m3u8');

    if (isHls) {
      // بث مباشر HLS
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoUrl;
      } else {
        videoRef.current.src = videoUrl;
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
      videoRef.current.src = videoUrl;
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
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
          crossOrigin="anonymous"
        />
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

import { useState } from "react";
import { Play } from "lucide-react";
import { trpc } from "@/lib/trpc";
import VideoPlayer from "@/components/VideoPlayer";

export default function Live() {
  const { data: channels = [], isLoading } = trpc.channels.list.useQuery();
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);

  const selectedChannelData = channels.find(ch => ch.id === selectedChannel);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* عنوان الصفحة */}
      <div className="px-4 py-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">البث المباشر</h1>
        <p className="text-muted-foreground mt-2">شاهد القنوات المباشرة الآن</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل القنوات...</p>
          </div>
        </div>
      ) : channels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-muted-foreground text-lg">لا توجد قنوات متاحة حالياً</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 max-w-7xl mx-auto">
          {/* قائمة القنوات */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-foreground mb-4">القنوات</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${
                    selectedChannel === channel.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {channel.logoUrl ? (
                    <img
                      src={channel.logoUrl}
                      alt={channel.nameAr}
                      className="w-12 h-12 object-contain rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs font-semibold text-muted-foreground text-center">
                      {channel.nameAr}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{channel.nameAr}</p>
                    <p className="text-xs text-muted-foreground truncate">{channel.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* مشغل البث */}
          <div className="lg:col-span-3">
            {selectedChannelData ? (
              <div>
                <div className="bg-black rounded-lg overflow-hidden mb-4">
                  {selectedChannelData.streamType === "youtube" ? (
                    <div className="w-full aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={getYoutubeEmbedUrl(selectedChannelData.streamUrl)}
                        title={selectedChannelData.nameAr}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="w-full">
                      <VideoPlayer
                        src={selectedChannelData.streamUrl}
                        title={selectedChannelData.nameAr}
                        poster={selectedChannelData.logoUrl || undefined}
                        type="application/x-mpegURL"
                      />
                    </div>
                  )}
                </div>

                {/* معلومات القناة */}
                <div className="border border-border rounded-lg p-4">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{selectedChannelData.nameAr}</h2>
                  <p className="text-primary text-sm mb-3">{selectedChannelData.name}</p>
                  {selectedChannelData.descriptionAr && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {selectedChannelData.descriptionAr}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 border border-border rounded-lg bg-muted/50">
                <div className="text-center">
                  <Play size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">اختر قناة لبدء المشاهدة</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

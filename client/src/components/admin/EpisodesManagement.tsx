import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import EditEpisodeForm from "./EditEpisodeForm";

interface EpisodesManagementProps {
  seriesId?: number;
}

export default function EpisodesManagement({ seriesId }: EpisodesManagementProps) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // جلب المسلسل وحلقاته
  const seriesQuery = seriesId 
    ? trpc.series.getById.useQuery({ id: seriesId })
    : { data: undefined, isLoading: false, refetch: () => {} };

  const deleteEpisodeMutation = trpc.episodes.delete.useMutation({
    onSuccess: () => {
      seriesQuery.refetch?.();
    },
  });

  useEffect(() => {
    if (seriesQuery.data) {
      // الحلقات ستكون محفوظة في قاعدة البيانات
      // هنا نحتاج إلى جلبها بطريقة أخرى
      setEpisodes([]);
    }
  }, [seriesQuery.data]);

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      setIsLoading(true);
      try {
        await deleteEpisodeMutation.mutateAsync({ id });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (seriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لا توجد حلقات حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {episodes.map((ep: any) => (
        <div key={ep.id} className="space-y-2">
          {editingId === ep.id && (
            <EditEpisodeForm
              episodeId={ep.id}
              onSuccess={() => {
                setEditingId(null);
                seriesQuery.refetch?.();
              }}
            />
          )}
          {editingId !== ep.id && (
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">
                  الموسم {ep.season} - الحلقة {ep.episodeNumber}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ep.titleAr || ep.title}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => setEditingId(ep.id)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(ep.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

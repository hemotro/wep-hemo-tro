import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit2 } from "lucide-react";

export default function SeriesManagement() {
  const [series, setSeries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const seriesListQuery = trpc.series.list.useQuery();
  const deleteSeriesMutation = trpc.series.delete.useMutation({
    onSuccess: () => {
      seriesListQuery.refetch();
    },
  });

  useEffect(() => {
    if (seriesListQuery.data) {
      setSeries(seriesListQuery.data);
    }
  }, [seriesListQuery.data]);

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المسلسل؟")) {
      setIsLoading(true);
      try {
        await deleteSeriesMutation.mutateAsync({ id });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (seriesListQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!series || series.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لا توجد مسلسلات حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {series.map((s: any) => (
        <div
          key={s.id}
          className="p-4 border rounded-lg flex items-center justify-between"
        >
          <div className="flex-1">
            <h3 className="font-semibold">{s.titleAr || s.title}</h3>
            <p className="text-sm text-muted-foreground">
              {s.totalEpisodes} حلقة
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(s.id)}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

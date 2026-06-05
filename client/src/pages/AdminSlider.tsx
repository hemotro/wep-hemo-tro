import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";

export function AdminSlider() {
  // ==================== إدارة السلايدر ====================
  const { data: seriesList, refetch: refetchSeries } = trpc.series.list.useQuery();
  const { data: sliderSeries, refetch: refetchSlider } = trpc.slider.list.useQuery();
  
  const addToSliderMutation = trpc.slider.add.useMutation();
  const removeFromSliderMutation = trpc.slider.remove.useMutation();
  const updateSliderOrderMutation = trpc.slider.updateOrder.useMutation();

  const handleAddToSlider = async (seriesId: number) => {
    try {
      await addToSliderMutation.mutateAsync({
        seriesId,
        order: (sliderSeries?.length || 0) + 1,
      } as any);
      toast.success("تم إضافة المسلسل إلى السلايدر");
      refetchSlider();
    } catch (error) {
      toast.error("حدث خطأ في إضافة المسلسل");
    }
  };

  const handleRemoveFromSlider = async (id: number) => {
    try {
      await removeFromSliderMutation.mutateAsync({ id });
      toast.success("تم حذف المسلسل من السلايدر");
      refetchSlider();
    } catch (error) {
      toast.error("حدث خطأ في حذف المسلسل");
    }
  };

  const handleMoveUp = async (id: number, currentOrder: number) => {
    if (currentOrder <= 1) return;
    try {
      await updateSliderOrderMutation.mutateAsync({
        id,
        order: currentOrder - 1,
      } as any);
      toast.success("تم تحديث الترتيب");
      refetchSlider();
    } catch (error) {
      toast.error("حدث خطأ في تحديث الترتيب");
    }
  };

  const handleMoveDown = async (id: number, currentOrder: number) => {
    if (currentOrder >= (sliderSeries?.length || 0)) return;
    try {
      await updateSliderOrderMutation.mutateAsync({
        id,
        order: currentOrder + 1,
      } as any);
      toast.success("تم تحديث الترتيب");
      refetchSlider();
    } catch (error) {
      toast.error("حدث خطأ في تحديث الترتيب");
    }
  };

  const sliderSeriesIds = new Set(sliderSeries?.map((s: any) => s.seriesId) || []);
  const availableSeries = seriesList?.filter(s => !sliderSeriesIds.has(s.id)) || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-foreground">إدارة السلايدر</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* المسلسلات المتاحة */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>المسلسلات المتاحة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableSeries.length === 0 ? (
                  <p className="text-muted-foreground">جميع المسلسلات موجودة في السلايدر</p>
                ) : (
                  availableSeries.map((series) => (
                    <div key={series.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{series.titleAr}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToSlider(series.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* السلايدر الحالي */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>السلايدر الحالي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sliderSeries?.length === 0 ? (
                  <p className="text-muted-foreground">لا توجد مسلسلات في السلايدر</p>
                ) : (
                  sliderSeries?.map((slider: any, index: number) => (
                    <div key={slider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{seriesList?.find(s => s.id === slider.seriesId)?.titleAr}</p>
                        <p className="text-sm text-muted-foreground">الترتيب: {slider.order}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoveUp(slider.id, slider.order)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoveDown(slider.id, slider.order)}
                          disabled={index === (sliderSeries?.length || 0) - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFromSlider(slider.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

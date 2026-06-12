import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Loader2, Edit2, Trash2, Plus } from "lucide-react";

export function AdminDisplaySections() {
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    alert(type === 'error' ? `خطأ: ${message}` : message);
  };
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    icon: "",
    displayType: "carousel" as "carousel" | "grid" | "list",
    displayOrder: 0,
  });

  // جلب الأقسام
  const { data: sections, isLoading: loadingSections, refetch: refetchSections } = trpc.displaySections.list.useQuery();
  
  // جلب المسلسلات
  const { data: allSeries } = trpc.series.list.useQuery();

  // جلب المسلسلات في القسم المحدد
  const { data: sectionSeries } = trpc.displaySections.getSeriesBySection.useQuery(
    { displaySectionId: editingId || 0 },
    { enabled: editingId !== null }
  );

  // إنشاء قسم جديد
  const createMutation = trpc.displaySections.create.useMutation({
    onSuccess: () => {
      showToast("تم إنشاء القسم بنجاح");
      setIsOpen(false);
      setFormData({ name: "", nameAr: "", description: "", descriptionAr: "", icon: "", displayType: "carousel", displayOrder: 0 });
      refetchSections();
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  // تحديث القسم
  const updateMutation = trpc.displaySections.update.useMutation({
    onSuccess: () => {
      showToast("تم تحديث القسم بنجاح");
      setIsOpen(false);
      setEditingId(null);
      setFormData({ name: "", nameAr: "", description: "", descriptionAr: "", icon: "", displayType: "carousel", displayOrder: 0 });
      refetchSections();
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  // حذف القسم
  const deleteMutation = trpc.displaySections.delete.useMutation({
    onSuccess: () => {
      showToast("تم حذف القسم بنجاح");
      refetchSections();
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  // إضافة مسلسل للقسم
  const addSeriesMutation = trpc.displaySections.addSeries.useMutation({
    onSuccess: () => {
      showToast("تم إضافة المسلسل للقسم");
      setSelectedSeries([]);
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  // إزالة مسلسل من القسم
  const removeSeriesMutation = trpc.displaySections.removeSeries.useMutation({
    onSuccess: () => {
      showToast("تم إزالة المسلسل من القسم");
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  const handleSubmit = () => {
    if (!formData.nameAr || !formData.name) {
      showToast("يرجى ملء جميع الحقول المطلوبة", 'error');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (section: any) => {
    setEditingId(section.id);
    setFormData({
      name: section.name,
      nameAr: section.nameAr,
      description: section.description || "",
      descriptionAr: section.descriptionAr || "",
      icon: section.icon || "",
      displayType: section.displayType || "carousel",
      displayOrder: section.displayOrder || 0,
    });
    setIsOpen(true);
  };

  const handleAddSeries = (seriesId: number) => {
    if (editingId) {
      addSeriesMutation.mutate({ seriesId, displaySectionId: editingId });
    }
  };

  const handleRemoveSeries = (seriesId: number) => {
    if (editingId) {
      removeSeriesMutation.mutate({ seriesId, displaySectionId: editingId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">إدارة أقسام العرض</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", nameAr: "", description: "", descriptionAr: "", icon: "", displayType: "carousel", displayOrder: 0 }); }}>
              <Plus className="mr-2 h-4 w-4" />
              إضافة قسم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">الاسم (English)</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: New Episodes"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم (العربية)</label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: حلقات جديدة"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوصف (English)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف القسم"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوصف (العربية)</label>
                <Input
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="وصف القسم بالعربية"
                />
              </div>
              <div>
                <label className="text-sm font-medium">نوع العرض</label>
                <select
                  value={formData.displayType}
                  onChange={(e) => setFormData({ ...formData, displayType: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="carousel">Carousel</option>
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">ترتيب العرض</label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  editingId ? "تحديث القسم" : "إنشاء القسم"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingSections ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sections && sections.length > 0 ? (
        <div className="grid gap-4">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{section.nameAr}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(section)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: section.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{section.descriptionAr}</p>
                </div>
                
                {editingId === section.id && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold">إضافة مسلسلات للقسم</h4>
                    <div className="space-y-2">
                      {allSeries?.map((series) => {
                        const isInSection = sectionSeries?.some(s => s.id === series.id);
                        return (
                          <div key={series.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{series.titleAr}</span>
                            {isInSection ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveSeries(series.id)}
                              >
                                إزالة
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSeries(series.id)}
                              >
                                إضافة
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">لا توجد أقسام حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

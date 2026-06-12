import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit2, Trash2, Plus } from "lucide-react";

export function AdminChannels() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    logoUrl: "",
    streamUrl: "",
    streamType: "m3u8" as "m3u8" | "youtube",
    description: "",
    descriptionAr: "",
  });

  // جلب القنوات
  const { data: channels, isLoading: loadingChannels, refetch: refetchChannels } = trpc.channels.list.useQuery();

  // إنشاء قناة جديدة
  const createMutation = trpc.channels.create.useMutation({
    onSuccess: () => {
      alert("تم إنشاء القناة بنجاح");
      setIsOpen(false);
      setFormData({ name: "", nameAr: "", logoUrl: "", streamUrl: "", streamType: "m3u8", description: "", descriptionAr: "" });
      refetchChannels();
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  // تحديث القناة
  const updateMutation = trpc.channels.update.useMutation({
    onSuccess: () => {
      alert("تم تحديث القناة بنجاح");
      setIsOpen(false);
      setEditingId(null);
      setFormData({ name: "", nameAr: "", logoUrl: "", streamUrl: "", streamType: "m3u8", description: "", descriptionAr: "" });
      refetchChannels();
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  // حذف القناة
  const deleteMutation = trpc.channels.delete.useMutation({
    onSuccess: () => {
      alert("تم حذف القناة بنجاح");
      refetchChannels();
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.nameAr || !formData.name || !formData.streamUrl) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (channel: any) => {
    setEditingId(channel.id);
    setFormData({
      name: channel.name,
      nameAr: channel.nameAr,
      logoUrl: channel.logoUrl || "",
      streamUrl: channel.streamUrl,
      streamType: channel.streamType,
      description: channel.description || "",
      descriptionAr: channel.descriptionAr || "",
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">إدارة القنوات</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", nameAr: "", logoUrl: "", streamUrl: "", streamType: "m3u8", description: "", descriptionAr: "" }); }}>
              <Plus className="mr-2 h-4 w-4" />
              إضافة قناة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل القناة" : "إضافة قناة جديدة"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">الاسم (English)</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: Shahid"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم (العربية)</label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: شاهد"
                />
              </div>
              <div>
                <label className="text-sm font-medium">رابط البث</label>
                <Input
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                  placeholder="https://example.com/stream.m3u8"
                />
              </div>
              <div>
                <label className="text-sm font-medium">نوع البث</label>
                <select
                  value={formData.streamType}
                  onChange={(e) => setFormData({ ...formData, streamType: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="m3u8">M3U8</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">رابط الشعار</label>
                <Input
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوصف (English)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف القناة"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوصف (العربية)</label>
                <Input
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="وصف القناة بالعربية"
                />
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  editingId ? "تحديث القناة" : "إنشاء القناة"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingChannels ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : channels && channels.length > 0 ? (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{channel.nameAr}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(channel)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: channel.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">{channel.descriptionAr}</p>
                <p className="text-sm"><strong>نوع البث:</strong> {channel.streamType}</p>
                <p className="text-sm"><strong>رابط البث:</strong> <a href={channel.streamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{channel.streamUrl}</a></p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">لا توجد قنوات حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

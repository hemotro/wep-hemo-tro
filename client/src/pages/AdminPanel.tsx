import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Film, Clapperboard, Settings, LogOut } from "lucide-react";
import AddSeriesForm from "@/components/admin/AddSeriesForm";
import AddEpisodeForm from "@/components/admin/AddEpisodeForm";
import SeriesManagement from "@/components/admin/SeriesManagement";
import EpisodesManagement from "@/components/admin/EpisodesManagement";

export default function AdminPanel() {
  const { data: user } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("series");

  // التحقق من أن المستخدم مسجل دخول
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>الوصول مرفوض</CardTitle>
            <CardDescription>يجب تسجيل الدخول أولاً</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full"
            >
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20">
      {/* رأس الصفحة */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">لوحة الإدارة</h1>
            <p className="text-sm text-muted-foreground mt-1">مرحباً {user.name}</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">العودة</span>
          </Button>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="series" className="gap-2">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">المسلسلات</span>
            </TabsTrigger>
            <TabsTrigger value="episodes" className="gap-2">
              <Clapperboard className="w-4 h-4" />
              <span className="hidden sm:inline">الحلقات</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          {/* تبويب المسلسلات */}
          <TabsContent value="series" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    إضافة مسلسل جديد
                  </CardTitle>
                  <CardDescription>أضف مسلسل جديد إلى المنصة</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddSeriesForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>المسلسلات الموجودة</CardTitle>
                  <CardDescription>إدارة المسلسلات والتعديل عليها</CardDescription>
                </CardHeader>
                <CardContent>
                  <SeriesManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تبويب الحلقات */}
          <TabsContent value="episodes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    إضافة حلقة جديدة
                  </CardTitle>
                  <CardDescription>أضف حلقة جديدة مع الفيديو والصور</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddEpisodeForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الحلقات الموجودة</CardTitle>
                  <CardDescription>إدارة الحلقات والتعديل عليها</CardDescription>
                </CardHeader>
                <CardContent>
                  <EpisodesManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تبويب الإعدادات */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات</CardTitle>
                <CardDescription>إعدادات لوحة الإدارة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">معلومات الحساب</h3>
                    <p className="text-sm text-muted-foreground">الاسم: {user.name}</p>
                    <p className="text-sm text-muted-foreground">البريد: {user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

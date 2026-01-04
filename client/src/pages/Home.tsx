import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play } from "lucide-react";

export default function Home() {
  const { data: seriesList, isLoading } = trpc.series.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المسلسلات...</p>
        </div>
      </div>
    );
  }

  if (!seriesList || seriesList.length === 0) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">مرحباً بك في hemo tro</h1>
          <p className="text-muted-foreground">لا توجد مسلسلات حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20">
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">المسلسلات</h1>
        
        <div className="grid grid-cols-1 gap-4">
          {seriesList.map((series) => (
            <Link key={series.id} href={`/series/${series.id}`}>
              <a>
                <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/20 to-background p-4">
                    <CardHeader className="p-0 mb-3">
                      <CardTitle className="text-2xl text-foreground">{series.titleAr}</CardTitle>
                      <CardDescription className="text-muted-foreground">{series.genre}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-muted-foreground">
                          {series.totalEpisodes} حلقة
                        </span>
                        <span className="text-sm text-muted-foreground">
                          الموسم {series.currentSeason}
                        </span>
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Play className="w-4 h-4 mr-2" />
                        شاهد الآن
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

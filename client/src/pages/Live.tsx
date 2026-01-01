/**
 * صفحة البث المباشر
 * تعرض بث يوتيوب المباشر
 */
export default function Live() {
  return (
    <div className="flex-1 pb-20">
      <div className="w-full h-full">
        <div className="bg-card rounded-lg overflow-hidden">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/t1paeZrylv0?autoplay=1"
              title="البث المباشر"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
        <div className="mt-6 px-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">البث المباشر</h2>
          <p className="text-muted-foreground">شاهد البث المباشر الآن</p>
        </div>
      </div>
    </div>
  );
}

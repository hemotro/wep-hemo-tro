import mysql from 'mysql2/promise';

const episodes_data = [
  { number: 1, title: "الحلقة الأولى", url: "https://youtu.be/SmW6PPexapg?si=rXnoaZaJhQrJtmja" },
  { number: 2, title: "الحلقة الثانية", url: "https://youtu.be/3t_1d4899co?si=fBzJcfMG6KCRK0GA" },
  { number: 3, title: "الحلقة الثالثة", url: "https://youtu.be/39Yd1P6hED8?si=PMCbsSFTT42B2RBF" },
  { number: 4, title: "الحلقة الرابعة", url: "https://youtu.be/oUhnntagnk0?si=APzmG4uI4gDOJphk" },
  { number: 5, title: "الحلقة الخامسة", url: "https://youtu.be/vP-DTnzY6XQ?si=ha6FEIZuodSiUl1M" },
  { number: 6, title: "الحلقة السادسة", url: "https://youtu.be/n9dFsQDS3Is?si=HgfITN5lPV8VUXGc" },
  { number: 7, title: "الحلقة السابعة", url: "https://youtu.be/Gx8oZSyqpRI?si=Gl0eEXJ-lnCndK3V" },
  { number: 8, title: "الحلقة الثامنة", url: "https://youtu.be/DlQh3B6ZN-s?si=QlIsnIswrIsk2Jfi" },
  { number: 9, title: "الحلقة التاسعة", url: "https://youtu.be/_Ji84No0CG4?si=ir5IET8UoBHjhC1s" },
  { number: 10, title: "الحلقة العاشرة والأخيرة", url: "https://youtu.be/ngf7kLQ04yQ?si=Fwfy8fIrP8rvV98M" }
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // إضافة المسلسل
    const [seriesResult] = await connection.execute(
      `INSERT INTO series (title, titleAr, description, descriptionAr, genre, totalSeasons, currentSeason, totalEpisodes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Takhareef",
        "تخاريف",
        "A horror-drama series",
        "مسلسل رعب درامي",
        "رعب - درما",
        1,
        1,
        10
      ]
    );

    const seriesId = seriesResult.insertId;
    console.log(`تم إضافة المسلسل تخاريف برقم: ${seriesId}`);

    // إضافة الحلقات
    for (const ep of episodes_data) {
      const videoId = ep.url.split('?')[0].split('/').pop();
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      await connection.execute(
        `INSERT INTO episodes (seriesId, season, episodeNumber, title, titleAr, videoUrl) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [seriesId, 1, ep.number, ep.title, ep.title, embedUrl]
      );
      console.log(`تم إضافة ${ep.title}`);
    }

    console.log("تم إضافة جميع الحلقات بنجاح!");
  } catch (error) {
    console.error("خطأ:", error);
  } finally {
    await connection.end();
  }
}

seed();

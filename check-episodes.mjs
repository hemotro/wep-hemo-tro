import { getDb } from './server/db.ts';
import { getEpisodesBySeriesId } from './server/db.ts';
import { series } from './drizzle/schema.ts';

async function main() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('No database');
      return;
    }
    
    // جلب جميع المسلسلات
    const allSeries = await db.select().from(series);
    console.log('Series found:', allSeries.length);
    
    for (const s of allSeries) {
      console.log(`\n=== ${s.title} (ID: ${s.id}) ===`);
      
      // جلب الحلقات لكل مسلسل
      const eps = await getEpisodesBySeriesId(s.id);
      console.log(`  Episodes: ${eps.length}`);
      
      eps.forEach((ep, idx) => {
        console.log(`  [${idx + 1}] S${ep.season}E${ep.episodeNumber} - ${ep.title}`);
        console.log(`      videoUrl: ${ep.videoUrl}`);
        console.log(`      videoType: ${ep.videoType}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

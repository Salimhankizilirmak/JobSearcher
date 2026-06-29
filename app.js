import puppeteer from 'puppeteer';
import { initDb } from './db/initDb.js';
import db from './db/database.js';
import { config } from './config/config.js';
import { runScraper } from './services/scraperService.js';
import { discoverCompanyDomain, searchHunterAPI, scrapeFallbackContactPage } from './services/emailDiscoveryService.js';
import { sendOutreachEmail } from './services/emailService.js';
import { syncDatabaseToVercel } from './services/syncService.js';

async function main() {
  console.log('Novexis Tech B2B Hot-Lead Outreach Engine Başlatılıyor...');
  
  try {
    // 1. Initialize database and schemas
    await initDb();
  } catch (dbError) {
    console.error('Fatal database initialization error:', dbError);
    process.exit(1);
  }

  // 2. Loop infinitely as a background daemon
  while (true) {
    let browser = null;
    try {
      console.log(`\n[Sistem] [${new Date().toISOString()}] Yeni bir B2B tarama döngüsü başlatılıyor...`);

      // Launch shared Puppeteer browser
      console.log('[Sistem] Paylaşımlı tarayıcı oturumu başlatılıyor...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // 3. Run the Scraper Service to fetch new jobs
      console.log('[Sistem] Sıcak ilan arama taraması tetikleniyor...');
      const isMock = !config.linkedin.liAt || config.linkedin.liAt.includes('replace_me');
      await runScraper({ mock: isMock, browser, page });

      // 4. Fetch all 'Yeni' status jobs from database
      const newJobs = await db.all(`
        SELECT j.*, c.name as companyName 
        FROM jobs j 
        JOIN companies c ON j.company_id = c.id 
        WHERE j.status = 'Yeni'
      `);

      console.log(`[Sistem] Bulunan yeni ilan sayısı: ${newJobs.length}`);

      // 5. Process each new job for discovery & email outreach
      for (const job of newJobs) {
        console.log(`\n[Sistem] İlan işleniyor: ${job.companyName} - ${job.title}`);
        
        // A. Discover domain
        const domain = await discoverCompanyDomain(job.companyName);
        
        // B. Discover email (Hunter or Scraper Fallback)
        let email = await searchHunterAPI(domain);
        if (!email) {
          email = await scrapeFallbackContactPage(domain, page);
        }

        // C. Send outreach email
        if (email) {
          await sendOutreachEmail(job, email);
        } else {
          console.log(`[Pas Geçildi] [Bounce Koruması] ${job.companyName} için e-posta adresi bulunamadı. Durum 'Manuel İnceleme Bekliyor' olarak kaydediliyor.`);
          await db.run(
            "UPDATE jobs SET status = 'Manuel İnceleme Bekliyor' WHERE id = ?",
            [job.id]
          );
        }
      }

      console.log('\n[Sistem] Tüm yeni ilanlar işlendi.');
    } catch (cycleError) {
      console.error('[Sistem] Döngü sırasında bir hata oluştu:', cycleError);
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('[Sistem] Paylaşımlı tarayıcı kapatıldı.');
        } catch (closeError) {
          console.error('[Sistem] Tarayıcı kapatılırken hata:', closeError);
        }
      }
      
      // Sync DB state to Vercel at the end of every cycle
      try {
        await syncDatabaseToVercel();
      } catch (syncError) {
        console.error('[Sistem] Senkronizasyon sırasında hata:', syncError.message);
      }
    }

    // Inform and sleep for 1 hour (or custom environment override)
    console.log("[Sistem] Mevcut tarama cycle'ı tamamlandı. Yeni ilanlar için 1 saat (3600000 ms) geri sayım başlatılıyor...");
    const sleepTime = process.env.TEST_SLEEP_MS ? parseInt(process.env.TEST_SLEEP_MS, 10) : 3600000;
    await new Promise(resolve => setTimeout(resolve, sleepTime));
  }
}

// Handle termination signals gracefully
process.on('SIGINT', async () => {
  console.log('Engine durduruluyor ve veritabanı bağlantıları kapatılıyor...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Engine sonlandırılıyor...');
  await db.close();
  process.exit(0);
});

main();

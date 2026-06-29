import puppeteer from 'puppeteer';
import db from '../db/database.js';
import { config } from '../config/config.js';

export async function runScraper(options = { mock: false }) {
  console.log('[Scraper] Tarayıcı başlatılıyor...');
  
  try {
    // 1. Ensure database is connected
    await db.connect();

    // 2. Mock Mode check
    if (options.mock) {
      console.log('[Scraper] Mock modu aktif. Mock ilan üretiliyor...');
      await simulateMockScraping();
      return;
    }

    // 5. Scrape keywords using HTTP Fetch to bypass redirects
    for (const keyword of config.linkedin.keywords) {
      console.log(`[Scraper] "${keyword}" anahtar kelimesi ile ilan araması (Türkiye konumlu) başlatılıyor...`);
      const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=Turkey`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': config.linkedin.userAgent
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn HTTP error! Status: ${response.status}`);
      }

      const html = await response.text();
      
      // Simple Regex parsing for guest cards HTML
      const results = [];
      const cardRegex = /<li[\s\S]*?data-entity-urn="urn:li:jobPosting:(\d+)"[\s\S]*?<\/li>/g;
      let match;
      
      while ((match = cardRegex.exec(html)) !== null) {
        const cardHtml = match[0];
        
        // Extract title
        const titleMatch = cardHtml.match(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/);
        // Extract company
        const companyMatch = cardHtml.match(/<h4 class="base-search-card__subtitle">[\s\S]*?<a[\s\S]*?>([\s\S]*?)<\/a>/) || cardHtml.match(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/);
        // Extract URL
        const urlMatch = cardHtml.match(/<a class="base-card__full-link absolute[\s\S]*?href="([\s\S]*?)"/);
        
        if (titleMatch && urlMatch) {
          const title = titleMatch[1].trim();
          const companyName = companyMatch ? companyMatch[1].trim() : 'Bilinmeyen Şirket';
          const url = urlMatch[1].split('?')[0]; // Clean query parameters
          
          results.push({
            title,
            companyName,
            url,
            description: `Teknoloji: ${keyword}. Detaylar için ilanı ziyaret edin.`
          });
        }
      }

      console.log(`[Scraper] "${keyword}" için ${results.length} adet potansiyel ilan tespit edildi.`);

      // 6. De-duplication and save to DB
      for (const job of results) {
        await processJobListing(job);
      }
    }

  } catch (error) {
    console.error('[Scraper] Hata oluştu:', error);
  }
}

async function processJobListing(job) {
  try {
    // Check if job exists in database by url
    const existingJob = await db.get('SELECT id FROM jobs WHERE url = ?', [job.url]);

    if (existingJob) {
      console.log(`[Pas Geçildi] Bu ilana daha önce teklif atılmış: ${job.companyName} - ${job.title}`);
      return;
    }

    // Get or Create Company
    let company = await db.get('SELECT id FROM companies WHERE name = ?', [job.companyName]);
    let companyId;

    if (!company) {
      const result = await db.run(
        'INSERT INTO companies (name, created_at) VALUES (?, CURRENT_TIMESTAMP)',
        [job.companyName]
      );
      companyId = result.id;
    } else {
      companyId = company.id;
    }

    // Insert Job
    await db.run(
      `INSERT INTO jobs (company_id, platform, title, description, url, status, created_at) 
       VALUES (?, 'LinkedIn', ?, ?, ?, 'Yeni', CURRENT_TIMESTAMP)`,
      [companyId, job.title, job.description, job.url]
    );

    console.log(`[Veritabanı] Yeni sıcak ilan bulundu: ${job.companyName} - ${job.title}`);
  } catch (err) {
    console.error(`[Veritabanı] İlan işlenirken hata oluştu: ${job.title}`, err);
  }
}

// Simulated data scraper for testing/fallback
async function simulateMockScraping() {
  const mockJobs = [
    {
      title: 'Senior Node.js Developer',
      companyName: 'Novexis Tech',
      url: 'https://www.linkedin.com/jobs/view/123456',
      description: 'We are looking for a Senior Node.js Developer experienced with AWS.'
    },
    {
      title: 'Fullstack Next.js Developer',
      companyName: 'Novexis Tech',
      url: 'https://www.linkedin.com/jobs/view/654321',
      description: 'Next.js and Tailwind expert.'
    },
    {
      title: 'AWS Cloud Architect',
      companyName: 'Cloudly Inc',
      url: 'https://www.linkedin.com/jobs/view/999888',
      description: 'AWS ECS, Lambda, Terraform expert.'
    }
  ];

  for (const job of mockJobs) {
    await processJobListing(job);
  }
  console.log('[Scraper] Simüle edilmiş arama ve veritabanı kayıt işlemi tamamlandı.');
}

// Run directly if called
const runDirectly = process.argv[1] && (process.argv[1].endsWith('scraperService.js') || process.argv[1].endsWith('scraperService'));
if (runDirectly) {
  runScraper({ mock: true })
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      await db.close();
      process.exit(1);
    });
}

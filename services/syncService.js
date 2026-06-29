import db from '../db/database.js';
import { config } from '../config/config.js';

export async function syncDatabaseToVercel() {
  const syncUrl = config.vercelSyncUrl;
  if (!syncUrl) {
    console.log('[Sistem] Vercel Dashboard Sync URL (.env) tanımlı değil. Senkronizasyon atlandı.');
    return;
  }

  console.log('[Sistem] Veritabanı Vercel ile senkronize ediliyor...');
  try {
    await db.connect();

    // 1. Fetch companies
    const companies = await db.all('SELECT * FROM companies ORDER BY created_at DESC');

    // 2. Fetch jobs
    const jobs = await db.all(`
      SELECT j.*, c.name as companyName 
      FROM jobs j 
      LEFT JOIN companies c ON j.company_id = c.id 
      ORDER BY j.created_at DESC
    `);

    // 3. Fetch outreach logs
    const outreachLogs = await db.all(`
      SELECT o.*, j.title as jobTitle, c.name as companyName
      FROM outreach_logs o
      LEFT JOIN jobs j ON o.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      ORDER BY o.sent_at DESC
    `);

    // 4. Send payload to Vercel
    const payload = {
      companies,
      jobs,
      outreachLogs,
      lastSyncedAt: new Date().toISOString()
    };

    const targetUrl = syncUrl.endsWith('/') ? `${syncUrl}api/sync` : `${syncUrl}/api/sync`;
    console.log(`[Sistem] Senkronizasyon hedefine istek gönderiliyor: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Hata! Statü: ${response.status}`);
    }

    console.log('[Sistem] Vercel Dashboard başarıyla senkronize edildi.');
  } catch (error) {
    console.error('[Sistem] Vercel senkronizasyon hatası:', error.message);
  }
}

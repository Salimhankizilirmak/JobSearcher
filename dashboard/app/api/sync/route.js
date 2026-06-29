import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate request structure
    if (!data.companies || !data.jobs || !data.outreachLogs) {
      return NextResponse.json({ error: 'Geçersiz senkronizasyon verisi.' }, { status: 400 });
    }

    // Save payload components directly to Vercel KV (Redis)
    await kv.set('novexis:companies', data.companies);
    await kv.set('novexis:jobs', data.jobs);
    await kv.set('novexis:outreachLogs', data.outreachLogs);
    await kv.set('novexis:lastSyncedAt', data.lastSyncedAt || new Date().toISOString());

    console.log('[API Sync] Veriler Vercel KV\'ye başarıyla yazıldı.');
    return NextResponse.json({ success: true, message: 'Senkronizasyon başarılı.' });
  } catch (error) {
    console.error('[API Sync] Senkronizasyon hatası:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const companies = await kv.get('novexis:companies') || [];
    const jobs = await kv.get('novexis:jobs') || [];
    const outreachLogs = await kv.get('novexis:outreachLogs') || [];
    const lastSyncedAt = await kv.get('novexis:lastSyncedAt') || null;

    return NextResponse.json({
      companies,
      jobs,
      outreachLogs,
      lastSyncedAt
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

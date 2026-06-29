import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.companies || !data.jobs || !data.outreachLogs) {
      return NextResponse.json({ error: 'Geçersiz senkronizasyon verisi.' }, { status: 400 });
    }

    // Save/Overwrite the JSON file in Vercel Blob with addRandomSuffix: false
    const blob = await put('novexis_state.json', JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false
    });

    console.log('[API Sync] Veriler Vercel Blob\'a başarıyla yazıldı:', blob.url);
    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('[API Sync] Senkronizasyon hatası:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // List blobs to locate novexis_state.json
    const { blobs } = await list();
    const stateBlob = blobs.find(b => b.pathname === 'novexis_state.json');

    if (!stateBlob) {
      console.log('[API Sync] Henüz senkronize edilmiş veri dosyası bulunamadı.');
      return NextResponse.json({
        companies: [],
        jobs: [],
        outreachLogs: [],
        lastSyncedAt: null
      });
    }

    // Fetch the JSON payload directly from the public blob URL
    const response = await fetch(stateBlob.url);
    if (!response.ok) {
      throw new Error(`Blob içeriği okunamadı. HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Sync] Veri çekme hatası:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

const BLOB_FILENAME = 'novexis_state.json';

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.companies || !data.jobs || !data.outreachLogs) {
      return NextResponse.json({ error: 'Geçersiz senkronizasyon verisi.' }, { status: 400 });
    }

    // Overwrite novexis_state.json in Vercel Blob
    const blob = await put(BLOB_FILENAME, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
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
    // List blobs to find the correct, Vercel-generated URL of novexis_state.json
    const { blobs } = await list();
    const stateBlob = blobs.find(b => b.pathname === BLOB_FILENAME);

    if (!stateBlob || !stateBlob.url) {
      console.log('[API Sync] Blob dosyası henüz oluşturulmamış.');
      return NextResponse.json({
        companies: [],
        jobs: [],
        outreachLogs: [],
        lastSyncedAt: null
      });
    }

    // Fetch the JSON payload directly from the public blob URL with cache busting
    const response = await fetch(`${stateBlob.url}?t=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Blob içeriği okunamadı. HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Sync] Veri çekme hatası:', error.message);
    return NextResponse.json({
      companies: [],
      jobs: [],
      outreachLogs: [],
      lastSyncedAt: null
    });
  }
}

import { put, head } from '@vercel/blob';
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
    // Use head() to directly get the blob metadata and public URL without listing
    const blobMeta = await head(BLOB_FILENAME);

    if (!blobMeta || !blobMeta.url) {
      console.log('[API Sync] Blob dosyası henüz oluşturulmamış.');
      return NextResponse.json({
        companies: [],
        jobs: [],
        outreachLogs: [],
        lastSyncedAt: null
      });
    }

    // Fetch the JSON payload directly from the public blob URL with cache busting
    const response = await fetch(`${blobMeta.url}?t=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Blob içeriği okunamadı. HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Sync] Veri çekme hatası:', error.message);
    // Return empty state instead of error so frontend doesn't fall to mock
    return NextResponse.json({
      companies: [],
      jobs: [],
      outreachLogs: [],
      lastSyncedAt: null
    });
  }
}

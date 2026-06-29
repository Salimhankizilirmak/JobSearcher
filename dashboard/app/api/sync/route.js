import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

// Store the blob's public URL in memory for the lifetime of the serverless instance
// (as a fallback when head() is not available)
let cachedBlobUrl = null;
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

    // Cache the public URL for subsequent GET requests
    cachedBlobUrl = blob.url;

    console.log('[API Sync] Veriler Vercel Blob\'a başarıyla yazıldı:', blob.url);
    // Return the public URL so the frontend can fetch directly
    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('[API Sync] Senkronizasyon hatası:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Try to construct the public blob URL directly - Vercel Blob uses a predictable URL pattern
    // Format: https://<store-id>.public.blob.vercel-storage.com/<filename>
    // We get the store domain from env or from cached URL
    let blobUrl = cachedBlobUrl;

    // If no cached URL, try to build it from BLOB_READ_WRITE_TOKEN (contains store name)
    if (!blobUrl) {
      const token = process.env.BLOB_READ_WRITE_TOKEN || '';
      // token format: vercel_blob_rw_<storeId>_<secret>
      const match = token.match(/vercel_blob_rw_([^_]+)_/);
      if (match) {
        const storeId = match[1].toLowerCase();
        blobUrl = `https://${storeId}.public.blob.vercel-storage.com/${BLOB_FILENAME}`;
      }
    }

    if (!blobUrl) {
      console.log('[API Sync] Blob URL henüz belirlenmedi, boş veri döndürülüyor.');
      return NextResponse.json({
        companies: [],
        jobs: [],
        outreachLogs: [],
        lastSyncedAt: null
      });
    }

    // Fetch the JSON payload directly from the public blob URL with cache busting
    const response = await fetch(`${blobUrl}?t=${Date.now()}`, {
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

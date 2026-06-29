import { config } from '../config/config.js';

/**
 * Clearbit Autocomplete API to find company domain
 */
export async function discoverCompanyDomain(companyName) {
  console.log(`[Domain Keşfi] Şirket domaini sorgulanıyor: ${companyName}`);
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Clearbit Autocomplete HTTP error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.length > 0 && data[0].domain) {
      console.log(`[Domain Keşfi] Domain bulundu: ${data[0].domain}`);
      return data[0].domain;
    }
  } catch (error) {
    console.error(`[Domain Keşfi] Clearbit hatası: ${error.message}`);
  }

  // Fallback domain normalization
  const fallbackDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  console.log(`[Domain Keşfi] Clearbit sonuç bulamadı. Fallback üretiliyor: ${fallbackDomain}`);
  return fallbackDomain;
}

/**
 * Hunter.io Domain Search API
 */
export async function searchHunterAPI(domain) {
  const apiKey = config.hunter.apiKey;
  if (!apiKey || apiKey.includes('replace_me')) {
    console.log(`[Hunter.io] Hunter API Key tanımlı değil, mock moduna geçiliyor.`);
    return null;
  }

  console.log(`[Hunter.io] E-posta sorgusu yapılıyor: ${domain}`);
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Hunter API HTTP error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.data && data.data.emails && data.data.emails.length > 0) {
      const emails = data.data.emails;

      // Filter for technical decision makers
      const techKeywords = ['cto', 'engineering', 'technical', 'developer', 'architect', 'teknoloji', 'yazılım'];
      const techEmails = emails.filter(e => {
        const position = (e.position || '').toLowerCase();
        return techKeywords.some(kw => position.includes(kw));
      });

      if (techEmails.length > 0) {
        console.log(`[Hunter.io] Karar verici teknik e-posta bulundu: ${techEmails[0].value} (${techEmails[0].position})`);
        return techEmails[0].value;
      }

      // Filter for fallback (HR or jobs)
      const hrEmails = emails.filter(e => e.value.startsWith('hr@') || e.value.startsWith('jobs@') || e.value.startsWith('insankaynaklari@'));
      if (hrEmails.length > 0) {
        console.log(`[Hunter.io] İK e-postası bulundu: ${hrEmails[0].value}`);
        return hrEmails[0].value;
      }

      console.log(`[Hunter.io] Teknik veya İK e-postası bulunamadı. İlk dönen adres seçiliyor: ${emails[0].value}`);
      return emails[0].value;
    }
  } catch (error) {
    console.error(`[Hunter.io] Hunter API Hatası: ${error.message}`);
  }

  return null;
}

/**
 * Scrapes company contact page for emails using shared Puppeteer page instance
 */
export async function scrapeFallbackContactPage(domain, page) {
  if (!page) {
    console.log(`[Scraper Fallback] Aktif tarayıcı sayfası paslanmadı. Kazıma atlanıyor.`);
    return null;
  }

  console.log(`[Scraper Fallback] Hunter sonuç vermedi. Web kazıma başlatılıyor: ${domain}`);
  const contactPaths = ['/iletisim', '/contact', '/kariyer', '/about'];
  
  for (const path of contactPaths) {
    const url = `http://${domain}${path}`;
    try {
      console.log(`[Scraper Fallback] Sayfa taranıyor: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      
      const pageContent = await page.content();
      // Regex to extract emails
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const foundEmails = pageContent.match(emailRegex);

      if (foundEmails && foundEmails.length > 0) {
        // Filter out typical noise and placeholder emails (example.com, johndoe, john.doe, test@, sample@, email@)
        const validEmails = foundEmails.filter(email => {
          const lower = email.toLowerCase();
          const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp');
          const isBlacklisted = lower.includes('example.com') || 
                                lower.includes('johndoe') || 
                                lower.includes('john.doe') || 
                                lower.includes('test@') || 
                                lower.includes('sample@') || 
                                lower.includes('email@');
          return !isImage && !isBlacklisted;
        });

        if (validEmails.length > 0) {
          // De-duplicate array
          const uniqueEmails = [...new Set(validEmails)];
          console.log(`[Scraper Fallback] Kazıma ile e-posta bulundu: ${uniqueEmails[0]}`);
          return uniqueEmails[0];
        }
      }
    } catch (error) {
      console.log(`[Scraper Fallback] ${url} taranırken hata: ${error.message}`);
    }
  }

  // Final fallback
  console.log(`[Scraper Fallback] Hiçbir e-posta bulunamadı.`);
  return null;
}

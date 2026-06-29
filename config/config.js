import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  dbPath: path.resolve(__dirname, '../db/novexis_crm.db'),
  projectDir: path.resolve(__dirname, '..'),
  vercelSyncUrl: process.env.VERCEL_SYNC_URL || '',
  linkedin: {
    liAt: process.env.LINKEDIN_LI_AT || '',
    userAgent: process.env.LINKEDIN_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    keywords: (process.env.SCRAPING_KEYWORDS || 'Node.js,AWS,Next.js').split(','),
  },
  hunter: {
    apiKey: process.env.HUNTER_API_KEY || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'outreach@novexis.com',
  },
  SELECTORS: {
    linkedin: {
      jobCard: '.jobs-search-results__list-item, .job-card-container, .jobs-search__results-list > li, .base-search-card',
      title: '.job-card-list__title, .job-card-container__link, .base-search-card__title',
      company: '.job-card-container__company-name, .job-card-container__primary-description, .base-search-card__subtitle',
      description: '.jobs-description__content, .jobs-box__html-content',
      url: 'a.job-card-list__title, a.job-card-container__link, a.base-card__full-link',
    }
  }
};

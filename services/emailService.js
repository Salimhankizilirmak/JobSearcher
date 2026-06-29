import nodemailer from 'nodemailer';
import db from '../db/database.js';
import { config } from '../config/config.js';

// Transporter Initialization
// Fallback to a mock transporter if SMTP info is placeholder or missing
function getTransporter() {
  const { host, port, user, pass } = config.smtp;
  if (!user || user.includes('replace_me') || user.includes('sample') || !pass || pass.includes('replace_me') || pass.includes('sample')) {
    console.log('[SMTP] E-posta göndermek için mock transporter yapılandırıldı.');
    return {
      sendMail: async (mailOptions) => {
        console.log(`[SMTP MOCK SEND] Gönderen: ${mailOptions.from}`);
        console.log(`[SMTP MOCK SEND] Alıcı: ${mailOptions.to}`);
        console.log(`[SMTP MOCK SEND] Konu: ${mailOptions.subject}`);
        console.log(`[SMTP MOCK SEND] İçerik: \n${mailOptions.text}\n`);
        return { messageId: 'mock-id-12345' };
      }
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

const transporter = getTransporter();

// Helper sleep function for anti-spam delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detect language based on job description content
 */
function detectLanguage(description) {
  const trChars = /[ışğüöçİŞĞÜÖÇ]/;
  const trKeywords = ['aranıyor', 'deneyim', 'tecrübe', 'gereksinim', 'iş tanımı', 'aday'];
  const descLower = description.toLowerCase();
  
  if (trChars.test(description) || trKeywords.some(kw => descLower.includes(kw))) {
    return 'TR';
  }
  return 'EN';
}

/**
 * Determine dynamic pitch project and content based on job description
 */
function getPitchContent(description, language, companyName) {
  const descLower = description.toLowerCase();
  const cName = companyName || 'Teknik Ekip';
  
  const socialProofTr = "Novexis Tech olarak sadece bulut mimarileri geliştirmekle kalmıyor; halihazırda Çorum OSB'de aktif olarak 6'dan fazla büyük kurumsal firmaya ve 20'den fazla işletmeye uçtan uca teknoloji, üretim takip ve yazılım altyapısı hizmeti sağlıyoruz.";
  const socialProofEn = "At Novexis Tech, we don't just write code; we actively manage end-to-end technology, production-line tracking, and software infrastructure for over 6 large corporate enterprises and more than 20 businesses within the Çorum Organized Industrial Zone.";

  if (descLower.includes('aws') || descLower.includes('lambda') || descLower.includes('cloud')) {
    return {
      project: 'AmplifyApp',
      subject: language === 'TR' 
        ? `${cName} Mühendislik Backlog'u // Hazır Kıta Node.js & AWS Destek Ekibi` 
        : `${cName} Engineering Backlog // On-Demand Node.js & AWS Support Team`,
      body: language === 'TR'
        ? `Merhaba Teknik Ekip Lideri,\n\n${cName} bünyesinde açmış olduğunuz AWS ve Lambda odaklı backend ilanınızı doğrudan radarımıza aldık. Bu alanda kıdemli mühendis bulmanın ve onboard etmenin operasyonel hızınızı ne kadar yavaşlattığının farkındayız. Özellikle AWS Lambda üzerinde Layer mimarisini kurmanın, Cognito entegrasyonunun ve DynamoDB bağlantı limitlerini (concurrency) doğru yönetmenin canlıya çıkış sürelerini ne kadar tıkadığını çok iyi biliyoruz.\n\nNovexis Technology olarak, tam da bu sancıyı çözmek için şirketlere hazır kıta yazılım podları (Tech Pods) sağlıyoruz. En son devreye aldığımız ve tamamen serverless mimariyle geliştirdiğimiz 'AmplifyApp' projemizde, AWS Lambda Layers, DynamoDB ve Cognito katmanlarını cold-start optimizasyonlu olarak uçtan uca başarıyla yönettik.\n\n${socialProofTr}\n\nİlanı açmanıza sebep olan teknik darboğazları hafifletmek ve ürün teslim hızınızı artırmak adına önümüzdeki hafta 10 dakikalık kısa bir teknik tanışma toplantısı organize edebilir miyiz?\n\nSaygılarımla,\nSalimhan Kızılırmak - Kurucu Ortak, Novexis Tech`
        : `Hello Tech Lead,\n\nWe have directly put your AWS and Lambda focused backend job listing at ${cName} on our radar. We understand how finding and onboarding senior engineers in this domain slows down your operational velocity. We know very well how setting up Layer architecture on AWS Lambda, Cognito integration, and properly managing DynamoDB concurrency limits can bottleneck release times.\n\nAt Novexis Technology, we provide on-demand software pods (Tech Pods) specifically to resolve this pain point. In our latest serverless-based 'AmplifyApp' project, we successfully managed AWS Lambda Layers, DynamoDB, and Cognito layers with cold-start optimization from end to end.\n\n${socialProofEn}\n\nTo alleviate the technical bottlenecks causing you to open this position and speed up your product delivery, could we organize a brief 10-minute technical introduction call next week?\n\nBest regards,\nSalimhan Kızılırmak - Co-Founder, Novexis Tech`
    };
  } else if (descLower.includes('saas') || descLower.includes('database') || descLower.includes('veritabanı') || descLower.includes('clerk') || descLower.includes('turso')) {
    return {
      project: 'Leadnova',
      subject: language === 'TR'
        ? `${cName} SaaS Altyapı Optimizasyonu // Hazır Kıta Database & Auth Desteği`
        : `${cName} SaaS Infrastructure Optimization // On-Demand Database & Auth Support`,
      body: language === 'TR'
        ? `Merhaba Teknik Ekip Lideri,\n\n${cName} bünyesinde açmış olduğunuz SaaS ve veritabanı odaklı backend ilanınızı ilgiyle inceledik. Modern SaaS mimarilerinde veri tabanı ölçeklenebilirliği, çoklu kiracılık (multi-tenancy) yönetimi ve güvenli kimlik doğrulama adımlarının kurulmasının geliştirme takvimlerini ne kadar sıkıştırdığının farkındayız. Özellikle Turso gibi distributed veritabanları ve Clerk gibi modern auth servislerinin entegrasyon süreçlerindeki ince detayların hızınızı kesebileceğini çok iyi biliyoruz.\n\nNovexis Technology olarak, bu tür karmaşık altyapı ihtiyaçlarınızı çözmek için hazır kıta yazılım podları sunuyoruz. Geliştirdiğimiz 'Leadnova' projemizde, Turso ve Clerk altyapılarını kullanarak connection pooling limitlerini optimize ettik ve güvenli, son derece hızlı bir SaaS veritabanı mimarisi inşa ettik.\n\n${socialProofTr}\n\nİlanı açmanıza sebep olan teknik zorlukları aşmak ve ürününüzü pazara sunma hızınızı artırmak adına önümüzdeki hafta 10 dakikalık kısa bir teknik tanışma toplantısı organize edebilir miyiz?\n\nSaygılarımla,\nSalimhan Kızılırmak - Kurucu Ortak, Novexis Tech`
        : `Hello Tech Lead,\n\nWe have reviewed your SaaS and database focused backend job listing at ${cName} with great interest. We understand how database scalability, multi-tenancy management, and setting up secure authentication flows compress development timelines in modern SaaS architectures. We know very well that detailed integration nuances of distributed databases like Turso and modern auth services like Clerk can slow you down.\n\nAt Novexis Technology, we offer on-demand software pods to handle these complex infrastructure needs. In our 'Leadnova' project, we utilized Turso and Clerk architectures, optimized connection pooling limits, and built a secure, high-performance SaaS database blueprint.\n\n${socialProofEn}\n\nTo help overcome the technical challenges behind this opening and accelerate your time-to-market, could we schedule a brief 10-minute technical introduction call next week?\n\nBest regards,\nSalimhan Kızılırmak - Co-Founder, Novexis Tech`
    };
  } else {
    return {
      project: 'Lavaş Trace',
      subject: language === 'TR'
        ? `${cName} Backend Darboğazları İçin // Hazır Kıta Node.js & MySQL Destek Ekibi`
        : `${cName} Backend Bottleneck Solutions // On-Demand Node.js & MySQL Support`,
      body: language === 'TR'
        ? `Merhaba Teknik Ekip Lideri,\n\n${cName} bünyesinde açmış olduğunuz backend ilanınızı doğrudan radarımıza aldık. Node.js mimarilerinde performans optimizasyonu sağlamanın, MySQL sorgularını iyileştirmenin, connection pooling yönetiminin ve IIS sunucu ortamlarında stabiliteyi korumanın teknik ekipler için operasyonel bir yük oluşturabildiğinin farkındayız.\n\nNovexis Technology olarak, şirketlerin backend geliştirme süreçlerini hızlandırmak için hazır kıta yazılım podları (Tech Pods) sağlıyoruz. Kendi geliştirdiğimiz ve canlıda yüksek trafik altında test ettiğimiz 'Lavaş Trace' projemizde, Node.js ve MySQL tabanlı modern mimarileri IIS entegrasyonu ile sıfır kesinti ve maksimum performansla yönettik.\n\n${socialProofTr}\n\nİlanı açmanıza sebep olan teknik darboğazları hafifletmek ve geliştirme hızınızı artırmak adına önümüzdeki hafta 10 dakikalık kısa bir teknik tanışma toplantısı organize edebilir miyiz?\n\nSaygılarımla,\nSalimhan Kızılırmak - Kurucu Ortak, Novexis Tech`
        : `Hello Tech Lead,\n\nWe have put your backend developer job listing at ${cName} on our radar. We understand that performance optimization in Node.js, query tuning in MySQL, connection pooling management, and keeping stability in IIS environments can pose operational overhead for engineering teams.\n\nAt Novexis Technology, we provide companies with on-demand software pods (Tech Pods) to speed up backend development. In our 'Lavaş Trace' project, which we developed and tested under heavy live traffic, we successfully managed Node.js and MySQL architectures combined with IIS integration for zero downtime and maximum performance.\n\n${socialProofEn}\n\nTo help mitigate the technical bottlenecks behind this opening and increase your development velocity, could we organize a short 10-minute technical introduction call next week?\n\nBest regards,\nSalimhan Kızılırmak - Co-Founder, Novexis Tech`
    };
  }
}

/**
 * Send outreach email and report to Salimhan
 */
export async function sendOutreachEmail(job, companyEmail) {
  const language = detectLanguage(job.description || '');
  const pitch = getPitchContent(job.description || '', language, job.companyName);
  
  // 1. Anti-Spam delay: sleep for 5 to 10 seconds randomly
  const delayMs = Math.floor(Math.random() * 5000) + 5000;
  console.log(`[SMTP] Anti-spam koruması devrede. ${delayMs / 1000} saniye bekleniyor...`);
  await sleep(delayMs);

  console.log(`[SMTP] E-posta gönderiliyor: ${companyEmail} (${pitch.project} - ${language})`);

  // 2. Send main outreach email
  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: companyEmail,
    subject: pitch.subject,
    text: pitch.body,
  });

  // 3. Send report email to Salimhan
  const salimhanEmail = 'salimhankizil@gmail.com';
  const reportSubject = `[Outreach Raporu] ${job.title} - ${pitch.project}`;
  const reportBody = `
Salimhan Merhaba,
Yeni bir B2B outreach e-postası başarıyla gönderildi.

İşlem Detayları:
- Firma Adı: ${job.companyName || 'Bilinmeyen Firma'}
- İlan Başlığı: ${job.title}
- Alıcı: ${companyEmail}
- Gönderilen Proje: ${pitch.project}
- Dil: ${language}
- E-posta Konusu: ${pitch.subject}
- E-posta Gövdesi:
---
${pitch.body}
---
Bu işlem veritabanına kaydedildi.
  `;

  console.log(`[SMTP] Salimhan Kızılırmak'a rapor e-postası gönderiliyor...`);
  await transporter.sendMail({
    from: config.smtp.from,
    to: salimhanEmail,
    subject: reportSubject,
    text: reportBody,
  });

  // 4. Log outreach to SQLite
  await db.run(
    `INSERT INTO outreach_logs (job_id, email_sent_to, pitch_body, status, sent_at) 
     VALUES (?, ?, ?, 'Sent', CURRENT_TIMESTAMP)`,
    [job.id, companyEmail, pitch.body]
  );

  // 5. Update Job status
  await db.run(
    `UPDATE jobs SET status = 'Iletisim Kuruldu' WHERE id = ?`,
    [job.id]
  );

  console.log(`[Veritabanı] E-posta günlüğü kaydedildi ve ilan durumu güncellendi: ${job.title}`);
}

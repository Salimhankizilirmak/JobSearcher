import './globals.css';

export const metadata = {
  title: 'Novexis B2B Satış Motoru',
  description: 'Novexis Tech B2B Hot-Lead Outreach Engine Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

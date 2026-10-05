import type { Metadata } from 'next';
import { Spectral, Albert_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';

const spectral = Spectral({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

const albertSans = Albert_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-albert',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Legal Document RAG Assistant | Hệ thống Trợ lý Căn cứ Pháp lý',
  description:
    'Hệ thống tiếp nhận, bóc tách thứ bậc quy phạm pháp luật Việt Nam, truy xuất lai hybrid pgvector và thẩm định trích dẫn căn cứ xác thực.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`h-full ${spectral.variable} ${albertSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full flex bg-[#FAF8F5] text-[#141A24] antialiased overflow-hidden font-sans selection:bg-[#C59B27]/20 selection:text-[#0B0F17]">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-[#FAF8F5]">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

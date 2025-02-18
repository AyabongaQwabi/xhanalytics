import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Facebook Analytics',
  description: 'Analytics dashboard for Facebook page data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold">
                  Facebook Analytics
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Posts
                </Link>
                <Link
                  href="/videos"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Videos
                </Link>
                <Link
                  href="/followers"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Followers
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
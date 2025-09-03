import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMMC Gap Analysis Tool',
  description: 'Consultant-led CMMC compliance assessment platform',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
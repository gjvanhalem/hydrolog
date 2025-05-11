import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/Navigation';
import Script from 'next/script';

//export const metadata: Metadata = {
//  title: 'HydroLog',
//  description: 'Monitor and manage your hydroponic garden',
//};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Navigation />
          {children}
        </div>
        <Script id="performance-monitoring" strategy="afterInteractive">
          {`
            window.addEventListener('load', () => {
              import('/lib/performance').then(({ performanceMonitor }) => {
                // Performance monitoring is initialized automatically
              });
            });
          `}
        </Script>
      </body>
    </html>
  );
}

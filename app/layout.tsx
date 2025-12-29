import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Wishlist para Parejas',
  description: 'Crea y comparte tu lista de deseos con tu pareja',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          <div className="relative min-h-screen">
            {/* Language Switcher - Fixed position top right */}
            <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
              <LanguageSwitcher />
            </div>
            {children}
          </div>
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  )
}

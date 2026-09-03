import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import AccountMenu from '@/components/AccountMenu'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import NativeInit from '@/components/NativeInit'

export const metadata: Metadata = {
  title: "How's the Field?",
  description: 'Know before you go — field conditions, amenities, and parent tips for softball & baseball complexes.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  themeColor: '#1D4ED8',
  // Lets iOS extend content edge-to-edge under the notch/home indicator so the
  // safe-area-inset-* CSS vars above actually pick up real values.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-green-50 min-h-screen">
        <AuthProvider>
          <NativeInit />
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-2 shrink-0">
                <Logo size={28} />
                <span className="font-bold text-gray-900 text-lg">How&apos;s the Field?</span>
              </a>
              <div className="flex items-center gap-4">
                <Link href="/reviewers" className="text-sm text-gray-500 hover:text-gray-800">
                  Reviewers
                </Link>
                <AccountMenu />
              </div>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}

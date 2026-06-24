import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "How's the Field?",
  description: 'Know before you go — field conditions, amenities, and parent tips for softball & baseball complexes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚾</span>
              <span className="font-bold text-gray-900 text-lg">How&apos;s the Field?</span>
            </a>
            <span className="text-sm text-gray-500">Central Florida</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}

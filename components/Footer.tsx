import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-gray-200 bg-white mt-12">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <span>&copy; {year} How&apos;s the Field?. All rights reserved.</span>
        <nav className="flex items-center gap-4">
          <Link href="/faq" className="hover:text-gray-800">FAQ</Link>
          <Link href="/terms" className="hover:text-gray-800">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-800">Privacy Policy</Link>
        </nav>
      </div>
    </footer>
  )
}

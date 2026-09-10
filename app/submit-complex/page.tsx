import Link from 'next/link'
import SubmitComplexForm from '@/components/SubmitComplexForm'

export const metadata = {
  title: "Add a Complex | How's the Field?",
}

export default function SubmitComplexPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add a Complex</h1>
        <p className="text-gray-500 text-sm mt-1">
          Don&apos;t see your complex listed? Add it below and we&apos;ll review it before it goes live.
        </p>
      </div>

      <SubmitComplexForm />

      <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">← Back to search</Link>
    </div>
  )
}

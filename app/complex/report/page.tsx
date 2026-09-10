'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, FieldComplex } from '@/lib/supabase'
import ReportIssueForm from '@/components/ReportIssueForm'

function ReportIssueInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [complex, setComplex] = useState<FieldComplex | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    supabase
      .from('field_complexes')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setComplex(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>
  if (!complex) return <div className="text-center py-16 text-gray-400">Complex not found.</div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href={`/complex?id=${complex.id}`} className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to {complex.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
        <p className="text-gray-500 text-sm mt-1">
          See something wrong on this listing? Let us know and we&apos;ll take a look.
        </p>
      </div>

      <ReportIssueForm complexId={complex.id} complexName={complex.name} />
    </div>
  )
}

export default function ReportIssuePage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading…</div>}>
      <ReportIssueInner />
    </Suspense>
  )
}

import Link from 'next/link'

export const metadata = {
  title: "FAQ | How's the Field?",
}

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is How's the Field?",
    a: "It's a crowd-sourced directory of youth sports complexes — softball, baseball, soccer, and flag football — with real reports on field condition, bathrooms, concessions, parking, and shade, so you know what to expect before you load the car.",
  },
  {
    q: 'Is it free to use?',
    a: 'Yes. Browsing complexes and reading reviews is free and doesn’t require an account. You need a free account to submit a review.',
  },
  {
    q: 'How do I submit a review?',
    a: 'Search for or open a complex’s page, sign in (or create a free account), and fill out the visit report form. You can rate bathrooms, concessions, shade, parking, water access, and more, plus leave a short note for other parents.',
  },
  {
    q: 'Can I submit a review anonymously?',
    a: 'Yes — there’s an anonymous toggle on the review form. Your display name won’t show next to the review, though it’s still tied to your account internally to help us prevent spam and abuse.',
  },
  {
    q: "A complex I use isn't listed. Can I add it?",
    a: 'Yes. Coaches can submit a new complex, which goes into a pending queue for admin review before it appears publicly. If you’re not able to submit one yet, email us the name, city, and sport and we’ll add it.',
  },
  {
    q: 'How accurate is the information?',
    a: 'Complex listings start from admin-curated data and are supplemented by crowd-sourced reviews, so accuracy can vary and conditions change over time. Always confirm details like address and field availability with the facility or event organizer before you go.',
  },
  {
    q: 'I found incorrect info — how do I report it?',
    a: (
      <>
        Email us at{' '}
        <a href="mailto:support@howsthefield.com" className="text-blue-600 hover:underline">
          support@howsthefield.com
        </a>{' '}
        with the complex name and what’s wrong, and we’ll take a look.
      </>
    ),
  },
  {
    q: 'Do you have an iOS or Android app?',
    a: 'The site works great in a mobile browser today. Native app availability may change — check back or follow our updates for the latest.',
  },
  {
    q: 'How do I delete my account?',
    a: (
      <>
        Email{' '}
        <a href="mailto:support@howsthefield.com" className="text-blue-600 hover:underline">
          support@howsthefield.com
        </a>{' '}
        from your account email and we’ll delete your account and personal information. See
        our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> for details.
      </>
    ),
  },
  {
    q: 'Who runs this?',
    a: 'How’s the Field? is an independent site built for parents and coaches. We’re not affiliated with any specific league, park district, or facility we list.',
  },
]

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Can&apos;t find your answer here? Email{' '}
          <a href="mailto:support@howsthefield.com" className="text-blue-600 hover:underline">
            support@howsthefield.com
          </a>.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 text-sm">{item.q}</h2>
            <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">← Back to search</Link>
    </div>
  )
}

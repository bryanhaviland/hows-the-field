import Link from 'next/link'

export const metadata = {
  title: "Privacy Policy | How's the Field?",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-gray-700 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-400 mt-1">Effective date: September 2, 2026</p>
      </div>

      <p>
        This Privacy Policy explains what information How&apos;s the Field? (&quot;we,&quot;
        &quot;us,&quot; &quot;our&quot;) collects through howsthefield.com and related apps
        (the &quot;Service&quot;), how we use it, and the choices you have.
      </p>

      <Section title="1. Information We Collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-medium text-gray-900">Account information:</span> email address and password (stored securely and hashed by our authentication provider), and any display name you set.</li>
          <li><span className="font-medium text-gray-900">Content you submit:</span> visit reports and ratings (field condition, bathrooms, concessions, shade, water access, etc.), optional free-text notes, and the visit date if you provide one.</li>
          <li><span className="font-medium text-gray-900">Usage data:</span> basic technical data like device/browser type and pages visited, used to keep the Service working and secure.</li>
        </ul>
        <p className="mt-2">
          We don&apos;t currently collect payment information — the Service is free to use.
        </p>
      </Section>

      <Section title="2. How We Use Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To operate the Service, including showing reviews and complex details to other users;</li>
          <li>To maintain your account and let you sign in;</li>
          <li>To detect abuse, spam, and fraudulent reviews;</li>
          <li>To communicate with you about your account (e.g., email confirmation); and</li>
          <li>To improve the Service.</li>
        </ul>
      </Section>

      <Section title="3. What Other Users See">
        <p>
          Your reviews are shown publicly alongside a complex&apos;s listing. If you submit a
          review anonymously, your display name is hidden from other users, but the review
          content itself is still public. We don&apos;t display your email address to other
          users.
        </p>
      </Section>

      <Section title="4. Sharing">
        <p>
          We don&apos;t sell your personal information. We share data only with service
          providers who help us run the Service under confidentiality obligations — currently
          Supabase, which hosts our database and handles authentication — or when required by
          law, to protect our rights, or in connection with a merger, acquisition, or sale of
          assets.
        </p>
      </Section>

      <Section title="5. Data Retention & Deletion">
        <p>
          We keep account and review data for as long as your account is active. You can
          request deletion of your account and associated personal information at any time by
          emailing us (below); some anonymized or aggregated review data may be retained to
          preserve the accuracy of complex listings.
        </p>
      </Section>

      <Section title="6. Cookies & Local Storage">
        <p>
          We use essential cookies/local storage to keep you signed in and remember basic
          preferences. We don&apos;t use third-party advertising trackers.
        </p>
      </Section>

      <Section title="7. Children's Privacy">
        <p>
          The Service is intended for parents, coaches, and other adults, and is not directed
          to children. We don&apos;t knowingly collect personal information from children
          under 13. If you believe a child has provided us personal information, contact us
          and we&apos;ll remove it.
        </p>
      </Section>

      <Section title="8. Your Rights">
        <p>
          Depending on where you live, you may have rights to access, correct, or delete your
          personal information, or to object to certain processing. To exercise these rights,
          email us at the address below.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be
          reflected by updating the effective date above.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions or requests about your data? Reach us at{' '}
          <a href="mailto:support@howsthefield.com" className="text-blue-600 hover:underline">
            support@howsthefield.com
          </a>.
        </p>
      </Section>

      <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
        This page is a general template and isn&apos;t legal advice. Consider having a lawyer
        review it — especially if you plan to collect more data types or operate in regions
        with specific privacy laws (e.g., GDPR, CCPA) — before relying on it.
      </p>

      <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">← Back to search</Link>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h2>
      {children}
    </div>
  )
}

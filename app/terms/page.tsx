import Link from 'next/link'

export const metadata = {
  title: "Terms of Service | How's the Field?",
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-gray-700 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-gray-400 mt-1">Effective date: September 2, 2026</p>
      </div>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of How&apos;s the Field?
        (&quot;How&apos;s the Field,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), including
        the website located at howsthefield.com and any related mobile apps (together, the
        &quot;Service&quot;). By creating an account or using the Service, you agree to these
        Terms. If you do not agree, please don&apos;t use the Service.
      </p>

      <Section title="1. What the Service Is">
        <p>
          How&apos;s the Field? is a crowd-sourced directory of youth sports field complexes
          (softball, baseball, soccer, flag football, and others). Registered users can submit
          visit reports rating things like field condition, bathrooms, concessions, parking,
          and shade, so other parents and coaches can know what to expect before they go.
        </p>
      </Section>

      <Section title="2. Accounts">
        <p>
          You need an account to submit a review. You&apos;re responsible for keeping your
          login credentials secure and for anything that happens under your account. You must
          be at least 18 years old, or the age of majority where you live, to create an
          account. Provide accurate information and don&apos;t impersonate anyone else.
        </p>
      </Section>

      <Section title="3. User-Submitted Content">
        <p>
          Anything you submit — reviews, ratings, notes, photos, or corrections
          (&quot;User Content&quot;) — is your responsibility. By submitting User Content you
          grant How&apos;s the Field? a non-exclusive, worldwide, royalty-free, perpetual
          license to host, display, reproduce, and distribute it as part of the Service
          (including in anonymized or aggregated form), even if you later delete your account.
          You represent that your User Content is honest, based on an actual visit or
          firsthand knowledge, and doesn&apos;t infringe anyone&apos;s rights or violate the law.
        </p>
        <p className="mt-2">
          You may choose to submit a review anonymously. Anonymous reviews still hide your
          display name from other users, but we retain the underlying account association
          internally for trust and abuse-prevention purposes.
        </p>
        <p className="mt-2">
          We may remove or edit User Content that violates these Terms, is spam, is abusive,
          or that we otherwise believe is inaccurate or inappropriate, though we&apos;re not
          obligated to monitor content and don&apos;t promise to catch everything.
        </p>
      </Section>

      <Section title="4. Acceptable Use">
        <p>Don&apos;t use the Service to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Post false, defamatory, harassing, or misleading reviews;</li>
          <li>Scrape, mine, or bulk-download data without our written permission;</li>
          <li>Interfere with or disrupt the Service, including through automated bots;</li>
          <li>Upload malicious code or attempt to gain unauthorized access to accounts or systems; or</li>
          <li>Use the Service for any unlawful purpose.</li>
        </ul>
      </Section>

      <Section title="5. No Warranty on Facility Information">
        <p>
          Complex and field information — including addresses, amenities, and conditions —
          comes from a mix of admin curation and crowd-sourced reports and can be outdated,
          incomplete, or wrong. How&apos;s the Field? does not own, operate, or inspect these
          facilities and makes no guarantee about their accuracy, safety, or current condition.
          Always confirm details with the facility or event organizer before you go, and use
          the Service at your own risk.
        </p>
      </Section>

      <Section title="6. Disclaimer of Warranties">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT
          WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DON&apos;T WARRANT THAT THE SERVICE WILL
          BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, HOW&apos;S THE FIELD? AND ITS OPERATORS WILL
          NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF DATA, ARISING FROM YOUR USE OF THE SERVICE OR RELIANCE ON
          ANY CONTENT IN IT. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS
          LIMITED TO $100.
        </p>
      </Section>

      <Section title="8. Termination">
        <p>
          You can stop using the Service and delete your account at any time. We may suspend
          or terminate accounts that violate these Terms or that we believe pose a risk to
          other users or the Service.
        </p>
      </Section>

      <Section title="9. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we&apos;ll
          update the effective date above. Continued use of the Service after changes take
          effect means you accept the updated Terms.
        </p>
      </Section>

      <Section title="10. Governing Law">
        <p>
          These Terms are governed by the laws of the State of Florida, without regard to
          conflict-of-law principles, unless applicable law requires otherwise.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these Terms? Reach us at{' '}
          <a href="mailto:support@howsthefield.com" className="text-blue-600 hover:underline">
            support@howsthefield.com
          </a>.
        </p>
      </Section>

      <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
        This page is a general template and isn&apos;t legal advice. Consider having a lawyer
        review it for your specific situation before relying on it.
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

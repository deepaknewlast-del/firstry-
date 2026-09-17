import type { ReactNode } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

/** Shared layout for the legal pages — set as a printed page, measured for reading. */
function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-16">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display text-4xl text-primary-700 mb-3">{title}</h1>
        <p className="text-sm text-ink-muted mb-8">Last updated {updated}</p>

        <div className="ornament mb-10" aria-hidden="true">
          <span className="text-xs">✦</span>
        </div>

        <div className="space-y-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-primary-700 [&_h2]:mb-3 [&_p]:text-ink-muted [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:space-y-2 [&_li]:text-ink-muted [&_li]:text-sm [&_a]:text-primary-600 [&_a]:underline">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="17 September 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          ChurchPress is operated by <strong>Deepak</strong>, an individual proprietor in India.
          This policy explains what ChurchPress collects, why, and what happens to it.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>
          When you create an account we store your email address and, if you provide it, your
          church name. When you generate a bulletin we store the details you entered — the service
          date and time, sermon title, scripture reference, announcements, prayer requests, and
          offering information — along with the content produced from them so you can find it again
          in your history.
        </p>
      </section>

      <section>
        <h2>Why we hold it</h2>
        <p>
          Solely to provide the service: to sign you in, to write your bulletin, to keep your past
          bulletins available to you, and to manage your subscription if you have one.
        </p>
      </section>

      <section>
        <h2>Who processes it</h2>
        <p>A small number of companies handle data on our behalf, each for one specific job:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — database, authentication, and file storage. Data is
            encrypted at rest, and row-level security means one church can never read another
            church&rsquo;s bulletins.
          </li>
          <li>
            <strong>Google (Gemini API)</strong> — drafts the bulletin wording from the details you
            enter.
          </li>
          <li>
            <strong>Paddle</strong> — our merchant of record for paid subscriptions. When you pay,
            Paddle processes your payment and is the seller of the subscription; card numbers never
            reach our servers. Paddle handles billing questions, invoices, and cancellation through
            its customer portal, and receives the account email you signed up with solely to link
            your payment to your ChurchPress account.{' '}
            <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">
              Paddle&rsquo;s own privacy policy
            </a>{' '}
            covers its use of your payment details.
          </li>
          <li>
            <strong>Resend</strong> — delivers account emails such as sign-in links and receipts.
          </li>
          <li>
            <strong>Upstash</strong> — rate limiting, so the service stays available.
          </li>
          <li>
            <strong>Cloudflare and Render</strong> — hosting for the website and the API.
          </li>
        </ul>
      </section>

      <section>
        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell or rent your data.</li>
          <li>
            We do not use your bulletins, prayer requests, or congregation details to train
            third-party models.
          </li>
          <li>We do not publish your bulletins anywhere. They are visible only to your account.</li>
          <li>
            We do not ask for giving records, member directories, or anything about the people in
            your congregation beyond the names you choose to type into a prayer request.
          </li>
        </ul>
      </section>

      <section>
        <h2>Prayer requests need care</h2>
        <p>
          A prayer request often contains health information about a real person. Only enter what
          you would be comfortable printing on the front of a bulletin, and please ask the person
          first where the situation is sensitive.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          Bulletins stay in your account until you delete them. Deleting a bulletin removes its
          content and its generated PDF. If you close your account, we delete your profile and
          bulletins; billing records are kept for as long as tax law requires.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can access, correct, export, or delete your information at any time, either from your
          account or by emailing us. If you are in the UK or EU, you also have the right to lodge a
          complaint with your data protection authority.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          ChurchPress is a tool for church staff and volunteers and is not directed at children
          under 16.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this policy changes in a way that affects you, we will email account holders before
          the change takes effect.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about privacy:{' '}
          <a href="mailto:hello@churchbulletin.in">hello@churchbulletin.in</a>. Write to Deepak,
          ChurchPress, India.
        </p>
      </section>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated="17 September 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          ChurchPress is operated by <strong>Deepak</strong>, an individual proprietor in India
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;). &ldquo;ChurchPress&rdquo; means this website at
          churchbulletin.in and the bulletin service it provides.
        </p>
        <p>
          Payments are handled by <strong>Paddle.com</strong>, which acts as our merchant of
          record and is the seller of the subscription for payment purposes. Paddle processes
          card payments, applies taxes where required, issues receipts and invoices, and runs the
          customer portal where you manage your subscription.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          ChurchPress helps you prepare weekly church communication: a bulletin, announcement slide
          content, social posts, and an email newsletter. The output is a draft for you to review
          and edit before it is printed, posted, or sent.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>
          You need an account to generate a bulletin. Keep your password to yourself; you are
          responsible for what happens under your account. One account is intended for one church.
        </p>
      </section>

      <section>
        <h2>Free tier and subscriptions</h2>
        <ul>
          <li>New accounts can generate three complete bulletins at no cost, with no card.</li>
          <li>
            After that, unlimited bulletins cost 15 US dollars per month, or the annual plan shown
            at checkout. Prices are shown in your local currency at checkout where Paddle supports
            it.
          </li>
          <li>
            Subscriptions renew automatically until cancelled. Billing is handled by Paddle as
            merchant of record; your card statement will show Paddle or ChurchPress.
          </li>
          <li>
            You can cancel at any time through the billing portal on your account page, or by
            emailing us. Cancelling stops future charges and keeps your access until the end of the
            period you have paid for.
          </li>
          <li>
            If a renewal payment fails, we may pause paid access until it succeeds; Paddle will
            retry the card automatically before that.
          </li>
        </ul>
      </section>

      <section>
        <h2>Refunds</h2>
        <p>
          If ChurchPress is not right for your church, email{' '}
          <a href="mailto:hello@churchbulletin.in">hello@churchbulletin.in</a> within 14 days of a
          payment and we will refund it in full — no forms, no questions. Refunds past 14 days are
          at our discretion. Cancelling alone does not refund the current period.
        </p>
      </section>

      <section>
        <h2>Your content stays yours</h2>
        <p>
          Everything you enter, and everything produced from it, belongs to your church. We claim
          no ownership over it and we do not publish it. You grant us only the permission needed to
          store it and to generate your bulletin.
        </p>
      </section>

      <section>
        <h2>You are responsible for what goes out</h2>
        <p>
          Read what you are about to print. Dates, times, names, and wording are yours to check.
          ChurchPress does not verify announcement details and cannot know your congregation&rsquo;s
          circumstances.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Please do not use ChurchPress to:</p>
        <ul>
          <li>generate unlawful, hateful, harassing, or sexually explicit material;</li>
          <li>impersonate another church, ministry, or person;</li>
          <li>resell the service or resell its output as a competing product;</li>
          <li>attempt to break, overload, or reverse-engineer the service.</li>
        </ul>
        <p>We may suspend an account that does.</p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          We aim to keep ChurchPress running, but we do not promise uninterrupted service. The
          service is provided as it is, without warranties beyond those the law does not allow us
          to exclude. Plan to have your bulletin ready before Sunday rather than on the way into
          the building.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          To the extent the law allows, our total liability to you for anything arising from the
          service is limited to the amount you paid us in the 12 months before the claim, or 20 US
          dollars if you have not paid. We are not liable for indirect or consequential losses,
          including the content of a bulletin you have printed or sent without reading it.
        </p>
      </section>

      <section>
        <h2>Ending the agreement</h2>
        <p>
          You may close your account whenever you wish. We may close an account that breaches these
          terms, and will tell you why. If we close your account without cause while a
          subscription is active, we refund the unused portion.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of India. The courts of India have exclusive
          jurisdiction over any dispute arising from them.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms; material changes will be emailed to account holders before
          they take effect.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Anything unclear about these terms:{' '}
          <a href="mailto:hello@churchbulletin.in">hello@churchbulletin.in</a>. Write to Deepak,
          ChurchPress, India.
        </p>
      </section>
    </LegalPage>
  )
}

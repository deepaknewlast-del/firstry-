import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Mail,
  Presentation,
  Share2,
  Star,
  Users,
} from 'lucide-react'
import { LogoMark } from '../components/brand/Logo'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

const DELIVERABLES = [
  {
    icon: BookOpen,
    title: 'The printed bulletin',
    desc: 'A print-ready letter or A4 bulletin — order of service, sermon notes, announcements, prayer list, and giving.',
  },
  {
    icon: Presentation,
    title: 'Announcement slides',
    desc: 'Pre-service slide content, written short enough to read from the back row.',
  },
  {
    icon: Share2,
    title: 'Social posts',
    desc: 'A Facebook post and an Instagram caption for the week, ready to schedule.',
  },
  {
    icon: Mail,
    title: 'The email',
    desc: 'Subject line, preview text, and a full newsletter for the people who could not be there.',
  },
]

const STEPS = [
  {
    icon: CalendarCheck,
    step: 'One',
    title: 'Tell us about the week',
    desc: 'Sermon title, the passage, your announcements, and who to pray for. About two minutes of typing.',
  },
  {
    icon: BookOpen,
    step: 'Two',
    title: 'Everything is written at once',
    desc: 'You get the bulletin, the slides, the posts, and the email together — each one written for its own place.',
  },
  {
    icon: Users,
    step: 'Three',
    title: 'Change anything, then print',
    desc: 'Edit a line or rewrite a paragraph. Nothing goes out until you say so.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'I used to spend two hours every Saturday night on the bulletin. Now it takes ten minutes, and it looks better than what I was making by hand.',
    name: 'Sandra W.',
    role: 'Church Secretary, First Baptist Church, Texas',
  },
  {
    quote:
      'Our volunteer who did the bulletin moved away and we were stuck. We had a finished one the same afternoon.',
    name: 'Deacon James T.',
    role: "St. Andrew's Presbyterian, Scotland",
  },
  {
    quote:
      'The email is what surprised me. Our people actually open it now because it reads like it came from the pastor, not a mail merge.',
    name: 'Pastor Mark H.',
    role: 'Grace Community Church, Ontario',
  },
]

/** Written to be quotable — these exact facts feed the FAQ schema in index.html. */
const FAQ = [
  {
    q: 'Is it really free to start?',
    a: 'Yes. You can make three complete bulletins without a card. After that it is $15 per month, and you can cancel at any time.',
  },
  {
    q: 'How long does one bulletin take?',
    a: 'Usually under a minute to fill in the form, then a short wait while everything is written. Most churches finish the whole week in one sitting.',
  },
  {
    q: 'What exactly do I get each week?',
    a: 'A print-ready PDF bulletin, the announcement slide content, a Facebook post and an Instagram caption, and a full email newsletter with a subject line and preview text.',
  },
  {
    q: 'Can I edit what it writes?',
    a: 'Yes — all of it is plain text you can change before anything goes out. Most churches adjust a name, a date, or a turn of phrase and then print.',
  },
  {
    q: 'What denominations does it suit?',
    a: 'Any Protestant church: Baptist, Methodist, Presbyterian, Pentecostal, Anglican, and non-denominational. You set the tone — warm and welcoming, formal and reverent, energetic and contemporary, or traditional — and the wording follows.',
  },
  {
    q: 'How is the content produced?',
    a: 'From the details you enter about your own service. ChurchPress drafts the wording for you, and every word is yours to review, edit, or throw away before it is published.',
  },
  {
    q: "Is my church's information kept private?",
    a: 'Yes. Your details live in an encrypted database, are never sold or shared, and are never used to train third-party models. You can delete any bulletin at any time.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      <main id="main-content">
        {/* ---------------- Hero ---------------- */}
        <section className="panel-deep relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 pt-20 pb-24 text-center">
            <div className="flex justify-center mb-7">
              <LogoMark size={78} title="" />
            </div>

            <p className="eyebrow-on-dark mb-5">For the local church</p>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white leading-[1.08] mb-6">
              The whole week&rsquo;s
              <br />
              <span className="text-gold-400">church communication</span>
              <br />
              in one sitting.
            </h1>

            <p className="text-lg md:text-xl text-primary-200 max-w-2xl mx-auto mb-10 leading-relaxed">
              Fill in one short form about Sunday. You get the printed bulletin, the announcement
              slides, your social posts, and the email to your congregation — written together,
              and yours to edit.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup" className="btn-gold gap-2">
                Start free — three bulletins
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/pricing"
                className="btn-secondary bg-transparent border-primary-200 text-primary-100 hover:bg-white/10 hover:border-white hover:text-white gap-2"
              >
                See pricing
              </Link>
            </div>

            <p className="text-sm text-primary-300 mt-6">
              No card required. $15/month after three bulletins. Cancel whenever you like.
            </p>
          </div>
        </section>

        {/* ---------------- Trust strip ---------------- */}
        <section className="border-y border-rule-light bg-parchment">
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-3 text-center">
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <CalendarCheck className="w-4 h-4 text-gold-500" aria-hidden="true" />
              A full week made in one sitting — around ten minutes, start to PDF
            </p>
            <p className="text-sm text-ink-muted">
              Baptist · Methodist · Presbyterian · Pentecostal · Anglican · Non-denominational
            </p>
          </div>
        </section>

        {/* ---------------- The problem ---------------- */}
        <section className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="eyebrow mb-4">Every single week</p>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-700 mb-6">
              Someone in your church is losing their Saturday to this.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed">
              Copy-pasting last week&rsquo;s document. Chasing down the youth leader for the right
              date. Rebuilding the same slide every seven days. Printing two hundred copies at
              eleven o&rsquo;clock at night.
            </p>
            <div className="ornament my-8" aria-hidden="true">
              <span className="text-xs">✦</span>
            </div>
            <p className="lede">
              ChurchPress gives that Saturday back — and hands you something you would be proud to
              put in someone&rsquo;s hand.
            </p>
          </div>
        </section>

        {/* ---------------- What you get ---------------- */}
        <section className="bg-parchment border-y border-rule-light py-20 sm:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-14">
              <p className="eyebrow mb-4">What you get</p>
              <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
                One form. Four finished pieces.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 stagger">
              {DELIVERABLES.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="card card-hover flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg bg-primary-50 border border-rule-strong flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}
                  >
                    <Icon className="w-5 h-5 text-primary-700" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-primary-800 mb-1.5">{title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- A sample bulletin ---------------- */}
        <section className="py-20 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="eyebrow mb-4">A sample</p>
              <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
                It comes out looking printed, not assembled.
              </h2>
            </div>

            {/* A real sheet of paper, sitting slightly above the page. */}
            <div className="card rounded-2xl p-8 sm:p-12" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(36,21,40,0.06), 0 22px 45px -18px rgba(36,21,40,0.3)' }}>
              <header className="text-center pb-5 mb-6 border-b border-rule-light">
                <p className="eyebrow mb-2">Grace Community Church</p>
                <h3 className="font-display text-2xl text-primary-700">
                  Sunday, September 21 — 10:00 AM
                </h3>
              </header>

              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <p className="label-caps mb-3">Order of Service</p>
                  <ul className="space-y-2 text-sm text-ink-muted">
                    {[
                      'Prelude & Welcome',
                      'Call to Worship',
                      'Congregational Worship',
                      'Scripture Reading — Psalm 46:10',
                      'Sermon: Walking in Quiet Confidence',
                      'Tithes & Offerings',
                      'Benediction',
                    ].map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <span className="text-gold-700" aria-hidden="true">
                          &bull;
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="label-caps mb-3">This Week</p>
                  <ul className="space-y-3 text-sm text-ink-muted">
                    <li>
                      <strong className="text-primary-800">Youth Group Bake Sale</strong> — Friday
                      at 6:00 PM in the fellowship hall.
                    </li>
                    <li>
                      <strong className="text-primary-800">Women&rsquo;s Bible Study</strong> —
                      resumes Tuesday at 7:00 PM. Newcomers welcome.
                    </li>
                    <li>
                      <strong className="text-primary-800">Welcome Lunch</strong> — next Sunday,
                      after the service.
                    </li>
                  </ul>
                </div>
              </div>

              <p className="font-display italic text-center text-primary-800 mt-8 pt-6 border-t border-rule-light">
                Go gently this week, church — the Lord who quiets storms goes with you.
              </p>
            </div>
            <p className="text-center text-sm text-ink-muted mt-5">
              A real bulletin, generated from a two-minute form.
            </p>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="bg-parchment border-y border-rule-light py-20 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-14">
              <p className="eyebrow mb-4">How it works</p>
              <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
                Three steps, once a week.
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 stagger">
              {STEPS.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div
                      className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center border border-primary-800/30"
                      style={{
                        boxShadow:
                          '0 1px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.2) inset, 0 4px 10px rgba(36,21,40,0.28)',
                      }}
                    >
                      <Icon className="w-6 h-6 text-gold-300" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="eyebrow mb-2">Step {step}</p>
                  <h3 className="font-display text-xl text-primary-800 mb-2">{title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Testimonials ---------------- */}
        <section className="py-20 sm:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-14">
              <p className="eyebrow mb-4">From the church office</p>
              <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
                The people who actually make the bulletin
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 stagger">
              {TESTIMONIALS.map(({ quote, name, role }) => (
                <figure key={name} className="card card-hover m-0 flex flex-col">
                  <div className="flex gap-1 mb-4" aria-label="Rated 5 out of 5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-gold-400 text-gold-500"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote className="font-display text-base text-primary-800 leading-relaxed mb-5 m-0 flex-1">
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3 pt-4 border-t border-rule-light">
                    <div className="avatar w-9 h-9 text-xs" aria-hidden="true">
                      {name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-primary-800">{name}</p>
                      <p className="text-xs text-ink-muted">{role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Pricing ---------------- */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <p className="eyebrow mb-4">Pricing</p>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
              One price, plainly stated.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 items-stretch">
            <div className="card flex flex-col">
              <p className="label-caps mb-2">Start</p>
              <p className="font-display text-4xl text-primary-800 mb-1">$0</p>
              <p className="text-sm text-ink-muted mb-6">Three bulletins. No card.</p>
              <ul className="space-y-2.5 text-sm text-ink-muted flex-1">
                <li>Three complete bulletins</li>
                <li>PDF download</li>
                <li>Slides, posts, and email copy</li>
              </ul>
              <Link to="/signup" className="btn-secondary w-full mt-7">
                Start free
              </Link>
            </div>

            <div className="card flex flex-col relative overflow-hidden">
              <span className="seal absolute top-5 right-5 text-[11px] tracking-wider px-3 py-1">
                MOST CHOSEN
              </span>
              <p className="label-caps mb-2">Every week</p>
              <p className="font-display text-4xl text-primary-800 mb-1">$15</p>
              <p className="text-sm text-ink-muted mb-6">per month, cancel anytime</p>
              <ul className="space-y-2.5 text-sm text-ink-muted flex-1">
                <li>Unlimited bulletins</li>
                <li>Every past bulletin kept</li>
                <li>All four pieces, every week</li>
                <li>Support from a real person</li>
              </ul>
              <Link to="/signup" className="btn-gold w-full mt-7">
                Start free, upgrade later
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="max-w-3xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <p className="eyebrow mb-4">Questions</p>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
              What churches ask us
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="card">
                <summary className="cursor-pointer font-display text-lg text-primary-800 flex items-center justify-between gap-3 list-none rounded-md">
                  {q}
                  <span
                    className="text-gold-600 text-xl leading-none flex-shrink-0 select-none"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="text-sm text-ink-muted leading-relaxed mt-3">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- Closing CTA ---------------- */}
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="panel-deep rounded-3xl px-6 py-16 text-center shadow-panel-lg">
            <div className="flex justify-center mb-6">
              <LogoMark size={56} title="" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              Get your Saturday back this week.
            </h2>
            <p className="text-primary-200 mb-9 max-w-xl mx-auto">
              Three bulletins free. No card, no setup, no training. If it does not save you an
              evening, you have lost nothing.
            </p>
            <Link to="/signup" className="btn-gold gap-2">
              Create your first bulletin
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

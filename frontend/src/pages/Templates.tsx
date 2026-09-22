/**
 * The public template gallery — churchbulletin.in/templates
 *
 * Two jobs. It is the page that can realistically rank, because it answers the
 * search a church actually types ("church bulletin template", "free church
 * bulletin template") with the thing they want rather than with marketing copy.
 * And it is proof: every sample is real output from the same generator the app
 * runs, one per tone, downloadable as a print-ready PDF with no signup.
 *
 * The PDFs and preview images are produced by backend/tools/make_samples.py —
 * run it again if the design changes, otherwise the gallery drifts from the
 * product.
 */
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Download } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

/** The rasterized Letter page: 1200px wide at ~150dpi keeps the ratio exact. */
const PAGE = { width: 1200, height: 1553 }

interface TemplateSample {
  key: string
  tone: string
  sampleChurch: string
  service: string
  suits: string
  art: string
  alt: string
  insideAlt: string
}

const TEMPLATES: TemplateSample[] = [
  {
    key: 'warm',
    tone: 'Warm and welcoming',
    sampleChurch: 'Grace Community Church',
    service: 'Sunday, 27 September 2026 · 10:30 AM',
    suits:
      'Family services, community churches, and congregations where a lot of the room is visiting for the first time.',
    art: 'A cream and gold palette with script lettering over an open Bible on a wooden table.',
    alt: 'Warm and welcoming church bulletin template — Grace Community Church in gold script over artwork of an open Bible',
    insideAlt:
      'Inside spread of the warm church bulletin template, showing the order of worship, sermon notes, announcements, prayer list and giving',
  },
  {
    key: 'traditional',
    tone: 'Traditional',
    sampleChurch: "St. Andrew's Reformed Church",
    service: 'Sunday, 27 September 2026 · 9:00 AM',
    suits:
      'Established congregations with a set liturgy — psalm singing, the Lord’s Day, the Lord’s Supper, a printed order of service.',
    art: 'Deep navy ground with Cinzel lettering and one of the psalms set as the cover verse.',
    alt: 'Traditional church bulletin template — St. Andrew’s Reformed Church, navy cover with gold Cinzel lettering',
    insideAlt:
      'Inside spread of the traditional church bulletin template with hymns, readings, congregational prayer and the benediction',
  },
  {
    key: 'formal',
    tone: 'Formal and reverent',
    sampleChurch: 'Church of the Resurrection',
    service: 'Sunday, 27 September 2026 · 11:00 AM',
    suits:
      'Anglican, Episcopal and high-church services: introit, processional, collect, anthem, prayers of the people.',
    art: 'A deep aubergine ground, a cross ornament at the corners, and a choral order of service.',
    alt: 'Formal and reverent church bulletin template — Church of the Resurrection with a cross ornament and processional order of service',
    insideAlt:
      'Inside spread of the formal church bulletin template, listing the introit, readings, anthem and prayers of the people',
  },
  {
    key: 'contemporary',
    tone: 'Energetic and contemporary',
    sampleChurch: 'Riverbend Church',
    service: 'Sunday, 27 September 2026 · 10:00 AM',
    suits:
      'Modern worship, church plants and younger congregations — worship set, announcement video, next steps, serve teams.',
    art: 'Clean sans-serif type on a dark ground, with the service written the way the room actually runs.',
    alt: 'Contemporary church bulletin template — Riverbend Church with modern sans-serif type and a worship set in the order of service',
    insideAlt:
      'Inside spread of the contemporary church bulletin template showing the worship set, message notes and next steps',
  },
]

/** Kept short and factual — this exact list becomes the FAQPage schema. */
export const TEMPLATE_FAQ = [
  {
    question: 'Are these church bulletin templates free?',
    answer:
      'Yes. Every sample on this page downloads as a print-ready PDF with no signup, no email address, and no watermark.',
  },
  {
    question: 'What paper size are the templates?',
    answer:
      'They are US Letter, two pages: a cover and an inside spread. ChurchPress also outputs A4 for churches outside the United States, and both are sized to print without scaling.',
  },
  {
    question: 'Can I put my own church details into one of these?',
    answer:
      'That is what ChurchPress does. Enter your church name, service time, sermon title, scripture, announcements and prayer list once, choose one of the four tones, and it produces this same design with your words. Your first three bulletins are free and need no card.',
  },
  {
    question: 'Which denominations do the templates suit?',
    answer:
      'Any Protestant church. The tone setting changes the wording as well as the look — whether the service is called Sunday Worship or the Lord’s Day, whether the offering is described as giving or tithes and offerings — and the four samples here cover Baptist, Reformed, Anglican and contemporary non-denominational styles.',
  },
  {
    question: 'Can I edit a downloaded PDF?',
    answer:
      'The design is fixed, so a PDF is best used as a reference or a one-off. To change the words and keep the design, generate the bulletin in ChurchPress — all the text comes out editable before you print.',
  },
]

const INCLUDED = [
  'The welcome — written for the visitors in the room',
  'Order of worship, with the hymns and readings named',
  'Sermon title, scripture reference and the key points',
  'Every announcement, in the order they matter',
  'The prayer list and the names you entered',
  'Giving information and a closing blessing',
  'Print-ready Letter or A4 — no scaling, no watermark',
  'All the text editable before anything is printed',
]

export default function Templates() {
  const featured = TEMPLATES[0]

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      <main id="main-content">
        {/* ---------------- Hero ---------------- */}
        <section className="panel-deep relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
            <p className="eyebrow-on-dark mb-5">Free to download</p>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight text-white mb-6">
              Church bulletin
              <br />
              <span className="text-gold-400">templates</span>, ready to print
            </h1>
            <p className="text-lg text-primary-200 leading-relaxed max-w-2xl mx-auto mb-4">
              Four complete bulletins — warm and welcoming, traditional, formal and reverent, and
              contemporary. Each one is real output from ChurchPress, not a mock-up: change the
              tone and the artwork, the type and the wording change with it.
            </p>
            <p className="text-sm text-primary-300">
              Download any of them as a print-ready PDF. No signup, no watermark, no email
              address required.
            </p>
          </div>
        </section>

        {/* ---------------- One bulletin, both pages ---------------- */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="eyebrow mb-4">Inside a bulletin</p>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-700 mb-4">
              The cover, and the spread
            </h2>
            <p className="text-ink-muted max-w-2xl mx-auto leading-relaxed">
              A bulletin is two printed pages. The cover carries your church name, the service
              time and the verse for the week; the inside spread carries the service itself.
              Here it is in the warm tone.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 stagger">
            {[
              { file: `${featured.key}-1`, alt: featured.alt, caption: 'Page one — the cover' },
              { file: `${featured.key}-2`, alt: featured.insideAlt, caption: 'Page two — the inside spread' },
            ].map(({ file, alt, caption }) => (
              <figure key={file} className="card card-hover m-0 p-3">
                <img
                  src={`/templates/${file}.webp`}
                  alt={alt}
                  width={PAGE.width}
                  height={PAGE.height}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto rounded-sm border border-rule-light"
                />
                <figcaption className="mt-3 text-center text-xs text-ink-muted">
                  {caption}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="text-center mt-9">
            <a href="/templates/warm.pdf" download className="btn-gold gap-2">
              <Download className="w-4 h-4" aria-hidden="true" />
              Download this sample (PDF)
            </a>
            <p className="text-xs text-ink-muted mt-3">
              Grace Community Church is an example church, and so is the service in it.
            </p>
          </div>
        </section>

        {/* ---------------- The four tones ---------------- */}
        <section className="bg-parchment border-y border-rule-light py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="eyebrow mb-4">Four styles</p>
              <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
                Pick the one that sounds like your church
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 stagger">
              {TEMPLATES.map((template) => (
                <article key={template.key} className="card card-hover flex flex-col p-4">
                  <img
                    src={`/templates/${template.key}-1.webp`}
                    alt={template.alt}
                    width={PAGE.width}
                    height={PAGE.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto rounded-sm border border-rule-light mb-5"
                  />

                  <p className="label-caps mb-2">Template</p>
                  <h3 className="font-display text-2xl text-primary-800 mb-2">{template.tone}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed mb-3">{template.suits}</p>
                  <p className="text-sm text-ink-muted leading-relaxed mb-4">{template.art}</p>

                  <p className="text-xs text-ink-muted mb-5">
                    Example: {template.sampleChurch} — {template.service}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-3">
                    <a
                      href={`/templates/${template.key}.pdf`}
                      download
                      className="btn-primary gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Free PDF
                    </a>
                    <a
                      href={`/templates/${template.key}-2.webp`}
                      target="_blank"
                      rel="noopener"
                      className="btn-secondary text-sm"
                    >
                      See the inside
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- What every bulletin holds ---------------- */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="eyebrow mb-4">What is in it</p>
              <h2 className="font-display text-3xl sm:text-4xl text-primary-700 mb-5">
                Every bulletin holds the whole service
              </h2>
              <p className="text-ink-muted leading-relaxed">
                Nothing here is decoration for its own sake. Each section is one thing somebody
                in the room needs: what is happening, what is being read, who to pray for, and
                how to give.
              </p>
            </div>

            <ul className="space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink-muted">
                  <Check className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- How to use them ---------------- */}
        <section className="bg-parchment border-y border-rule-light py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="eyebrow mb-4">Two ways to use this page</p>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-700 mb-8">
              Download one, or make your own
            </h2>

            <div className="grid sm:grid-cols-2 gap-6 text-left">
              <div className="card">
                <h3 className="font-display text-xl text-primary-800 mb-2">
                  Print a sample as it is
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Useful for seeing the design, for a hall display, or for showing your church
                  what is possible. Download the PDF and print one copy.
                </p>
              </div>
              <div className="card">
                <h3 className="font-display text-xl text-primary-800 mb-2">
                  Make one with your own words
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Enter your service once — church name, time, sermon title, scripture,
                  announcements, prayer list — pick a tone, and you get this design with your
                  details, plus the slides, social posts and email.
                </p>
              </div>
            </div>

            <Link to="/signup" className="btn-gold gap-2 mt-9">
              Make your first bulletin free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <p className="text-sm text-ink-muted mt-4">
              Three bulletins free, no card. Then{' '}
              <Link to="/pricing" className="text-primary-600 underline">
                $15 a month
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="eyebrow mb-4">Questions</p>
            <h2 className="font-display text-3xl sm:text-4xl text-primary-700">
              About the templates
            </h2>
          </div>

          <div className="space-y-3">
            {TEMPLATE_FAQ.map(({ question, answer }) => (
              <details key={question} className="card">
                <summary className="cursor-pointer font-display text-lg text-primary-800 flex items-center justify-between gap-3 list-none rounded-md">
                  {question}
                  <span
                    className="text-gold-600 text-xl leading-none flex-shrink-0 select-none"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="text-sm text-ink-muted leading-relaxed mt-3">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

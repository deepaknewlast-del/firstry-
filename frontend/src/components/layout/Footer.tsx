import { Link } from 'react-router-dom'
import { Logo } from '../brand/Logo'

const LINK_CLASS =
  'text-primary-100 hover:text-gold-400 transition-colors min-h-11 inline-flex items-center'

export function Footer() {
  return (
    <footer className="panel-deep mt-24 border-t border-gold-700/25">
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-10 items-start">
        <div>
          <Logo size={40} onDark className="mb-4" />
          <p className="text-sm text-primary-200 leading-relaxed max-w-xs">
            A bulletin studio for the local church. One sitting each week gives you the printed
            bulletin, the announcement slides, your social posts, and the email to your
            congregation.
          </p>
        </div>

        <nav aria-label="Product" className="flex flex-col gap-1 text-sm">
          <span className="label-caps-on-dark mb-1">Product</span>
          <Link to="/pricing" className={LINK_CLASS}>
            Pricing
          </Link>
          <Link to="/templates" className={LINK_CLASS}>
            Bulletin templates
          </Link>
          <a href="mailto:hello@churchbulletin.in" className={LINK_CLASS}>
            Support
          </a>
        </nav>

        <nav aria-label="Legal" className="text-sm flex flex-col gap-1">
          <span className="label-caps-on-dark mb-1">Legal</span>
          <Link to="/terms" className={LINK_CLASS}>
            Terms
          </Link>
          <Link to="/refund-policy" className={LINK_CLASS}>
            Refund policy
          </Link>
          <Link to="/privacy" className={LINK_CLASS}>
            Privacy
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-200">
            © {new Date().getFullYear()} ChurchPress. All rights reserved. Built for the Sunday
            morning heroes.
          </p>
          <p className="text-xs text-primary-300">
            Made for Baptist, Methodist, Presbyterian, Pentecostal, Anglican &amp;
            non-denominational churches.
          </p>
        </div>
      </div>
    </footer>
  )
}

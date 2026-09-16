import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export default function Welcome() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-lift">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="font-display text-3xl text-primary-950">
            Welcome to ChurchPress!
          </h1>
          <p className="text-slate-600">
            Your payment was successful and your subscription is now active. Thank you for upgrading!
          </p>
          <div className="pt-4">
            <Link to="/generate" className="btn-primary w-full inline-block text-center">
              Start Generating
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

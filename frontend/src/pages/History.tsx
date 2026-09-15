import { useState } from 'react'
import { Download, FileText, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Navbar } from '../components/layout/Navbar'
import { useBulletins } from '../hooks/useBulletins'

export default function History() {
  const { bulletins, loading, deleteBulletin } = useBulletins()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteBulletin(id)
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-10">
        <p className="eyebrow mb-2">Archive</p>
        <h1 className="font-display text-3xl text-primary-700 mb-8">Bulletin History</h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-shimmer h-20 rounded-2xl bg-primary-100" />
            ))}
          </div>
        ) : bulletins.length === 0 ? (
          <div className="card text-center py-14 border-dashed border-2 border-primary-200 bg-transparent shadow-none">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary-100">
              <FileText className="w-6 h-6 text-primary-600" aria-hidden="true" />
            </div>
            <p className="text-primary-900 text-sm font-semibold">No bulletins generated yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Everything you create will live here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bulletins.map((b) => (
              <div key={b.id} className="card card-hover flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-100">
                    <FileText className="w-5 h-5 text-primary-700" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-950 text-sm">{b.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {format(new Date(b.service_date), 'EEEE, MMMM d, yyyy')} • Generated{' '}
                      {format(new Date(b.created_at), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.pdf_url && (
                    <a
                      href={b.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-primary-700 border border-primary-100 hover:bg-primary-50 transition-colors"
                      aria-label={`Download PDF for ${b.title}`}
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    disabled={deletingId === b.id}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-600 border border-slate-200 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                    aria-label={`Delete ${b.title}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

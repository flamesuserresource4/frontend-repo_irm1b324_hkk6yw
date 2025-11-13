import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Music, Play, Pause, Scissors, Waves, Gauge, Download, Sparkles, Info } from 'lucide-react'
import Spline from '@splinetool/react-spline'

function formatTime(secs) {
  if (!Number.isFinite(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('mix')

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const fileInputRef = useRef(null)
  const audioRefs = {
    original: useRef(null),
    harmonic: useRef(null),
    percussive: useRef(null),
  }

  useEffect(() => {
    let raf
    if (loading) {
      const start = performance.now()
      const anim = (t) => {
        const elapsed = (t - start) / 1000
        // playful wavy progress inspired by Google timers
        setProgress((p) => (p < 95 ? p + Math.max(0.2, 0.6 * Math.sin(elapsed * 2) + 0.4) : p))
        raf = requestAnimationFrame(anim)
      }
      raf = requestAnimationFrame(anim)
    }
    return () => raf && cancelAnimationFrame(raf)
  }, [loading])

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setResult(null)
      setError('')
    }
  }

  const upload = async () => {
    if (!file) {
      setError('Please choose an audio file (mp3/wav)')
      return
    }
    setLoading(true)
    setProgress(0)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${baseUrl}/api/process`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const data = await res.json()
      setResult(data)
      setProgress(100)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const play = (key) => {
    const a = audioRefs[key].current
    if (!a) return
    if (a.paused) a.play()
    else a.pause()
  }

  const ProgressBar = ({ value }) => (
    <div className="w-full h-3 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
      />
      {/* playful shimmering dot */}
      <motion.div
        className="-mt-3 h-3 w-3 rounded-full bg-white shadow ring-2 ring-fuchsia-400"
        style={{ x: `calc(${value}% - 6px)` }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white text-slate-800">
      {/* Hero with Spline */}
      <section className="relative h-[56vh] md:h-[64vh] overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/VJLoxp84lCdVfdZu/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/30 to-white pointer-events-none" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            StemLab — Split, Analyze, Play
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl text-slate-600"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            Drop in a track to extract stems, detect BPM and key, then remix with a clean, tactile UI.
          </motion.p>
          <motion.div className="mt-8 flex items-center gap-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow hover:shadow-lg hover:-translate-y-0.5 transition transform"
            >
              <Upload size={18} /> Choose Audio
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
            <button
              onClick={upload}
              disabled={!file || loading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white px-5 py-3 rounded-xl shadow hover:shadow-lg hover:-translate-y-0.5 transition transform disabled:opacity-50"
            >
              <Sparkles size={18} /> Process
            </button>
          </motion.div>
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 w-full max-w-xl"
              >
                <ProgressBar value={progress} />
                <p className="mt-2 text-sm text-slate-500">Analyzing and extracting stems…</p>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <p className="mt-4 text-red-600 text-sm flex items-center gap-2"><Info size={16}/> {error}</p>
          )}
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="px-6 pb-16 -mt-12">
          <div className="mx-auto max-w-5xl bg-white/70 backdrop-blur rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white"><Music size={20}/></div>
                <div>
                  <p className="font-semibold">{file?.name}</p>
                  <p className="text-sm text-slate-500">{formatTime(result.duration)} • BPM {Math.round(result.bpm || 0)} • Key {result.key || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`${baseUrl}${result.stems.harmonic}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"><Download size={16}/> Harmonic</a>
                <a href={`${baseUrl}${result.stems.percussive}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"><Download size={16}/> Percussive</a>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {/* Original */}
              <div className="p-4 rounded-xl border bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Waves size={18}/> Original</h3>
                  <button onClick={() => play('original')} className="px-3 py-1 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2"><Play size={14}/> Play/Pause</button>
                </div>
                <audio ref={audioRefs.original} src={URL.createObjectURL(file)} controls className="mt-3 w-full" />
              </div>

              {/* Harmonic */}
              <div className="p-4 rounded-xl border bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Scissors size={18}/> Harmonic</h3>
                  <button onClick={() => play('harmonic')} className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2"><Play size={14}/> Play/Pause</button>
                </div>
                <audio ref={audioRefs.harmonic} src={`${baseUrl}${result.stems.harmonic}`} controls className="mt-3 w-full" />
              </div>

              {/* Percussive */}
              <div className="p-4 rounded-xl border bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Scissors size={18}/> Percussive</h3>
                  <button onClick={() => play('percussive')} className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-sm flex items-center gap-2"><Play size={14}/> Play/Pause</button>
                </div>
                <audio ref={audioRefs.percussive} src={`${baseUrl}${result.stems.percussive}`} controls className="mt-3 w-full" />
              </div>
            </div>

            {/* Tiny mixer */}
            <div className="mt-8">
              <h4 className="font-semibold mb-3 flex items-center gap-2"><Gauge size={18}/> Quick Mix</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Mixer label="Harmonic Volume" targetRef={audioRefs.harmonic} color="from-indigo-500 to-fuchsia-500" />
                <Mixer label="Percussive Volume" targetRef={audioRefs.percussive} color="from-cyan-500 to-emerald-500" />
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="px-6 pb-10 text-center text-slate-500">
        Built with love for audio nerds. Drop a song and explore its DNA.
      </footer>
    </div>
  )
}

function Mixer({ label, targetRef, color }) {
  const [val, setVal] = useState(100)
  useEffect(() => {
    if (targetRef.current) targetRef.current.volume = val / 100
  }, [val])
  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="flex items-center justify-between">
        <p className="font-medium">{label}</p>
        <span className="text-sm text-slate-500">{val}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
        <motion.div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${val}%` }} />
      </div>
      <input type="range" value={val} onChange={(e)=>setVal(parseInt(e.target.value))} className="mt-3 w-full" />
    </div>
  )
}

export default App

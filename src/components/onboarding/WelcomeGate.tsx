// The opening of the product. Before anyone reaches the dashboard they land on a
// cinematic dark canvas that slowly builds FieldVision AI out of light and blur,
// like the cold open of a piece of next generation technology. The real app is
// mounted behind the scene the whole time, so pressing Start now dissolves the
// canvas with a grand zoom and reveals the dashboard already waiting underneath.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { useSession } from '../../context/SessionContext'

// The reveal is a slow staged build. Each value is the moment a stage joins the
// scene, measured from the first frame. Tuned so the whole opening reads as one
// long unhurried breath of roughly six seconds before the invitation lands.
const STAGE_MS = {
  logo: 900,
  headline: 2300,
  tagline: 3900,
  button: 5200,
} as const

// How long the grand dissolve takes when Start now is pressed.
const EXIT_MS = 1100

// The headline reveals one word at a time. AI carries the brand accent.
const HEADLINE_WORDS = [
  { text: 'Welcome', accent: false },
  { text: 'to', accent: false },
  { text: 'FieldVision', accent: false },
  { text: 'AI', accent: true },
]

export function WelcomeGate({ children }: { children: ReactNode }) {
  const { started, start } = useSession()

  return (
    <>
      {children}
      {started ? null : <WelcomeScreen onStart={start} />}
    </>
  )
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const [stage, setStage] = useState(0)
  const [exiting, setExiting] = useState(false)
  const exitTimer = useRef<number | null>(null)

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), STAGE_MS.logo),
      window.setTimeout(() => setStage(2), STAGE_MS.headline),
      window.setTimeout(() => setStage(3), STAGE_MS.tagline),
      window.setTimeout(() => setStage(4), STAGE_MS.button),
    ]
    return () => {
      timers.forEach(window.clearTimeout)
      if (exitTimer.current) window.clearTimeout(exitTimer.current)
    }
  }, [])

  function handleStart() {
    if (exiting) return
    setExiting(true)
    exitTimer.current = window.setTimeout(onStart, EXIT_MS)
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#070a0f]"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.12)' : 'scale(1)',
        filter: exiting ? 'blur(6px)' : 'blur(0)',
        transition: `opacity ${EXIT_MS}ms cubic-bezier(0.7, 0, 0.84, 0), transform ${EXIT_MS}ms cubic-bezier(0.7, 0, 0.84, 0), filter ${EXIT_MS}ms ease-out`,
      }}
    >
      <div className="fv-cine-canvas absolute inset-0">
        <Backdrop />
        <Embers />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
          {stage >= 1 ? (
            <div className="relative flex items-center justify-center">
              <span
                className="fv-cine-halo pointer-events-none absolute h-44 w-44 rounded-full bg-blue-500/25 blur-3xl"
                aria-hidden
              />
              <img
                src="/fieldvision-logo.png"
                alt="FieldVision AI"
                className="fv-cine-logo relative h-20 w-20 rounded-2xl object-contain shadow-2xl shadow-blue-500/30 ring-1 ring-white/10"
              />
            </div>
          ) : (
            <div className="h-20 w-20" aria-hidden />
          )}

          {stage >= 2 ? (
            <div className="relative mt-8 overflow-hidden">
              <span
                className="fv-cine-beam pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                aria-hidden
              />
              <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 text-[40px] font-semibold tracking-tight text-white sm:text-[56px]">
                {HEADLINE_WORDS.map((word, index) => (
                  <span
                    key={word.text}
                    className={`fv-cine-word ${word.accent ? 'text-blue-400' : ''}`}
                    style={{ animationDelay: `${index * 0.18}s` }}
                  >
                    {word.text}
                  </span>
                ))}
              </h1>
            </div>
          ) : (
            <div className="mt-8 h-[44px] sm:h-[60px]" aria-hidden />
          )}

          {stage >= 3 ? (
            <>
              <span
                className="fv-cine-line mt-7 block h-px w-40 bg-gradient-to-r from-transparent via-blue-400/70 to-transparent"
                aria-hidden
              />
              <p className="fv-cine-up mt-6 text-[15px] font-medium uppercase tracking-[0.4em] text-slate-400">
                AI Money Ball
              </p>
            </>
          ) : (
            <div className="mt-7 h-[60px]" aria-hidden />
          )}

          {stage >= 4 ? (
            <button
              type="button"
              onClick={handleStart}
              className="fv-cine-up group mt-12 flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-slate-900 shadow-2xl shadow-blue-500/20 transition-all duration-300 hover:scale-[1.04] hover:shadow-blue-500/40"
            >
              Start now
              <ArrowRight
                size={18}
                strokeWidth={2.4}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          ) : (
            <div className="mt-12 h-[56px]" aria-hidden />
          )}
        </div>

        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] font-medium uppercase tracking-[0.3em] text-slate-600">
          FieldVision AI
        </div>
      </div>
    </div>
  )
}

// The living background. A deep vignette, a slow drifting aurora of brand light
// and a faint depth grid combine into a calm sense of next generation space.
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#070a0f] via-[#0a1018] to-[#070a0f]" />
      <div className="fv-cine-grid absolute inset-0" />
      <div className="fv-cine-aurora absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,5,8,0.85)_100%)]" />
    </div>
  )
}

// A handful of slow rising embers of light to give the air some motion.
function Embers() {
  const embers = [
    { left: '18%', delay: '0s', size: 3 },
    { left: '32%', delay: '3.5s', size: 2 },
    { left: '47%', delay: '1.5s', size: 4 },
    { left: '63%', delay: '5s', size: 2 },
    { left: '78%', delay: '2.5s', size: 3 },
    { left: '88%', delay: '6.5s', size: 2 },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {embers.map((ember, index) => (
        <span
          key={index}
          className="fv-cine-float absolute bottom-[20%] rounded-full bg-blue-300/60 blur-[1px]"
          style={{
            left: ember.left,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            animationDelay: ember.delay,
          }}
        />
      ))}
    </div>
  )
}

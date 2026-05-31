// The opening of the product. Before anyone reaches the dashboard they land on a
// calm white screen that gently introduces FieldVision AI and invites them to
// start a session. The real app is mounted behind the screen the whole time, so
// pressing Start now simply fades the white away and reveals the dashboard.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { useSession } from '../../context/SessionContext'

// How long the white canvas holds before the brand settles in, and how long
// after that the Start now invitation appears. Tuned so the whole opening reads
// as one slow, safe five second breath.
const BRAND_DELAY_MS = 600
const BUTTON_DELAY_MS = 2600
const EXIT_MS = 700

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
  const [showBrand, setShowBrand] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [exiting, setExiting] = useState(false)
  const exitTimer = useRef<number | null>(null)

  useEffect(() => {
    const brand = window.setTimeout(() => setShowBrand(true), BRAND_DELAY_MS)
    const button = window.setTimeout(() => setShowButton(true), BUTTON_DELAY_MS)
    return () => {
      window.clearTimeout(brand)
      window.clearTimeout(button)
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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white transition-opacity duration-700 ease-out"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50" />
      <div className="fv-breathe pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative flex flex-col items-center px-8 text-center">
        {showBrand ? (
          <div className="fv-welcome-rise relative flex items-center gap-3.5">
            <span className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full">
              <span className="fv-sheen absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </span>
            <img
              src="/fieldvision-logo.png"
              alt="FieldVision AI"
              className="h-11 w-11 rounded-xl object-contain shadow-sm ring-1 ring-slate-200"
            />
            <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
              Welcome to FieldVision
              <span className="text-blue-500"> AI</span>
            </h1>
          </div>
        ) : null}

        {showBrand ? (
          <p
            className="fv-welcome-rise mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400"
            style={{ animationDelay: '0.25s' }}
          >
            The scouting brain for college soccer. Calm, fast and built to help you
            see the whole game.
          </p>
        ) : null}

        {showButton ? (
          <button
            type="button"
            onClick={handleStart}
            className="fv-welcome-rise group mt-10 flex items-center gap-2.5 rounded-full bg-slate-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-slate-900/10 transition-all duration-300 hover:scale-[1.03] hover:bg-slate-800"
          >
            Start now
            <ArrowRight
              size={18}
              strokeWidth={2.4}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        ) : (
          <div className="mt-10 h-[52px]" aria-hidden />
        )}
      </div>

      <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">
        FieldVision AI
      </div>
    </div>
  )
}

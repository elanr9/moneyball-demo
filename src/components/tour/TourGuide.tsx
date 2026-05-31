// The guided tutorial overlay. It dims the screen, cuts a soft spotlight around
// one real part of the page, gently scales that part up so the eye locks onto
// it, floats a small card next to it and points an arrow at it. The visitor
// reads the step then clicks Next to move on, and the spotlight glides to the
// next part. Tours start on their own the first time a page is opened in a
// session, and a small help button lets anyone replay the current page tour
// during a demo.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { useSession } from '../../context/SessionContext'
import { PAGE_TOURS, tourForPath } from './tourConfig'
import type { Placement } from './tourConfig'

interface Box {
  top: number
  left: number
  width: number
  height: number
}

const SPOTLIGHT_PAD = 10
const CARD_GAP = 28
const CARD_WIDTH = 348
const FALLBACK_CARD_HEIGHT = 188
const SETTLE_MS = 650
// How many polling frames we will wait for a missing element before giving up
// and advancing. Generous so a slow paint never silently skips a step.
const MAX_LOOKUP_FRAMES = 480
const SCALE = 1.06

interface SavedStyle {
  transform: string
  transition: string
  willChange: string
}

export function TourGuide() {
  const { pathname } = useLocation()
  const { started, hasSeenTour, markTourSeen } = useSession()

  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [target, setTarget] = useState<Box | null>(null)
  const [cardHeight, setCardHeight] = useState(0)

  const cardRef = useRef<HTMLDivElement>(null)
  // Read hasSeenTour through a ref so changes to its identity do not retrigger
  // the auto start effect mid tour.
  const hasSeenTourRef = useRef(hasSeenTour)
  hasSeenTourRef.current = hasSeenTour

  const activeTour = activeTourId
    ? PAGE_TOURS.find((t) => t.id === activeTourId) ?? null
    : null
  const step = activeTour?.steps[stepIndex] ?? null
  const pageTour = tourForPath(pathname)

  const finish = useCallback(() => {
    if (activeTourId) markTourSeen(activeTourId)
    setActiveTourId(null)
    setStepIndex(0)
    setTarget(null)
  }, [activeTourId, markTourSeen])

  const goNext = useCallback(() => {
    if (!activeTour) return
    if (stepIndex + 1 >= activeTour.steps.length) {
      finish()
      return
    }
    // Keep the current spotlight on screen so it can glide to the next part
    // instead of flashing a full dim between steps.
    setStepIndex((i) => i + 1)
  }, [activeTour, stepIndex, finish])

  const replay = useCallback(() => {
    if (!pageTour) return
    setStepIndex(0)
    setTarget(null)
    setCardHeight(0)
    setActiveTourId(pageTour.id)
  }, [pageTour])

  // Auto start the right tour for the current page. The moment we kick a tour
  // off we mark it seen so it can never replay itself in this session, even if
  // some downstream re render happens to retrigger this effect.
  useEffect(() => {
    if (!started) return
    const tour = tourForPath(pathname)
    setActiveTourId(null)
    setStepIndex(0)
    setTarget(null)
    setCardHeight(0)
    if (!tour) return
    if (hasSeenTourRef.current(tour.id)) return
    markTourSeen(tour.id)
    const timer = window.setTimeout(() => {
      setActiveTourId(tour.id)
      setStepIndex(0)
      setTarget(null)
    }, SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [pathname, started, markTourSeen])

  // Track the highlighted element. We poll each frame so the spotlight stays
  // glued even while the page is still scrolling it into view, and we apply a
  // gentle scale to the element itself so the focus reads as a real zoom.
  useEffect(() => {
    if (!activeTourId || !step) return
    let raf = 0
    let cancelled = false
    let attempts = 0
    let scrolled = false
    let scaled: { el: HTMLElement; saved: SavedStyle } | null = null

    const revert = () => {
      if (!scaled) return
      const { el, saved } = scaled
      el.style.transform = saved.transform
      el.style.transition = saved.transition
      el.style.willChange = saved.willChange
      scaled = null
    }

    const tick = () => {
      if (cancelled) return
      const el = document.querySelector(step.selector) as HTMLElement | null
      if (!el) {
        attempts += 1
        if (attempts > MAX_LOOKUP_FRAMES) {
          goNext()
          return
        }
        raf = requestAnimationFrame(tick)
        return
      }
      if (!scrolled) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        scrolled = true
      }
      if (!scaled || scaled.el !== el) {
        revert()
        const saved: SavedStyle = {
          transform: el.style.transform,
          transition: el.style.transition,
          willChange: el.style.willChange,
        }
        el.style.transition = 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)'
        el.style.willChange = 'transform'
        el.style.transform = (saved.transform ? saved.transform + ' ' : '') +
          `scale(${SCALE})`
        scaled = { el, saved }
      }
      const r = el.getBoundingClientRect()
      setTarget((prev) => {
        if (
          prev &&
          Math.abs(prev.top - r.top) < 0.5 &&
          Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5
        ) {
          return prev
        }
        return { top: r.top, left: r.left, width: r.width, height: r.height }
      })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      revert()
    }
  }, [activeTourId, step, goNext])

  useLayoutEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight
      setCardHeight((prev) => (Math.abs(prev - h) < 0.5 ? prev : h))
    }
  }, [target, stepIndex, activeTourId])

  // Close the tour on Escape from anywhere.
  useEffect(() => {
    if (!activeTourId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTourId, finish])

  // Nothing is running: offer a quiet help button to replay this page tour.
  if (!activeTourId || !activeTour || !step) {
    if (!started || !pageTour) return null
    return (
      <button
        type="button"
        onClick={replay}
        title="Replay this page tutorial"
        className="fixed bottom-6 right-6 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-navy-600 bg-navy-800/90 text-team shadow-float backdrop-blur transition-all hover:scale-105 hover:border-team"
      >
        <HelpCircle size={22} strokeWidth={2.1} />
      </button>
    )
  }

  // While we locate the element, hold a calm dim so there is no flash.
  if (!target) {
    return <div className="fixed inset-0 z-[80] bg-navy-900/74" />
  }

  const layout = computeLayout(
    target,
    CARD_WIDTH,
    cardHeight || FALLBACK_CARD_HEIGHT,
    step.placement ?? 'bottom',
  )
  const ready = cardHeight > 0
  const stepCount = activeTour.steps.length
  const isLast = stepIndex + 1 >= stepCount

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Click blocker. The dim itself is painted by the spotlight box, so
          this layer just absorbs clicks on the page so nothing accidental
          happens. The tour only advances through the explicit Next button. */}
      <div className="absolute inset-0" />

      <div
        className="fv-tour-ring pointer-events-none absolute rounded-xl transition-all duration-300 ease-out"
        style={{
          top: layout.spotlight.top,
          left: layout.spotlight.left,
          width: layout.spotlight.width,
          height: layout.spotlight.height,
        }}
      />

      <TourArrow placement={layout.placement} spotlight={layout.spotlight} />

      <div
        ref={cardRef}
        className="absolute w-[348px] overflow-hidden rounded-2xl p-[18px] transition-all duration-300 ease-out"
        style={{
          top: layout.cardTop,
          left: layout.cardLeft,
          opacity: ready ? 1 : 0,
          backgroundColor: '#12161F',
          border: '1px solid #2A3344',
          boxShadow:
            '0 24px 60px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03), 0 0 28px -6px var(--team-soft)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slim progress rail across the very top of the card. */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${((stepIndex + 1) / stepCount) * 100}%`,
              backgroundColor: 'var(--team-primary, #3D7DFF)',
            }}
          />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: 'var(--team-primary, #3D7DFF)' }}
          >
            <Sparkles size={12} strokeWidth={2.6} />
            Step {stepIndex + 1} of {stepCount}
          </span>
          <button
            type="button"
            onClick={finish}
            className="text-[11.5px] font-medium transition-colors"
            style={{ color: '#69748A' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#C7CDD9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#69748A')}
          >
            Skip
          </button>
        </div>

        <h3
          key={`title-${stepIndex}`}
          className="fv-pop-title text-[18px] font-extrabold leading-tight tracking-tight"
          style={{ color: '#F4F6FB' }}
        >
          {step.title}
        </h3>
        <p
          key={`body-${stepIndex}`}
          className="fv-pop-body mt-2 text-[13.5px] leading-relaxed"
          style={{ color: '#AEB6C6' }}
        >
          {step.body}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {activeTour.steps.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 18 : 6,
                  backgroundColor:
                    i === stepIndex
                      ? 'var(--team-primary, #3D7DFF)'
                      : i < stepIndex
                        ? 'rgba(61,125,255,0.45)'
                        : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="fv-tour-next group flex items-center gap-1.5 rounded-full px-[18px] py-2 text-[13px] font-bold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95"
            style={{
              backgroundColor: 'var(--team-primary, #3D7DFF)',
              boxShadow: '0 8px 20px -8px var(--team-primary, #3D7DFF)',
            }}
          >
            {isLast ? 'Got it' : 'Next'}
            {!isLast ? (
              <ArrowRight
                size={15}
                strokeWidth={2.6}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  )
}

function TourArrow({
  placement,
  spotlight,
}: {
  placement: Placement
  spotlight: Box
}) {
  const cx = spotlight.left + spotlight.width / 2
  const cy = spotlight.top + spotlight.height / 2

  let left = cx
  let top = cy
  let Icon = ArrowUp
  let nudge = { x: '0px', y: '-5px' }

  if (placement === 'bottom') {
    top = spotlight.top + spotlight.height + CARD_GAP / 2
    Icon = ArrowUp
    nudge = { x: '0px', y: '-5px' }
  } else if (placement === 'top') {
    top = spotlight.top - CARD_GAP / 2
    Icon = ArrowDown
    nudge = { x: '0px', y: '5px' }
  } else if (placement === 'right') {
    left = spotlight.left + spotlight.width + CARD_GAP / 2
    Icon = ArrowLeft
    nudge = { x: '-5px', y: '0px' }
  } else {
    left = spotlight.left - CARD_GAP / 2
    Icon = ArrowRight
    nudge = { x: '5px', y: '0px' }
  }

  return (
    <div
      className="fv-tour-nudge pointer-events-none absolute flex h-7 w-7 items-center justify-center rounded-full bg-team text-white shadow-glow"
      style={{
        top,
        left,
        transform: 'translate(-50%, -50%)',
        ['--nudge-x' as string]: nudge.x,
        ['--nudge-y' as string]: nudge.y,
      }}
    >
      <Icon size={16} strokeWidth={2.6} />
    </div>
  )
}

function computeLayout(
  target: Box,
  cardW: number,
  cardH: number,
  preferred: Placement,
): {
  placement: Placement
  cardTop: number
  cardLeft: number
  spotlight: Box
} {
  const spotlight: Box = {
    top: target.top - SPOTLIGHT_PAD,
    left: target.left - SPOTLIGHT_PAD,
    width: target.width + SPOTLIGHT_PAD * 2,
    height: target.height + SPOTLIGHT_PAD * 2,
  }
  const sBottom = spotlight.top + spotlight.height
  const sRight = spotlight.left + spotlight.width
  const sCx = spotlight.left + spotlight.width / 2
  const sCy = spotlight.top + spotlight.height / 2

  const vw = window.innerWidth
  const vh = window.innerHeight

  const space: Record<Placement, number> = {
    bottom: vh - sBottom,
    top: spotlight.top,
    right: vw - sRight,
    left: spotlight.left,
  }
  const need: Record<Placement, number> = {
    bottom: cardH + CARD_GAP,
    top: cardH + CARD_GAP,
    right: cardW + CARD_GAP,
    left: cardW + CARD_GAP,
  }

  const order: Placement[] = ['bottom', 'top', 'right', 'left']
  const candidates = [preferred, ...order].filter(
    (p, i, arr) => arr.indexOf(p) === i,
  )
  let placement =
    candidates.find((p) => space[p] >= need[p]) ??
    order.slice().sort((a, b) => space[b] - space[a])[0]

  const clampX = (x: number) => Math.min(Math.max(x, 12), vw - cardW - 12)
  const clampY = (y: number) => Math.min(Math.max(y, 12), vh - cardH - 12)

  let cardTop = 0
  let cardLeft = 0
  if (placement === 'bottom') {
    cardTop = sBottom + CARD_GAP
    cardLeft = clampX(sCx - cardW / 2)
  } else if (placement === 'top') {
    cardTop = spotlight.top - CARD_GAP - cardH
    cardLeft = clampX(sCx - cardW / 2)
  } else if (placement === 'right') {
    cardLeft = sRight + CARD_GAP
    cardTop = clampY(sCy - cardH / 2)
  } else {
    cardLeft = spotlight.left - CARD_GAP - cardW
    cardTop = clampY(sCy - cardH / 2)
  }

  return { placement, cardTop, cardLeft, spotlight }
}

import { useCallback, useEffect, useMemo, useState } from 'react'

type Phase = 'instructions' | 'playing' | 'gameover'
type Direction = 'up' | 'down' | 'left' | 'right'
type FoodSprite = 'carrot' | 'fish' | 'tomato' | 'cake'

interface GameProps {
  onGameEnd: (points: number, score: number) => void
  onExit: () => void
  soundEnabled: boolean
  darkMode: boolean
}

const CHOP_DIRECTIONS: Direction[] = ['left', 'up', 'down', 'right']
const CHOP_LANE_MAP: Record<Direction, number> = { left: 0, up: 1, down: 2, right: 3 }
const CHOP_LABELS: Record<Direction, string> = { left: '←', up: '↑', down: '↓', right: '→' }
const FOOD_KEYS: FoodSprite[] = ['carrot', 'fish', 'tomato', 'cake']
const FOOD_PATTERNS: Record<FoodSprite, { color: string; accent: string; cells: number[] }> = {
  carrot: {
    color: '#f97316',
    accent: '#16a34a',
    cells: [3, 9, 10, 14, 15, 16, 20, 21, 22, 23, 27, 28, 29, 34],
  },
  fish: {
    color: '#38bdf8',
    accent: '#e2e8f0',
    cells: [7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 26, 27, 28],
  },
  tomato: {
    color: '#ef4444',
    accent: '#22c55e',
    cells: [8, 9, 13, 14, 15, 16, 19, 20, 21, 22, 25, 26, 27, 28, 32, 33],
  },
  cake: {
    color: '#f9a8d4',
    accent: '#f59e0b',
    cells: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28],
  },
}

function randomFoodSprite(): FoodSprite {
  return FOOD_KEYS[Math.floor(Math.random() * FOOD_KEYS.length)]
}

function PixelFood({ food, pixelSize = 4 }: { food: FoodSprite; pixelSize?: number }) {
  const pattern = FOOD_PATTERNS[food]

  return (
    <div
      className="grid grid-cols-6"
      style={{
        width: `${pixelSize * 6}px`,
        height: `${pixelSize * 6}px`,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: 36 }).map((_, index) => {
        const isFilled = pattern.cells.includes(index)
        const isAccent = food === 'carrot' ? index === 3 : food === 'fish' ? index === 16 : food === 'tomato' ? index === 8 : index === 12

        return (
          <span
            key={`${food}-${index}`}
            style={{
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: isFilled ? (isAccent ? pattern.accent : pattern.color) : 'transparent',
            }}
          />
        )
      })}
    </div>
  )
}

function gameShell(darkMode: boolean) {
  return darkMode ? 'bg-slate-950 text-slate-100' : 'bg-orange-50 text-slate-900'
}

function panelShell(darkMode: boolean) {
  return darkMode
    ? 'rounded-2xl border-2 border-orange-300/80 bg-slate-900 p-6 shadow-xl'
    : 'rounded-2xl border-2 border-orange-300 bg-white p-6 shadow-xl'
}

function scoreBadgeClass(darkMode: boolean) {
  return darkMode
    ? 'rounded-lg bg-slate-100 px-3 py-1 text-slate-900'
    : 'rounded-lg bg-slate-900 px-3 py-1 text-slate-100'
}

function actionButtonClass(darkMode: boolean) {
  return darkMode
    ? 'rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-100 hover:bg-slate-700'
    : 'rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-200'
}

function bodyTextClass(darkMode: boolean) {
  return darkMode ? 'text-slate-100' : 'text-slate-900'
}

function playTone(enabled: boolean, frequency: number, duration = 0.08) {
  if (!enabled) return

  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
  gain.gain.setValueAtTime(0.08, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + duration)
}

function InstructionCard({
  darkMode,
  title,
  objective,
  controls,
  scoring,
  win,
  onStart,
  onExit,
}: {
  darkMode: boolean
  title: string
  objective: string
  controls: string
  scoring: string
  win: string
  onStart: () => void
  onExit: () => void
}) {
  const [hasRead, setHasRead] = useState(false)
  const detailsTextClass = darkMode ? 'text-slate-200' : 'text-slate-800'
  const labelTextClass = darkMode ? 'text-slate-100' : 'text-slate-900'
  const exitButtonClass = darkMode
    ? 'rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-100 hover:bg-slate-700'
    : 'rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-200'

  return (
    <main className={`min-h-screen px-6 py-8 ${gameShell(darkMode)}`}>
      <div className="mx-auto max-w-3xl">
        <div className={panelShell(darkMode)}>
          <h1 className="text-3xl font-extrabold text-orange-500">{title}</h1>
          <div className={`mt-5 space-y-3 text-base leading-relaxed ${detailsTextClass}`}>
            <p>
              <span className="font-bold text-orange-500">Objective:</span> {objective}
            </p>
            <p>
              <span className="font-bold text-orange-500">Controls:</span> {controls}
            </p>
            <p>
              <span className="font-bold text-orange-500">Scoring:</span> {scoring}
            </p>
            <p>
              <span className="font-bold text-orange-500">How to Win:</span> {win}
            </p>
          </div>

          <label className={`mt-6 flex items-center gap-2 text-sm font-semibold ${labelTextClass}`}>
            <input
              type="checkbox"
              checked={hasRead}
              onChange={(event) => setHasRead(event.target.checked)}
              className="h-4 w-4"
            />
            I read the instructions
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onExit}
              className={exitButtonClass}
            >
              Exit Game
            </button>
            {hasRead && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700"
              >
                Proceed / Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function GameOverCard({
  darkMode,
  title,
  score,
  pointsEarned,
  onReplay,
  onBack,
}: {
  darkMode: boolean
  title: string
  score: number
  pointsEarned: number
  onReplay: () => void
  onBack: () => void
}) {
  const gameOverTextClass = bodyTextClass(darkMode)
  const replayButtonClass = actionButtonClass(darkMode)

  return (
    <div className={panelShell(darkMode)}>
      <h2 className="text-3xl font-extrabold text-orange-500">{title}</h2>
      <p className={`mt-3 text-lg font-semibold ${gameOverTextClass}`}>Score: {score}</p>
      <p className="text-lg font-semibold text-yellow-600">Points Earned: {pointsEarned} ⭐</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReplay}
          className={replayButtonClass}
        >
          Replay
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
        >
          Back to Menu
        </button>
      </div>
    </div>
  )
}

export function ChopChallengeGame({ onGameEnd, onExit, soundEnabled, darkMode }: GameProps) {
  const [phase, setPhase] = useState<Phase>('instructions')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [feedback, setFeedback] = useState<'Perfect' | 'Good' | 'Miss' | null>(null)
  const [notes, setNotes] = useState<Array<{ id: string; direction: Direction; y: number; food: FoodSprite }>>([])
  const [sliceEffects, setSliceEffects] = useState<Array<{ id: string; direction: Direction; food: FoodSprite }>>([])
  const targetY = 74
  const perfectWindow = 10
  const goodWindow = 18

  const resetGame = () => {
    setScore(0)
    setCombo(0)
    setTimeLeft(30)
    setFeedback(null)
    setNotes([])
    setSliceEffects([])
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return

    const countdown = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPhase('gameover')
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return

    const spawnInterval = setInterval(() => {
      const direction = CHOP_DIRECTIONS[Math.floor(Math.random() * CHOP_DIRECTIONS.length)]
      setNotes((current) => [...current, { id: crypto.randomUUID(), direction, y: 0, food: randomFoodSprite() }])
    }, 650)

    const movementInterval = setInterval(() => {
      setNotes((current) => {
        const next = current
          .map((note) => ({ ...note, y: note.y + 4 }))
          .filter((note) => note.y <= 100)

        const missed = next.length < current.length
        if (missed) {
          setCombo(0)
          setFeedback('Miss')
          playTone(soundEnabled, 170, 0.12)
          setTimeout(() => setFeedback(null), 280)
        }

        return next
      })
    }, 35)

    return () => {
      clearInterval(spawnInterval)
      clearInterval(movementInterval)
    }
  }, [phase, soundEnabled])

  const pressDirection = useCallback(
    (direction: Direction) => {
      if (phase !== 'playing') return

      const candidates = notes.filter((note) => note.direction === direction)
      if (!candidates.length) {
        setCombo(0)
        setFeedback('Miss')
        playTone(soundEnabled, 170, 0.12)
        setTimeout(() => setFeedback(null), 280)
        return
      }

      const closest = candidates.reduce((best, currentCandidate) => {
        const bestDistance = Math.abs(best.y - targetY)
        const currentDistance = Math.abs(currentCandidate.y - targetY)
        return currentDistance < bestDistance ? currentCandidate : best
      })

      const distance = Math.abs(closest.y - targetY)
      const hit: 'Perfect' | 'Good' | 'Miss' =
        distance <= perfectWindow ? 'Perfect' : distance <= goodWindow ? 'Good' : 'Miss'

      if (hit !== 'Miss') {
        setNotes((current) => current.filter((note) => note.id !== closest.id))
        const effectId = crypto.randomUUID()
        setSliceEffects((current) => [...current, { id: effectId, direction, food: closest.food }])
        window.setTimeout(() => {
          setSliceEffects((current) => current.filter((effect) => effect.id !== effectId))
        }, 260)
      }

      if (hit === 'Perfect') {
        setCombo((current) => {
          const nextCombo = current + 1
          setScore((existing) => existing + 30 + current * 2)
          return nextCombo
        })
        setFeedback('Perfect')
        playTone(soundEnabled, 620)
      } else if (hit === 'Good') {
        setCombo((current) => {
          const nextCombo = current + 1
          setScore((existing) => existing + 75 + current * 6)
          return nextCombo
        })
        setFeedback('Good')
        playTone(soundEnabled, 520)
      } else {
        setCombo(0)
        setFeedback('Miss')
        playTone(soundEnabled, 170, 0.12)
      }

      setTimeout(() => setFeedback(null), 280)
    },
    [goodWindow, notes, perfectWindow, phase, soundEnabled, targetY],
  )

  useEffect(() => {
    if (phase !== 'playing') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        pressDirection('up')
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        pressDirection('down')
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        pressDirection('left')
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        pressDirection('right')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, pressDirection])

  const requestExit = () => {
    if (window.confirm('Exit this game and return to mini-games menu?')) {
      onExit()
    }
  }

  const pointsEarned = Math.floor(score * 0.2)
  const scoreClass = scoreBadgeClass(darkMode)
  const exitClass = actionButtonClass(darkMode)
  const instructionTextClass = bodyTextClass(darkMode)

  if (phase === 'instructions') {
    return (
      <InstructionCard
        darkMode={darkMode}
        title="🎵 Ingredient Chop Challenge"
        objective="Hit incoming arrow notes in the correct lane as they reach the target line."
        controls="Use ArrowUp / ArrowDown / ArrowLeft / ArrowRight, or click the lane buttons."
        scoring="Perfect timing gives highest points; combos increase rewards."
        win="Maintain long combos and finish the 30-second round with the highest score."
        onStart={resetGame}
        onExit={onExit}
      />
    )
  }

  return (
    <main className={`min-h-screen px-6 py-8 ${gameShell(darkMode)}`}>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-orange-500">🎵 Ingredient Chop Challenge</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
            <span className={scoreClass}>Score: {score}</span>
            <span className="rounded-lg bg-yellow-300 px-3 py-1 text-slate-900">Combo: {combo}x</span>
            <span className="rounded-lg bg-cyan-300 px-3 py-1 text-slate-900">Time: {timeLeft}s</span>
            <button
              type="button"
              onClick={requestExit}
              className={exitClass}
            >
              Exit Game
            </button>
          </div>
        </div>

        {phase === 'gameover' ? (
          <GameOverCard
            darkMode={darkMode}
            title="🎵 Chop Challenge Complete"
            score={score}
            pointsEarned={pointsEarned}
            onReplay={resetGame}
            onBack={() => onGameEnd(pointsEarned, score)}
          />
        ) : (
          <div className={panelShell(darkMode)}>
            <div className="grid grid-cols-4 gap-3">
              {CHOP_DIRECTIONS.map((direction) => (
                <div key={direction} className="relative h-80 rounded-xl border-2 border-orange-300 bg-slate-800/85">
                  <div className="absolute inset-x-2 bottom-14 rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-100/30 py-1 text-center text-2xl font-extrabold text-yellow-200">
                    {CHOP_LABELS[direction]}
                  </div>

                  {notes
                    .filter((note) => CHOP_LANE_MAP[note.direction] === CHOP_LANE_MAP[direction])
                    .map((note) => (
                      <div
                        key={note.id}
                        className="absolute left-1/2 flex h-20 w-20 -translate-x-1/2 flex-col items-center justify-center rounded-lg border-2 border-orange-200 bg-orange-500 text-white shadow-lg"
                        style={{ top: `${note.y}%` }}
                      >
                        <PixelFood food={note.food} pixelSize={3} />
                        <span className="mt-1 text-xl font-extrabold">{CHOP_LABELS[note.direction]}</span>
                      </div>
                    ))}

                  {sliceEffects
                    .filter((effect) => CHOP_LANE_MAP[effect.direction] === CHOP_LANE_MAP[direction])
                    .map((effect) => (
                      <div key={effect.id} className="pointer-events-none absolute left-1/2 bottom-20 -translate-x-1/2">
                        <div className="flex items-center gap-2 rounded bg-slate-900/70 px-2 py-1 text-white">
                          <PixelFood food={effect.food} pixelSize={2} />
                          <span className="text-lg">🔪</span>
                          <PixelFood food={effect.food} pixelSize={2} />
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {CHOP_DIRECTIONS.map((direction) => (
                <button
                  type="button"
                  key={direction}
                  onClick={() => pressDirection(direction)}
                  className="rounded-lg bg-orange-600 px-4 py-3 text-2xl font-extrabold text-white hover:bg-orange-700"
                >
                  {CHOP_LABELS[direction]}
                </button>
              ))}
            </div>

            <p className={`mt-4 text-center text-base font-semibold ${instructionTextClass}`}>
              Press arrow keys or tap buttons. Hit near the yellow target line for perfect timing.
            </p>
            {feedback && (
              <p className="mt-2 text-center text-xl font-extrabold text-emerald-500">
                {feedback === 'Miss' ? '❌ Miss' : feedback === 'Perfect' ? '🎯 Perfect' : '✅ Good'}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export function FlameControlGame({ onGameEnd, onExit, soundEnabled, darkMode }: GameProps) {
  const [phase, setPhase] = useState<Phase>('instructions')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [heat, setHeat] = useState(45)
  const [target, setTarget] = useState(60)
  const [multiplier, setMultiplier] = useState(1)
  const [feedback, setFeedback] = useState('')

  const resetGame = () => {
    setScore(0)
    setTimeLeft(30)
    setHeat(45)
    setTarget(60)
    setMultiplier(1)
    setFeedback('')
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPhase('gameover')
          return 0
        }
        return current - 1
      })
    }, 1000)

    const coolDown = setInterval(() => {
      setHeat((current) => Math.max(0, current - 2.2))
    }, 120)

    return () => {
      clearInterval(timer)
      clearInterval(coolDown)
    }
  }, [phase])

  const fanFlames = () => {
    if (phase !== 'playing') return

    const boosted = Math.min(100, heat + 13)
    setHeat(boosted)
    const delta = Math.abs(boosted - target)

    if (delta <= 5) {
      const gained = Math.round(120 * multiplier)
      setScore((current) => current + gained)
      setMultiplier((current) => Math.min(2, Number((current + 0.2).toFixed(1))))
      setTarget(35 + Math.random() * 45)
      setFeedback(`Perfect timing! +${gained}`)
      playTone(soundEnabled, 660)
    } else if (delta <= 11) {
      const gained = Math.round(70 * multiplier)
      setScore((current) => current + gained)
      setFeedback(`Good timing +${gained}`)
      playTone(soundEnabled, 530)
    } else {
      setMultiplier(1)
      setFeedback('Too early/late — multiplier reset')
      playTone(soundEnabled, 170, 0.12)
    }
  }

  const requestExit = () => {
    if (window.confirm('Exit this game and return to mini-games menu?')) {
      onExit()
    }
  }

  const pointsEarned = Math.floor(score * 0.22)
  const scoreClass = scoreBadgeClass(darkMode)
  const exitClass = actionButtonClass(darkMode)
  const infoTextClass = bodyTextClass(darkMode)
  const trackClass = darkMode ? 'mb-4 h-8 rounded-full bg-slate-700' : 'mb-4 h-8 rounded-full bg-slate-300'
  const markerTrackClass = darkMode ? 'relative mb-6 h-5 rounded bg-slate-700' : 'relative mb-6 h-5 rounded bg-slate-300'

  if (phase === 'instructions') {
    return (
      <InstructionCard
        darkMode={darkMode}
        title="🔥 Flame Control"
        objective="Keep heat near the target temperature by timing your clicks."
        controls="Click Fan the Flames when your heat meter approaches the target."
        scoring="Perfect timing builds multiplier up to 2x; misses reset multiplier."
        win="Chain perfect clicks and end the 30-second round with max score."
        onStart={resetGame}
        onExit={onExit}
      />
    )
  }

  return (
    <main className={`min-h-screen px-6 py-8 ${gameShell(darkMode)}`}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-orange-500">🔥 Flame Control</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
            <span className={scoreClass}>Score: {score}</span>
            <span className="rounded-lg bg-cyan-300 px-3 py-1 text-slate-900">Time: {timeLeft}s</span>
            <span className="rounded-lg bg-yellow-300 px-3 py-1 text-slate-900">x{multiplier.toFixed(1)}</span>
            <button
              type="button"
              onClick={requestExit}
              className={exitClass}
            >
              Exit Game
            </button>
          </div>
        </div>

        {phase === 'gameover' ? (
          <GameOverCard
            darkMode={darkMode}
            title="🔥 Flame Control Complete"
            score={score}
            pointsEarned={pointsEarned}
            onReplay={resetGame}
            onBack={() => onGameEnd(pointsEarned, score)}
          />
        ) : (
          <div className={panelShell(darkMode)}>
            <div className={trackClass}>
              <div
                className="h-8 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-600 transition-all"
                style={{ width: `${heat}%` }}
              />
            </div>
            <div className="mb-3 flex items-center justify-between text-sm font-semibold">
              <span className={infoTextClass}>Current Heat: {Math.round(heat)}°</span>
              <span className="text-orange-500">Target: {Math.round(target)}°</span>
            </div>
            <div className={markerTrackClass}>
              <div className="absolute top-0 h-5 w-1 bg-orange-600" style={{ left: `${target}%` }} />
            </div>

            <button
              type="button"
              onClick={fanFlames}
              className="w-full rounded-lg bg-orange-600 px-5 py-3 text-lg font-extrabold text-white hover:bg-orange-700"
            >
              🌬️ Fan the Flames
            </button>
            <p className={`mt-3 text-center text-base font-semibold ${infoTextClass}`}>{feedback || 'Time clicks when the bar aligns with the target marker.'}</p>
          </div>
        )}
      </div>
    </main>
  )
}

type MemoryCard = {
  id: string
  theme: 'street' | 'dessert' | 'fusion'
  emoji: string
  label: string
}

function createMemoryDeck() {
  const base: MemoryCard[] = [
    { id: 'kimchi', theme: 'street', emoji: '🌶️', label: 'Kimchi' },
    { id: 'rice-noodles', theme: 'street', emoji: '🍜', label: 'Rice Noodles' },
    { id: 'cocoa', theme: 'dessert', emoji: '🍫', label: 'Cocoa' },
    { id: 'strawberry', theme: 'dessert', emoji: '🍓', label: 'Strawberry' },
    { id: 'mango', theme: 'fusion', emoji: '🥭', label: 'Mango' },
    { id: 'tofu', theme: 'fusion', emoji: '🧈', label: 'Tofu' },
  ]

  return [...base, ...base]
    .map((card, index) => ({ ...card, id: `${card.id}-${index}` }))
    .sort(() => Math.random() - 0.5)
}

export function MemoryMatchGame({ onGameEnd, onExit, soundEnabled, darkMode }: GameProps) {
  const [phase, setPhase] = useState<Phase>('instructions')
  const [deck, setDeck] = useState<MemoryCard[]>([])
  const [score, setScore] = useState(0)
  const [matches, setMatches] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [flipped, setFlipped] = useState<number[]>([])
  const [matchedIndexes, setMatchedIndexes] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  const resetGame = () => {
    setDeck(createMemoryDeck())
    setScore(0)
    setMatches(0)
    setTimeLeft(45)
    setFlipped([])
    setMatchedIndexes([])
    setBusy(false)
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPhase('gameover')
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (matches === 6) {
      setPhase('gameover')
    }
  }, [matches])

  const clickCard = (index: number) => {
    if (phase !== 'playing' || busy || flipped.includes(index) || matchedIndexes.includes(index) || flipped.length === 2) {
      return
    }

    const nextFlipped = [...flipped, index]
    setFlipped(nextFlipped)

    if (nextFlipped.length < 2) return

    setBusy(true)
    const [firstIndex, secondIndex] = nextFlipped
    const firstCard = deck[firstIndex]
    const secondCard = deck[secondIndex]
    const isMatch = firstCard.label === secondCard.label && firstIndex !== secondIndex

    if (isMatch) {
      setMatchedIndexes((current) => [...current, firstIndex, secondIndex])
      setMatches((current) => current + 1)
      const gained = 25 + Math.max(0, Math.floor((timeLeft - 10) / 4))
      setScore((current) => current + gained)
      playTone(soundEnabled, 680)
      setTimeout(() => {
        setFlipped([])
        setBusy(false)
      }, 220)
    } else {
      playTone(soundEnabled, 170, 0.12)
      setTimeout(() => {
        setFlipped([])
        setBusy(false)
      }, 700)
    }
  }

  const requestExit = () => {
    if (window.confirm('Exit this game and return to mini-games menu?')) {
      onExit()
    }
  }

  const pointsEarned = Math.floor(score * 0.25)
  const scoreClass = scoreBadgeClass(darkMode)
  const exitClass = actionButtonClass(darkMode)
  const infoTextClass = bodyTextClass(darkMode)

  if (phase === 'instructions') {
    return (
      <InstructionCard
        darkMode={darkMode}
        title="🎪 Memory Ingredient Match"
        objective="Flip cards and pair ingredients that belong to the same theme."
        controls="Click two cards at a time to reveal and compare them."
        scoring="Each match gives points plus time bonus. Faster matching earns more."
        win="Find all six pairs before time runs out."
        onStart={resetGame}
        onExit={onExit}
      />
    )
  }

  return (
    <main className={`min-h-screen px-6 py-8 ${gameShell(darkMode)}`}>
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-orange-500">🎪 Memory Ingredient Match</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
            <span className={scoreClass}>Score: {score}</span>
            <span className="rounded-lg bg-cyan-300 px-3 py-1 text-slate-900">Time: {timeLeft}s</span>
            <span className="rounded-lg bg-yellow-300 px-3 py-1 text-slate-900">Matches: {matches}/6</span>
            <button
              type="button"
              onClick={requestExit}
              className={exitClass}
            >
              Exit Game
            </button>
          </div>
        </div>

        {phase === 'gameover' ? (
          <GameOverCard
            darkMode={darkMode}
            title="🎪 Memory Match Complete"
            score={score}
            pointsEarned={pointsEarned}
            onReplay={resetGame}
            onBack={() => onGameEnd(pointsEarned, score)}
          />
        ) : (
          <div className={panelShell(darkMode)}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {deck.map((card, index) => {
                const isOpen = flipped.includes(index) || matchedIndexes.includes(index)
                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => clickCard(index)}
                    className={`h-20 rounded-lg border-2 text-sm font-extrabold transition ${
                      matchedIndexes.includes(index)
                        ? 'border-emerald-300 bg-emerald-500 text-white'
                        : isOpen
                          ? 'border-orange-300 bg-orange-100 text-slate-900'
                          : 'border-slate-500 bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {isOpen ? `${card.emoji} ${card.label}` : '❓ Hidden'}
                  </button>
                )
              })}
            </div>
            <p className={`mt-4 text-center text-base font-semibold ${infoTextClass}`}>Match by theme affinity: Street, Dessert, Fusion.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export function AccuracyShooterGame({ onGameEnd, onExit, soundEnabled, darkMode }: GameProps) {
  const [phase, setPhase] = useState<Phase>('instructions')
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [shots, setShots] = useState(0)
  const [timeLeft, setTimeLeft] = useState(25)
  const [targets, setTargets] = useState<Array<{ id: string; x: number; y: number; emoji: string }>>([])
  const ingredients = useMemo(() => ['🥭', '🌶️', '🧄', '🥥', '🍜', '🌽'], [])

  const resetGame = () => {
    setScore(0)
    setHits(0)
    setShots(0)
    setTimeLeft(25)
    setTargets([])
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPhase('gameover')
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return

    const spawnInterval = setInterval(() => {
      const emoji = ingredients[Math.floor(Math.random() * ingredients.length)]
      const id = crypto.randomUUID()
      setTargets((current) => [...current, { id, x: 8 + Math.random() * 84, y: 10 + Math.random() * 74, emoji }])

      setTimeout(() => {
        setTargets((current) => {
          const exists = current.some((target) => target.id === id)
          if (exists) {
            setShots((shotsCurrent) => shotsCurrent + 1)
          }
          return current.filter((target) => target.id !== id)
        })
      }, 1400)
    }, 650)

    return () => clearInterval(spawnInterval)
  }, [ingredients, phase])

  const clickTarget = (id: string) => {
    if (phase !== 'playing') return

    setTargets((current) => current.filter((target) => target.id !== id))
    setHits((current) => current + 1)
    setShots((current) => current + 1)
    const accuracy = shots + 1 > 0 ? (hits + 1) / (shots + 1) : 1
    const gained = Math.round(20 + accuracy * 60)
    setScore((current) => current + gained)
    playTone(soundEnabled, 640)
  }

  const registerMiss = () => {
    if (phase !== 'playing') return
    setShots((current) => current + 1)
    playTone(soundEnabled, 170, 0.12)
  }

  const requestExit = () => {
    if (window.confirm('Exit this game and return to mini-games menu?')) {
      onExit()
    }
  }

  const accuracy = shots > 0 ? (hits / shots) * 100 : 0
  const pointsEarned = Math.floor(score * 0.18)
  const scoreClass = scoreBadgeClass(darkMode)
  const exitClass = actionButtonClass(darkMode)

  if (phase === 'instructions') {
    return (
      <InstructionCard
        darkMode={darkMode}
        title="🎯 Accuracy Shooter"
        objective="Click moving ingredient targets before they disappear."
        controls="Click targets quickly; avoid empty clicks to keep high accuracy."
        scoring="Higher hit accuracy gives bigger points per target."
        win="Maintain high accuracy and fast reactions for top score in 25 seconds."
        onStart={resetGame}
        onExit={onExit}
      />
    )
  }

  return (
    <main className={`min-h-screen px-6 py-8 ${gameShell(darkMode)}`}>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-orange-500">🎯 Accuracy Shooter</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
            <span className={scoreClass}>Score: {score}</span>
            <span className="rounded-lg bg-cyan-300 px-3 py-1 text-slate-900">Time: {timeLeft}s</span>
            <span className="rounded-lg bg-yellow-300 px-3 py-1 text-slate-900">Accuracy: {accuracy.toFixed(1)}%</span>
            <button
              type="button"
              onClick={requestExit}
              className={exitClass}
            >
              Exit Game
            </button>
          </div>
        </div>

        {phase === 'gameover' ? (
          <GameOverCard
            darkMode={darkMode}
            title="🎯 Accuracy Shooter Complete"
            score={score}
            pointsEarned={pointsEarned}
            onReplay={resetGame}
            onBack={() => onGameEnd(pointsEarned, score)}
          />
        ) : (
          <div className={panelShell(darkMode)}>
            <div
              role="presentation"
              onClick={registerMiss}
              className="relative h-[27rem] cursor-crosshair rounded-xl border-2 border-orange-300 bg-gradient-to-b from-slate-800 to-slate-700"
            >
              {targets.map((target) => (
                <button
                  type="button"
                  key={target.id}
                  onClick={(event) => {
                    event.stopPropagation()
                    clickTarget(target.id)
                  }}
                  className="absolute flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-200 bg-yellow-400 text-2xl shadow-lg hover:scale-105"
                  style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {target.emoji}
                </button>
              ))}

              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-slate-900/80 px-3 py-1 text-sm font-semibold text-white">
                Click ingredients before they disappear.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

import { useEffect, useRef } from 'react'

const CHARS = [
  { id: 'gray',        color: '#9CA3AF', width: 52, height: 160, left: 0,   zIndex: 1, eyeSize: 15, eyeTop: 27, eyeGap: 6 },
  { id: 'black',       color: '#1a1a1a', width: 64, height: 300, left: 52,  zIndex: 2, eyeSize: 18, eyeTop: 36, eyeGap: 8 },
  { id: 'yellowTall',  color: '#C8A84B', width: 72, height: 200, left: 84,  zIndex: 4, eyeSize: 16, eyeTop: 30, eyeGap: 10, mouth: true },
  { id: 'yellowSmall', color: '#C8A84B', width: 54, height: 80,  left: 152, zIndex: 3, eyeSize: 14, eyeTop: 16, eyeGap: 8 },
]

function lerp(a, b, t) { return a + (b - a) * t }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function pupilOffset(eyeEl, mouse, maxOffset) {
  const r = eyeEl.getBoundingClientRect()
  const dx = mouse.x - (r.left + r.width / 2)
  const dy = mouse.y - (r.top + r.height / 2)
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return [0, 0]
  const f = Math.min(dist, maxOffset) / dist
  return [dx * f, dy * f]
}

export default function CharacterScene({ passwordFocused = false }) {
  const mouseRef       = useRef({ x: 0, y: 0 })
  const focusedRef     = useRef(false)
  const bodyRefs       = useRef([])
  const leftEyeRefs    = useRef([])
  const rightEyeRefs   = useRef([])
  const leftPupilRefs  = useRef([])
  const rightPupilRefs = useRef([])
  const smoothRef = useRef(
    CHARS.map(() => ({ rotate: 0, scaleY: 1, lPupilX: 0, lPupilY: 0, rPupilX: 0, rPupilY: 0 }))
  )
  const rafRef = useRef(null)

  useEffect(() => { focusedRef.current = passwordFocused }, [passwordFocused])

  useEffect(() => {
    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const LERP = 0.08
    const MAX_PUPIL = 4

    function tick() {
      const focused = focusedRef.current
      const mouse = mouseRef.current
      const vw = window.innerWidth
      const vh = window.innerHeight

      CHARS.forEach((_, i) => {
        const body   = bodyRefs.current[i]
        const lEye   = leftEyeRefs.current[i]
        const rEye   = rightEyeRefs.current[i]
        const lPupil = leftPupilRefs.current[i]
        const rPupil = rightPupilRefs.current[i]
        if (!body || !lEye || !rEye || !lPupil || !rPupil) return

        const s = smoothRef.current[i]
        let tRotate = 0, tScaleY = 1
        let tLPX = 0, tLPY = 0, tRPX = 0, tRPY = 0

        if (focused) {
          tLPY = MAX_PUPIL
          tRPY = MAX_PUPIL
        } else {
          const br = body.getBoundingClientRect()
          const bcx = br.left + br.width / 2
          tRotate = clamp((mouse.x - bcx) / vw * 30, -5, 5)
          tScaleY = 1 + clamp(1 - mouse.y / vh, 0, 1) * 0.12

          const [lpx, lpy] = pupilOffset(lEye, mouse, MAX_PUPIL)
          const [rpx, rpy] = pupilOffset(rEye, mouse, MAX_PUPIL)
          tLPX = lpx; tLPY = lpy
          tRPX = rpx; tRPY = rpy
        }

        s.rotate  = lerp(s.rotate,  tRotate, LERP)
        s.scaleY  = lerp(s.scaleY,  tScaleY, LERP)
        s.lPupilX = lerp(s.lPupilX, tLPX,    LERP)
        s.lPupilY = lerp(s.lPupilY, tLPY,    LERP)
        s.rPupilX = lerp(s.rPupilX, tRPX,    LERP)
        s.rPupilY = lerp(s.rPupilY, tRPY,    LERP)

        body.style.transform   = `scaleY(${s.scaleY}) rotate(${s.rotate}deg)`
        lPupil.style.transform = `translate(${s.lPupilX}px, ${s.lPupilY}px)`
        rPupil.style.transform = `translate(${s.rPupilX}px, ${s.rPupilY}px)`
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 240, height: 380 }}>
      {CHARS.map((char, i) => {
        const pupilSize = Math.round(char.eyeSize * 0.5)
        const eyeRefs = [
          [leftEyeRefs,  leftPupilRefs],
          [rightEyeRefs, rightPupilRefs],
        ]
        return (
          <div
            key={char.id}
            ref={el => bodyRefs.current[i] = el}
            style={{
              position: 'absolute', bottom: 0, left: char.left,
              width: char.width, height: char.height,
              backgroundColor: char.color,
              borderRadius: '999px 999px 0 0',
              transformOrigin: 'bottom center',
              zIndex: char.zIndex,
              willChange: 'transform',
            }}
          >
            <div style={{ position: 'absolute', top: char.eyeTop, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: char.eyeGap }}>
              {eyeRefs.map(([eyeR, pupilR], j) => (
                <div
                  key={j}
                  ref={el => eyeR.current[i] = el}
                  style={{ width: char.eyeSize, height: char.eyeSize, borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}
                >
                  <div
                    ref={el => pupilR.current[i] = el}
                    style={{ width: pupilSize, height: pupilSize, borderRadius: '50%', backgroundColor: '#111', flexShrink: 0, willChange: 'transform' }}
                  />
                </div>
              ))}
            </div>

            {char.mouth && (
              <div style={{ position: 'absolute', top: char.eyeTop + char.eyeSize + 12, left: '50%', transform: 'translateX(-50%)', width: Math.round(char.width * 0.45), height: 2, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 1 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

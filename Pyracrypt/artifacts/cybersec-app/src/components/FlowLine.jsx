import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { QuadraticBezierLine } from '@react-three/drei'
import { Vector3 } from 'three'

import { cssVarColor } from '../utils/cssVarColor'

export function FlowLine({ from, to, vulnerable }) {
  const lineRef = useRef()
  const primary = useMemo(() => cssVarColor('--primary'), [])
  const danger = useMemo(() => cssVarColor('--danger'), [])

  const { start, mid, end } = useMemo(() => {
    const a = new Vector3(...from)
    const b = new Vector3(...to)
    const m = a.clone().lerp(b, 0.5).add(new Vector3(0, 0.55, 0.35))
    return { start: a, mid: m, end: b }
  }, [from, to])

  const color = vulnerable ? danger : primary

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!lineRef.current) return
    const mat = lineRef.current.material
    if (mat && 'dashOffset' in mat) {
      mat.dashOffset = t * (vulnerable ? 1.8 : 0.9)
    }
  })

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={start}
      end={end}
      mid={mid}
      color={color}
      lineWidth={vulnerable ? 3.2 : 2.2}
      dashed
      dashScale={vulnerable ? 5 : 3}
      gapSize={0.25}
      dashSize={0.35}
    />
  )
}

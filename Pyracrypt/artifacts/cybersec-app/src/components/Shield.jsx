import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import { cssVarColor } from '../utils/cssVarColor'

export function Shield({ expanded, phase }) {
  const ref = useRef()
  const accent = useMemo(() => cssVarColor('--accent'), [])
  const success = useMemo(() => cssVarColor('--success'), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    const breathe = 1 + Math.sin(t * 2.2) * 0.02
    const base = expanded ? 1.25 : 1.05
    ref.current.scale.setScalar(base * breathe)
  })

  const color = phase === 'REMEDY' ? success : accent

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.05, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        transmission={0.62}
        thickness={0.35}
        roughness={0.15}
        metalness={0.1}
        transparent
        opacity={0.22}
        emissive={color}
        emissiveIntensity={expanded ? 0.35 : 0.18}
        clearcoat={1}
        clearcoatRoughness={0.15}
      />
    </mesh>
  )
}

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  Matrix4,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  Quaternion,
  TubeGeometry,
  Vector3,
} from 'three'

import { cssVarColor } from '../utils/cssVarColor.js'

const TUBE_RADIUS   = 0.023
const INNER_RADIUS  = 0.016
const TUBULAR       = 160
const RADIAL        = 6
const BARB_COUNT    = 40        // dense — like real concertina wire
const tmpColor = new Color()
const yAxis    = new Vector3(0, 1, 0)

// Outer coil — slight ripple/wave to look organic
function buildCoilCurve(radius) {
  const pts = []
  for (let i = 0; i < 18; i++) {
    const u = i / 18
    const a = u * Math.PI * 2
    const ripple = Math.sin(a * 2.5) * 0.08 * radius
    const lift   = Math.sin(a * 1.8) * 0.13 * radius
    pts.push(new Vector3(
      Math.cos(a) * (radius + ripple),
      lift,
      Math.sin(a) * (radius + ripple),
    ))
  }
  return new CatmullRomCurve3(pts, true, 'catmullrom', 0.38)
}

// Inner strand — slightly smaller, counter-rotates for twisted look
function buildInnerCurve(outer) {
  const pts = outer.getSpacedPoints(120).map(p => p.clone().multiplyScalar(0.84))
  return new CatmullRomCurve3(pts, true, 'catmullrom', 0.38)
}

// 4 blades per barb position — matching razor/concertina wire
function computeBarbMatrices(outerCurve) {
  const matrices = []
  for (let i = 0; i < BARB_COUNT; i++) {
    const u      = i / BARB_COUNT
    const pos    = outerCurve.getPointAt(u)
    const tan    = outerCurve.getTangentAt(u).normalize()
    let radial   = pos.clone()
    if (radial.lengthSq() < 1e-8) radial.set(1, 0, 0)
    else radial.normalize()

    let side = new Vector3().crossVectors(tan, radial)
    if (side.lengthSq() < 1e-10) side = new Vector3().crossVectors(tan, new Vector3(0, 1, 0))
    side.normalize()

    const outward = new Vector3().crossVectors(side, tan).normalize()
    const attach  = pos.clone().addScaledVector(outward, TUBE_RADIUS * 0.9)

    // 4 blades at 0°, 90°, 180°, 270° around the wire axis — true razor wire pattern
    const angles = [0.55, -0.55, Math.PI / 2 + 0.3, -Math.PI / 2 - 0.3]
    for (const ang of angles) {
      const dir = outward.clone().applyAxisAngle(tan, ang).normalize()
      const q   = new Quaternion().setFromUnitVectors(yAxis, dir)
      const sc  = 0.95
      matrices.push(new Matrix4().compose(
        attach.clone().addScaledVector(dir, 0.05),
        q,
        new Vector3(sc, sc, sc),
      ))
    }
  }
  return matrices
}

function WireSparks({ curve, active }) {
  const ref   = useRef()
  const n     = 32
  const seeds = useMemo(() => Array.from({ length: n }, () => Math.random()), [])
  const geo   = useMemo(() => {
    const g   = new BufferGeometry()
    const arr = new Float32Array(n * 3)
    g.setAttribute('position', new BufferAttribute(arr, 3))
    return g
  }, [])
  const accent = useMemo(() => cssVarColor('--accent'), [])
  const danger = useMemo(() => cssVarColor('--danger'), [])
  const mat    = useMemo(() => new PointsMaterial({
    color: accent, size: 0.055, transparent: true, opacity: 0,
    depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true,
  }), [accent])

  useFrame(st => {
    if (!curve || !ref.current) return
    const t    = st.clock.elapsedTime
    const attr = ref.current.geometry.attributes.position
    if (!attr) return
    for (let i = 0; i < n; i++) {
      const u = (seeds[i] + t * 0.07 * (active ? 1.6 : 0.2)) % 1
      const p = curve.getPointAt(u)
      const j = active ? Math.sin(t * 42 + i) * 0.08 : Math.sin(t * 5 + i) * 0.018
      attr.setXYZ(i, p.x + j * 0.5, p.y + j, p.z + j * 0.5)
    }
    attr.needsUpdate     = true
    mat.opacity          = active ? 0.5 + Math.sin(t * 20) * 0.28 : 0.07
    mat.color.copy(active ? danger.clone().lerp(accent, 0.3 + 0.3 * Math.sin(t * 16)) : accent)
    mat.size             = active ? 0.075 + Math.sin(t * 30) * 0.025 : 0.04
  })

  if (!curve) return null
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />
}

export function BarbedWire({ radius = 0.72, state: mode = 'idle' }) {
  const root      = useRef()
  const innerRef  = useRef()
  const barbRef   = useRef()

  const wireMetal = useMemo(() => cssVarColor('--wire-metal'), [])
  const wireDark  = useMemo(() => cssVarColor('--wire-shadow'), [])
  const danger    = useMemo(() => cssVarColor('--danger'), [])
  const accent    = useMemo(() => cssVarColor('--accent'), [])

  const outerCurve    = useMemo(() => buildCoilCurve(radius),      [radius])
  const innerCurve    = useMemo(() => buildInnerCurve(outerCurve), [outerCurve])
  const barbMatrices  = useMemo(() => computeBarbMatrices(outerCurve), [outerCurve])

  const outerTube = useMemo(() => new TubeGeometry(outerCurve, TUBULAR, TUBE_RADIUS, RADIAL, true),   [outerCurve])
  const innerTube = useMemo(() => new TubeGeometry(innerCurve, TUBULAR, INNER_RADIUS, RADIAL, true),   [innerCurve])

  // Razor blades: thin, long, sharp 3-sided spikes — matching the photo
  const bladeGeo  = useMemo(() => new ConeGeometry(0.016, 0.26, 3, 1), [])

  const outerMat  = useMemo(() => new MeshStandardMaterial({
    color: wireMetal.clone(), metalness: 1, roughness: 0.28,
    emissive: wireDark.clone(), emissiveIntensity: 0.06,
  }), [wireMetal, wireDark])

  const innerMat  = useMemo(() => new MeshStandardMaterial({
    color: wireDark.clone(), metalness: 1, roughness: 0.35,
    emissive: accent.clone(), emissiveIntensity: 0.04,
  }), [wireDark, accent])

  const bladeMat  = useMemo(() => new MeshStandardMaterial({
    color: wireDark.clone(), metalness: 1, roughness: 0.22,
    emissive: wireMetal.clone(), emissiveIntensity: 0.1,
  }), [wireDark, wireMetal])

  useLayoutEffect(() => {
    if (!barbRef.current) return
    barbMatrices.forEach((m, i) => barbRef.current.setMatrixAt(i, m))
    barbRef.current.instanceMatrix.needsUpdate = true
  }, [barbMatrices])

  useFrame(st => {
    const t      = st.clock.elapsedTime
    const g      = root.current
    const inner  = innerRef.current
    if (!g || !inner) return

    const attack = mode === 'attack'
    const lock   = mode === 'lockdown'

    if (!lock) {
      g.rotation.y     += attack ? 0.012 : 0.003
      g.rotation.x      = Math.sin(t * (attack ? 2.2 : 0.8)) * (attack ? 0.065 : 0.022)
    } else {
      g.rotation.y     *= 0.92
      g.rotation.x     *= 0.9
    }
    inner.rotation.y   += lock ? 0 : attack ? -0.02 : -0.007

    const tighten = attack ? 0.88 : lock ? 0.82 : 1
    g.scale.setScalar(tighten)

    const vib = attack && !lock
      ? Math.sin(t * 44) * 0.016 + Math.cos(t * 31) * 0.009
      : mode === 'idle' && !lock
        ? Math.sin(t * 5.5) * 0.003
        : 0
    g.position.set(vib, lock ? -0.01 : vib * 0.6, -vib * 0.4)

    // Color animation
    const k = attack ? 0.6 + 0.25 * Math.sin(t * 18) : lock ? 0.12 : 0
    tmpColor.copy(wireMetal).lerp(danger, k)
    outerMat.color.copy(tmpColor)
    outerMat.emissive.copy(wireDark.clone().lerp(danger, k * 0.8))
    outerMat.emissiveIntensity = 0.06 + k * 0.6

    bladeMat.color.copy(wireDark.clone().lerp(danger, k * 0.75))
    bladeMat.emissive.copy(wireMetal.clone().lerp(danger, k * 0.55))
    bladeMat.emissiveIntensity = 0.1 + k * 0.5

    innerMat.emissiveIntensity = 0.04 + (attack ? 0.25 * Math.abs(Math.sin(t * 24)) : 0)
  })

  return (
    <group ref={root}>
      <mesh geometry={outerTube} material={outerMat} />
      <mesh ref={innerRef} geometry={innerTube} material={innerMat} />
      <instancedMesh
        ref={barbRef}
        args={[bladeGeo, bladeMat, barbMatrices.length]}
        frustumCulled={false}
      />
      <WireSparks curve={outerCurve} active={mode === 'attack'} />
    </group>
  )
}

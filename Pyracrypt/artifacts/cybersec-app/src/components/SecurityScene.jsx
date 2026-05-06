import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { usePipelineStore } from '../store/usePipelineStore'
import { AttackParticles } from './AttackParticles.jsx'
import { FlowLine } from './FlowLine.jsx'
import { NodeMesh } from './NodeMesh.jsx'
import { Shield } from './Shield.jsx'

const DEMO_NODES = [
  { node_id: 'd0', id: 'API Gateway',    position: [ 3.0,  0.0,  0.2] },
  { node_id: 'd1', id: 'Auth Service',   position: [ 1.5,  2.6, -0.3] },
  { node_id: 'd2', id: 'Database',       position: [-1.5,  2.6,  0.1] },
  { node_id: 'd3', id: 'Event Bus',      position: [-3.0,  0.0, -0.2] },
  { node_id: 'd4', id: 'ML Pipeline',    position: [-1.5, -2.6,  0.3] },
  { node_id: 'd5', id: 'Storage Layer',  position: [ 1.5, -2.6, -0.1] },
]

const DEMO_EDGES = [
  { id: 'e0', from: DEMO_NODES[0].position, to: DEMO_NODES[1].position, trust: 0.9 },
  { id: 'e1', from: DEMO_NODES[1].position, to: DEMO_NODES[2].position, trust: 0.7 },
  { id: 'e2', from: DEMO_NODES[2].position, to: DEMO_NODES[3].position, trust: 0.8 },
  { id: 'e3', from: DEMO_NODES[3].position, to: DEMO_NODES[4].position, trust: 0.6 },
  { id: 'e4', from: DEMO_NODES[4].position, to: DEMO_NODES[5].position, trust: 0.85 },
  { id: 'e5', from: DEMO_NODES[5].position, to: DEMO_NODES[0].position, trust: 0.75 },
  { id: 'e6', from: DEMO_NODES[0].position, to: DEMO_NODES[3].position, trust: 0.5 },
  { id: 'e7', from: DEMO_NODES[1].position, to: DEMO_NODES[4].position, trust: 0.6 },
]

function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch { return false }
}

function SceneContent() {
  const laidOutNodes = usePipelineStore(s => s.laidOutNodes)
  const laidOutEdges = usePipelineStore(s => s.laidOutEdges)
  const visualPhase  = usePipelineStore(s => s.visualPhase)
  const busy         = usePipelineStore(s => s.busy)
  const mutated      = usePipelineStore(s => s.mutated)

  const hasRealData = laidOutNodes.length > 0
  const nodes       = hasRealData ? laidOutNodes : DEMO_NODES
  const edges       = hasRealData ? laidOutEdges : DEMO_EDGES

  const attackMode = visualPhase === 'ATTACK'
  const discovery  = visualPhase === 'DISCOVERY'
  const remedy     = visualPhase === 'REMEDY'
  const vulnerable = Boolean(mutated?.findings?.some(f => f.vulnerable)) || attackMode

  return (
    <>
      <color attach="background" args={['#06060c']} />

      {/* Desaturated editorial lighting — red, gold, steel blue */}
      <ambientLight intensity={0.20} color="#c0b8a8" />
      <directionalLight position={[ 8, 10,  5]} intensity={0.9} color="#d0c8b8" />
      <directionalLight position={[-6, -3, -4]} intensity={0.5} color="#203860" />

      {/* Coloured point lights — muted, not neon */}
      <pointLight position={[ 0,  0,  0]} intensity={2.5}  distance={14} color="#6a2878" />
      <pointLight position={[ 4,  3,  2]} intensity={1.0}  distance={10} color="#9a3020" />
      <pointLight position={[-4, -3, -2]} intensity={0.7}  distance={8}  color="#203860" />
      <pointLight position={[ 0,  5, -4]} intensity={0.5}  distance={12} color="#9a7830" />

      <Stars radius={100} depth={60} count={3500} factor={3} saturation={0.0} fade speed={0.25} />

      <group>
        {edges.map(e => (
          <FlowLine key={e.id} from={e.from} to={e.to} vulnerable={vulnerable && hasRealData} />
        ))}

        <AttackParticles edges={edges} active={attackMode} />

        {(remedy || discovery) && hasRealData && (
          <Shield expanded={remedy} phase={visualPhase} />
        )}

        {nodes.map(n => (
          <group key={n.node_id} position={n.position}>
            <group scale={0.62}>
              <NodeMesh
                position={[0, 0, 0]}
                label={n.id}
                activity={(discovery || busy) && hasRealData}
                attackShake={attackMode && hasRealData}
                phase={visualPhase}
              />
            </group>
          </group>
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={4}
        maxDistance={18}
        autoRotate
        autoRotateSpeed={hasRealData ? 0.3 : 0.45}
      />
    </>
  )
}

export function SecurityScene() {
  const [webgl] = useState(() => isWebGLAvailable())

  if (!webgl) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#5a5450', fontSize: 11, background: '#06060c',
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        WebGL not available
      </div>
    )
  }

  return (
    <div style={{ height: '100%', width: '100%', background: '#06060c' }}>
      <Canvas camera={{ position: [0, 2.2, 8.5], fov: 46 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}

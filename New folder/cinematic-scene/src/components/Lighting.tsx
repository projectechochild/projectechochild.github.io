import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { DirectionalLight } from 'three'

export default function Lighting() {
  const moonlightRef = useRef<DirectionalLight>(null)

  useFrame((state) => {
    if (!moonlightRef.current) return
    const t = state.clock.elapsedTime
    moonlightRef.current.position.x = Math.sin(t * 0.05) * 0.5 + 5
    moonlightRef.current.position.z = Math.cos(t * 0.05) * 0.5 - 3
  })

  return (
    <>
      {/* Subtle ambient fill - dark blue tint */}
      <ambientLight intensity={0.04} color="#1a1a2e" />

      {/* Main moonlight - soft directional */}
      <directionalLight
        ref={moonlightRef}
        position={[5, 8, -3]}
        intensity={0.9}
        color="#b0c4de"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {/* Rim light from behind - purple tint for eerie feel */}
      <pointLight
        position={[-3, 2, -4]}
        intensity={0.25}
        color="#4a0e3c"
        distance={15}
        decay={2}
      />

      {/* Subtle fill from front */}
      <pointLight
        position={[0, 1, 5]}
        intensity={0.15}
        color="#1a1a3e"
        distance={10}
        decay={2}
      />

      {/* Ground shadow softener */}
      <hemisphereLight
        args={['#1a1a2e', '#050510', 0.1]}
      />
    </>
  )
}

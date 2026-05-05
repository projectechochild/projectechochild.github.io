import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Character from './Character'
import Lighting from './Lighting'
import SceneEnvironment from './Environment'
import PostProcessing from './PostProcessing'
import CameraRig from './CameraRig'
import * as THREE from 'three'

function LoadingFallback() {
  return null
}

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.8,
        outputColorSpace: THREE.SRGBColorSpace,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      camera={{
        fov: 35,
        near: 0.1,
        far: 100,
        position: [0, 1.5, 6],
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <SceneEnvironment />
        <Lighting />
        <Character position={[0, -1.5, 0]} />
        <PostProcessing />
        <CameraRig />
      </Suspense>
    </Canvas>
  )
}

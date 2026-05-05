import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'

export default function CameraRig() {
  const cameraRef = useRef<PerspectiveCamera | null>(null)

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera
    if (!camera) return

    const t = state.clock.elapsedTime

    camera.position.x = Math.sin(t * 0.15) * 0.08
    camera.position.y = 1.5 + Math.sin(t * 0.2 + 1.5) * 0.05
    camera.position.z = 6 + Math.sin(t * 0.1) * 0.03

    camera.lookAt(0, 0.8, 0)
  })

  return null
}

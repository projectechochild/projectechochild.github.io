import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

export default function Character({ position = [0, -1.5, 0] as [number, number, number] }) {
  const groupRef = useRef<Group>(null)
  const breathingRef = useRef(0)

  useFrame((state) => {
    if (!groupRef.current) return
    breathingRef.current += state.clock.delta * 1.5
    const breath = Math.sin(breathingRef.current) * 0.015
    groupRef.current.scale.y = 1 + breath
    groupRef.current.position.y = position[1] + Math.abs(breath) * 0.2
  })

  const skinMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#2a1a1a',
        roughness: 0.7,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        emissive: '#1a0a0a',
        emissiveIntensity: 0.15,
      }),
    []
  )

  const clothingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a0f',
        roughness: 0.9,
        metalness: 0.05,
        emissive: '#050510',
        emissiveIntensity: 0.1,
      }),
    []
  )

  const shoeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f0a0a',
        roughness: 0.95,
        metalness: 0.0,
      }),
    []
  )

  return (
    <group ref={groupRef} position={position}>
      {/* Head - slightly elongated sphere */}
      <mesh position={[0, 2.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 32, 32]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      {/* Face - subtle features */}
      <mesh position={[0, 2.85, 0.22]} castShadow>
        <sphereGeometry args={[0.27, 32, 32]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      {/* Eyes - dark voids */}
      <mesh position={[-0.09, 2.9, 0.26]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.09, 2.9, 0.26]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Body - tapered cylinder */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 1.2, 16]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.25, 12]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      {/* Left Arm - elongated */}
      <mesh position={[-0.45, 1.9, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 12]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      {/* Left Hand */}
      <mesh position={[-0.68, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      {/* Right Arm - elongated */}
      <mesh position={[0.45, 1.9, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 12]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      {/* Right Hand */}
      <mesh position={[0.68, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      {/* Left Leg - long */}
      <mesh position={[-0.12, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 1.1, 12]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.12, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 1.1, 12]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      {/* Left Shoe */}
      <mesh position={[-0.12, 0.15, 0.05]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.2]} />
        <primitive object={shoeMaterial} attach="material" />
      </mesh>
      {/* Right Shoe */}
      <mesh position={[0.12, 0.15, 0.05]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.2]} />
        <primitive object={shoeMaterial} attach="material" />
      </mesh>
      {/* Subtle glow from within - eerie effect */}
      <pointLight
        color="#4a0e3c"
        intensity={0.3}
        distance={2}
        position={[0, 1.5, 0]}
      />
    </group>
  )
}

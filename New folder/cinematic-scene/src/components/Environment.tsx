import { Environment as DreiEnvironment, Sky } from '@react-three/drei'

export default function SceneEnvironment() {
  return (
    <>
      {/* HDR Environment map for image-based lighting */}
      <DreiEnvironment
        files="/hdri/lakeside_night.exr"
        background={false}
      />

      {/* Dark atmospheric background color */}
      <color attach="background" args={['#050510']} />

      {/* Fog for depth and atmosphere */}
      <fog attach="fog" args={['#050510', 8, 25]} />

      {/* Ground plane - receives shadows, dark */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#0a0a0f"
          roughness={0.95}
          metalness={0.0}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Subtle ground fog plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          color="#0a0a1a"
          transparent
          opacity={0.15}
        />
      </mesh>
    </>
  )
}

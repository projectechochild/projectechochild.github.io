import { EffectComposer, DepthOfField, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export default function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      {/* Depth of Field - focus on character, blur background */}
      <DepthOfField
        focusDistance={0.012}
        focalLength={0.015}
        bokehScale={4}
        height={480}
      />

      {/* Subtle Bloom - only brighter areas glow */}
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.6}
      />

      {/* Film Grain - subtle texture */}
      <Noise
        opacity={0.035}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* Vignette - dark corners, cinematic frame */}
      <Vignette
        eskil={false}
        offset={0.3}
        darkness={1.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}

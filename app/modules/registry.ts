// app/modules/registry.ts
import type { PromptKeyModule } from './types'
import type { EntityCapablePromptKeyModule } from './entityContracts'
import { StyleModule } from './style.freeform'
import { TextureModule } from './texture.freeform'
import { FormModule } from './form.freeform'
import { BackgroundModule } from './background.module'
import { LightingModule } from './lighting.freeform'
import { FramingModule } from './framing.module'
import { PoseModule } from './pose.freeform'
import { HairModule } from './hair.semantic'
import { ExpressionModule } from './expression.freeform'
import { OutfitModule } from './outfit.semantic'
import { EffectsModule } from './effects.module'
import { CameraModule } from './camera.module'
import { ColorPaletteModule } from './colorPalette.module'
import { TypographyModule } from './typography.module'
import { VariablesModule } from './variables.module'
import { LayoutModule } from './layout.module'
import { SceneModule } from './scene.module'
import { withSemanticTargetCapabilities } from './semanticTargetCapabilities'
import { withModuleEntityCapabilities } from './entityCapabilities'

const registeredModules = [
  VariablesModule,
  LayoutModule,
  SceneModule,
  StyleModule,
  FormModule,
  FramingModule,
  ExpressionModule,
  PoseModule,
  HairModule,
  OutfitModule,
  BackgroundModule,
  LightingModule,
  CameraModule,
  ColorPaletteModule,
  TypographyModule,
  EffectsModule,
  TextureModule,
] satisfies PromptKeyModule[]

export const promptModules = registeredModules.map((module) =>
  withModuleEntityCapabilities(withSemanticTargetCapabilities(module)),
) satisfies EntityCapablePromptKeyModule[]

export function getPromptModuleByKey(key: string) {
  return promptModules.find((module) => module.key === key)
}

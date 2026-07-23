// app/modules/registry.ts
import type { PromptKeyModule } from './types'
import { StyleModule } from './style.module'
import { TextureModule } from './texture.module'
import { DeformationModule } from './deformation.module'
import { BackgroundModule } from './background.module'
import { LightingModule } from './lighting.module'
import { FramingModule } from './framing.module'
import { PoseModule } from './pose.module'
import { HairModule } from './hair.module'
import { ExpressionModule } from './expression.module'
import { OutfitModule } from './outfit.module'
import { EffectsModule } from './effects.module'
import { CameraModule } from './camera.module'
import { ColorPaletteModule } from './colorPalette.module'
import { TypographyModule } from './typography.module'
import { VariablesModule } from './variables.module'

export const promptModules = [
  VariablesModule,
  StyleModule,
  DeformationModule,
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

export function getPromptModuleByKey(key: string) {
  return promptModules.find((module) => module.key === key)
}
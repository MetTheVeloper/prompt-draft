// app/modules/registry.ts
import type { PromptKeyModule } from './types'
import { StyleModule } from './style.semantic'
import { TextureModule } from './texture.semantic'
import { FormModule } from './form.semantic'
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
import { LayoutModule } from './layout.module'

export const promptModules = [
  VariablesModule,
  LayoutModule,
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

export function getPromptModuleByKey(key: string) {
  return promptModules.find((module) => module.key === key)
}

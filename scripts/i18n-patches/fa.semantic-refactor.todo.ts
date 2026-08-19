// Prompt Draft semantic-refactor translation ledger.
//
// This file intentionally mirrors every English semantic i18n patch that must
// eventually receive a Persian translation. The exported object is flat and
// compatible with scripts/merge-i18n.ts, but the values are still English
// source text for now. DO NOT merge this file into fa.ts until the values have
// been translated to Persian.
//
// Whenever a new semantic English patch is added during this refactor, add it
// here as well. At the end of the refactor this file becomes the single source
// for the final Persian translation pass.

import style from "./en.style-semantics"
import form from "./en.form-semantics"
import transformationScope from "./en.transformation-scope-semantics"
import layout from "./en.layout-semantics"
import layoutRegions from "./en.layout-region-semantics"
import framing from "./en.framing-semantics"
import framingCrossModule from "./en.framing-cross-module"
import camera from "./en.camera-semantics"
import lighting from "./en.lighting-semantics"
import colorPalette from "./en.color-palette-semantics"

export default {
  ...style,
  ...form,
  ...transformationScope,
  ...layout,
  ...layoutRegions,
  ...framing,
  ...framingCrossModule,
  ...camera,
  ...lighting,
  ...colorPalette,
} as const

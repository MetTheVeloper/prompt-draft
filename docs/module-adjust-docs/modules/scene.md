# Scene module

Module key: `scene`
Sources: `app/modules/scene.module.ts`, `app/modules/scene.types.ts`

## Real fields

### `scenes`
- Type: structured `sceneEntities` editor
- Default: `[]`
- This module currently has no ordinary select fields and no module-wide override field.

The selectable/editable scene structure is defined by the scene entity schema and the editor that consumes it. Read `app/modules/scene.types.ts` and current scene editor code before recommending concrete nested properties.

## Recommendation rules

Treat Scene as a structured entity module. Never invent flat Scene fields just to express an idea. If the user's request is better represented by Background, Layout, Lighting, or another registered module, say so rather than fabricating Scene settings.
export default {
  title: 'Scenes',
  description: 'Compose reusable nested scene definitions with stable references to named module configurations.',
  groups: {
    scenes: {
      title: 'Scene Composition',
      description: 'Create and manage reusable Scene definitions.',
    },
  },
  fields: {
    scenes: {
      label: 'Scenes',
      description: 'Define Scenes with nested descriptions and optional module configuration references.',
    },
  },
  editor: {
    descriptionPlaceholder: 'Describe this Scene using nested variables, actions, expressions, and local context.',
    extraDetailsPlaceholder: 'Add optional scene-specific instructions, constraints, or context.',
  },
  actions: {
    add: 'Add Scene',
  },
  empty: 'No Scenes yet. Add a Scene and define it with a nested Description.',
  layoutRequired: {
    title: 'Layout is inactive',
    description: 'Scene state remains saved and editable, but Scene definitions and Scene reference variables compile only while Layout is active.',
  },
  warnings: {
    missingComponent: 'A selected configuration is missing, disabled, or unavailable.',
    cardinality: 'This module allows only one configuration per Scene.',
  },
}

export default {
  title: 'Scene',
  description: 'Compose reusable scene content and stable references to named module configurations.',
  groups: {
    scenes: {
      title: 'Scene Composition',
      description: 'Create and manage reusable Scene entities.',
    },
  },
  fields: {
    scenes: {
      label: 'Scenes',
      description: 'Compose reusable Scene entities from content and named module configurations.',
    },
  },
  actions: {
    add: 'Add Scene',
  },
  empty: 'No Scenes yet. Add a Scene to compose content with named Form/Camera configurations.',
  layoutRequired: {
    title: 'Layout is inactive',
    description: 'Scene state remains saved and editable, but Scene definitions and Scene reference variables compile only while Layout is active.',
  },
  warnings: {
    missingContent: 'A selected content reference is missing or disabled.',
    missingComponent: 'A selected configuration is missing, disabled, or unavailable.',
    cardinality: 'This module allows only one configuration per Scene.',
  },
}

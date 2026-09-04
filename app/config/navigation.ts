// app/config/navigation.ts

export const NAVIGATION = [
  {
    name: 'create',
    to: '/create',
    icon: 'auto_fix_high',
  },
  {
    name: 'prompts',
    to: '/prompts',
    icon: 'code',
  },
  {
    name: 'history',
    to: '/history',
    icon: 'history',
  },
  {
    name: 'collage',
    to: '/collage',
    icon: 'photo_library',
  },
  {
    name: 'vectorizer',
    to: '/vectorizer',
    icon: 'shapes',
  },
  {
    name: 'guide',
    to: '/guide',
    icon: 'help',
  },
] as const

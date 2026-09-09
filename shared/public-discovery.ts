export type PublicDiscoveryInterestKey =
  | 'portrait_photography'
  | 'three_d_sculpture'
  | 'illustration_animation'
  | 'poster_editorial'
  | 'product_fashion'
  | 'cinematic_game_art'

export type PublicDiscoveryDefinition = {
  key: PublicDiscoveryInterestKey
  slug: string
  title: string
  description: string
  tags: readonly string[]
  icon: string
  messageKey: string
  descriptionKey: string
}

export const PUBLIC_DISCOVERY_INTERESTS = [
  {
    key: 'portrait_photography',
    slug: 'portrait-photography',
    title: 'Portraits & Photography',
    description: 'Portraits, photography, avatars, headshots and identity-led visuals.',
    tags: ['portrait', 'photography', 'avatar'],
    icon: 'portrait',
    messageKey: 'growth.discovery.interests.portraitPhotography.title',
    descriptionKey: 'growth.discovery.interests.portraitPhotography.description',
  },
  {
    key: 'three_d_sculpture',
    slug: '3d-sculpture',
    title: '3D & Sculpture',
    description: '3D characters, crafted objects, figurines and sculptural transformations.',
    tags: ['3d', 'sculpture'],
    icon: 'deployed_code',
    messageKey: 'growth.discovery.interests.threeDSculpture.title',
    descriptionKey: 'growth.discovery.interests.threeDSculpture.description',
  },
  {
    key: 'illustration_animation',
    slug: 'illustration-animation',
    title: 'Illustration & Animation',
    description: 'Illustration, anime, cartoons and animation-inspired visual styles.',
    tags: ['illustration', 'animation-style', 'anime', 'cartoon'],
    icon: 'brush',
    messageKey: 'growth.discovery.interests.illustrationAnimation.title',
    descriptionKey: 'growth.discovery.interests.illustrationAnimation.description',
  },
  {
    key: 'poster_editorial',
    slug: 'posters-editorial',
    title: 'Posters & Editorial',
    description: 'Poster design, covers, editorial compositions and publication-style visuals.',
    tags: ['poster', 'editorial'],
    icon: 'view_quilt',
    messageKey: 'growth.discovery.interests.posterEditorial.title',
    descriptionKey: 'growth.discovery.interests.posterEditorial.description',
  },
  {
    key: 'product_fashion',
    slug: 'product-fashion',
    title: 'Product & Fashion',
    description: 'Product imagery, advertising, clothing previews and fashion direction.',
    tags: ['product', 'fashion'],
    icon: 'styler',
    messageKey: 'growth.discovery.interests.productFashion.title',
    descriptionKey: 'growth.discovery.interests.productFashion.description',
  },
  {
    key: 'cinematic_game_art',
    slug: 'cinematic-game-art',
    title: 'Cinematic & Game Art',
    description: 'Cinematic scenes, game-inspired visuals, characters and dramatic worlds.',
    tags: ['cinematic', 'game-style', 'pixel-art'],
    icon: 'movie',
    messageKey: 'growth.discovery.interests.cinematicGameArt.title',
    descriptionKey: 'growth.discovery.interests.cinematicGameArt.description',
  },
] as const satisfies readonly PublicDiscoveryDefinition[]

export const PUBLIC_DISCOVERY_ROUTES = PUBLIC_DISCOVERY_INTERESTS.map(
  item => `/discover/${item.slug}`,
)

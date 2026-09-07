// KalaSetu AI — "Natural Heritage + Modern AI" design tokens.
// Palette: ivory / warm cream, sage green, terracotta clay, muted gold,
// charcoal / deep brown, off-white. No neon, no SaaS blue.
export const Colors = {
  ivory: '#FAF6EF',
  cream: '#F3EDE2',
  background: '#FBF9F4',
  card: '#FFFFFF',
  sage: '#5F7161',
  sageDeep: '#47543F',
  terracotta: '#C05B2E',
  terracottaDeep: '#9A4522',
  gold: '#B9975B',
  charcoal: '#2B2620',
  brown: '#5C4A3A',
  muted: '#8A7E70',
  line: '#E8E0D2',
  success: '#5F7161',
  danger: '#B23B2E',
};

export const Spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
export const Radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const Shadow = {
  card: {
    shadowColor: '#2B2620',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

export const Categories = [
  { slug: 'pottery-ceramics', label: 'Pottery & Terracotta', icon: '🏺' },
  { slug: 'handloom-textiles', label: 'Handloom & Textiles', icon: '🧵' },
  { slug: 'metal-brass', label: 'Brass & Metal Craft', icon: '🪔' },
  { slug: 'bamboo-cane', label: 'Bamboo & Cane', icon: '🎋' },
  { slug: 'woodcraft', label: 'Wood Craft', icon: '🪵' },
  { slug: 'folk-art', label: 'Folk Art', icon: '🎨' },
  { slug: 'jewelry', label: 'Jewelry', icon: '📿' },
  { slug: 'home-decor', label: 'Handmade Decor', icon: '🏠' },
];

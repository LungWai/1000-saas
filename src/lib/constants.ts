export const GRID_CONFIG = {
  TOTAL_GRIDS: 1000,
  BREAKPOINTS: {
    sm: { columns: 8, size: '150px' },
    md: { columns: 12, size: '150px' },
    lg: { columns: 20, size: '150px' },
    xl: { columns: 24, size: '150px' }
  },
  HOVER_ANIMATION_DURATION: '300ms',
  HOVER_SCALE: 3,
  EMPTY_GRID_COLOR: '#f5f5f5',
  GRID_BORDER: '1px solid #e0e0e0',
  HOVER_Z_INDEX: 50
} as const;

export const PRICING = {
  BASE_PRICE: 4.99,
  CURRENCY: 'usd',
} as const;

export const CONTENT_LIMITS = {
  TEXT: {
    TITLE_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 250,
  },
  IMAGE: {
    MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
    MAX_SIZE_MB: 2,
  },
} as const;

export const API_ROUTES = {
  GRIDS: {
    LIST: '/api/grids',
    DETAIL: (id: string) => `/api/grids/${id}`,
    SUBSCRIBE: '/api/grids/subscribe',
    UPDATE_CONTENT: (id: string) => `/api/grids/${id}/content`,
    UPDATE_URL: (id: string) => `/api/grids/${id}/url`,
  },
  USER: {
    GRIDS: '/api/user/grids',
    PROFILE: '/api/user/profile',
    SUBSCRIPTION: (id: string) => `/api/user/subscription/${id}`,
  },
  WEBHOOKS: {
    STRIPE: '/api/webhooks/stripe',
  },
} as const;

export const COMPANY_INFO = {
  NAME: 'GridSpace',
  LOGO: '/logo-placeholder.svg',
  CONTACT_EMAIL: 'hello@gridspace.io',
  CONTACT_PHONE: '+1 (800) 123-4567',
  SOCIAL: {
    TWITTER: 'https://twitter.com/gridspace',
    FACEBOOK: 'https://facebook.com/gridspace',
    INSTAGRAM: 'https://instagram.com/gridspace',
  }
} as const; 
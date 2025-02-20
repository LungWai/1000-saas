export const GRID_CONFIG = {
  TOTAL_GRIDS: 1000,
  BREAKPOINTS: {
    sm: { columns: 10, size: '40px' },
    md: { columns: 20, size: '50px' },
    lg: { columns: 25, size: '60px' },
    xl: { columns: 40, size: '70px' }
  },
  HOVER_ANIMATION_DURATION: '200ms',
  HOVER_SCALE: 1.2,
  EMPTY_GRID_COLOR: '#f0f0f0'
} as const;

export const PRICING = {
  BASE_PRICE: 10.00,
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
# Missing Components and Implementations

## 1. Frontend Components

### Grid Display System
- **GridContainer Component**
  ```typescript
  // Required in: src/components/GridContainer.tsx
  interface GridContainerProps {
    grids: GridProps[];
    containerSize: number;
    columns: number;
  }
  ```
  - Responsive grid layout implementation
  - Grid item positioning
  - Breakpoint handling

- **GridHoverOverlay Component**
  ```typescript
  // Required in: src/components/GridHoverOverlay.tsx
  interface GridHoverOverlayProps {
    price: number;
    isVisible: boolean;
    onPurchaseClick: () => void;
  }
  ```
  - Hover animation
  - Price display
  - Purchase button
  - Z-index management

- **PurchaseModal Component**
  ```typescript
  // Required in: src/components/PurchaseModal.tsx
  interface PurchaseModalProps {
    gridId: string;
    price: number;
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => Promise<void>;
  }
  ```
  - Modal UI
  - Stripe integration
  - Purchase flow steps
  - Error handling

## 2. Backend Implementation

### User Management
- **Profile Management**
  ```typescript
  // Required in: src/app/api/user/profile/route.ts
  interface UserProfile {
    email: string;
    stripe_customer_id: string;
    subscription_status: 'active' | 'past_due' | 'canceled';
  }
  ```
  - Profile CRUD operations
  - Email updates
  - Subscription status management

- **Subscription Management**
  ```typescript
  // Required in: src/app/api/user/subscription/[id]/route.ts
  interface SubscriptionUpdate {
    billing_cycle: 'monthly' | 'quarterly' | 'yearly';
    status: 'active' | 'canceled' | 'past_due';
  }
  ```
  - Subscription updates
  - Billing cycle management
  - Status updates

### Database Implementation
- **Supabase Schema**
  ```sql
  -- Required in: supabase/migrations/
  CREATE TABLE grids (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    image_url TEXT,
    title VARCHAR(50),
    description VARCHAR(250),
    external_url TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status TEXT,
    subscription_id TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );

  CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    stripe_customer_id TEXT,
    subscription_status TEXT,
    created_at TIMESTAMP
  );

  CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    grid_id UUID REFERENCES grids(id),
    user_id UUID REFERENCES users(id),
    amount INTEGER,
    billing_cycle TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    next_billing_date TIMESTAMP,
    created_at TIMESTAMP
  );
  ```
  - Database migrations
  - Indexes for performance
  - Foreign key constraints
  - Trigger functions for updated_at

## 3. Integration Requirements

### Frontend-Backend Integration
- API client utilities
- Error handling middleware
- Loading states
- Optimistic updates

### Testing
- Unit tests for components
- Integration tests for API routes
- E2E tests for purchase flow
- Mock implementations for Stripe/Supabase 

## 4. Missing API Endpoints

### Grid Management
- **List Grids**
  ```typescript
  // Required in: src/app/api/grids/route.ts
  interface GridListResponse {
    grids: Grid[];
    total: number;
    page: number;
    pageSize: number;
  }
  ```
  - Pagination
  - Filtering
  - Sorting options

- **Grid Details**
  ```typescript
  // Required in: src/app/api/grids/[id]/route.ts
  interface GridDetailResponse {
    grid: Grid;
    subscription?: Subscription;
  }
  ```
  - Grid information
  - Subscription status
  - Owner details (if applicable)

- **Grid Subscription**
  ```typescript
  // Required in: src/app/api/grids/subscribe/route.ts
  interface SubscriptionRequest {
    gridId: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
  }
  ```
  - Stripe session creation
  - Metadata handling
  - Error handling

### User Management
- **User Grids**
  ```typescript
  // Required in: src/app/api/user/grids/route.ts
  interface UserGridsResponse {
    grids: Grid[];
    subscriptions: Subscription[];
  }
  ```
  - List user's subscribed grids
  - Subscription details
  - Payment history

- **User Profile**
  ```typescript
  // Required in: src/app/api/user/profile/route.ts
  interface ProfileUpdateRequest {
    email?: string;
    notification_preferences?: {
      renewal_reminders: boolean;
      marketing_emails: boolean;
    };
  }
  ```
  - Profile updates
  - Email verification
  - Preference management

- **Subscription Management**
  ```typescript
  // Required in: src/app/api/user/subscription/[id]/route.ts
  interface SubscriptionUpdateRequest {
    billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
    cancel_at_period_end?: boolean;
  }
  ```
  - Subscription updates
  - Cancellation handling
  - Billing cycle changes 

## 5. Testing Infrastructure

### Unit Tests
- **Component Tests**
  ```typescript
  // Required in: src/__tests__/components/
  describe('GridContentEditor', () => {
    it('validates input lengths')
    it('handles image uploads')
    it('validates external URLs')
  })
  ```

- **API Route Tests**
  ```typescript
  // Required in: src/__tests__/api/
  describe('Grid API', () => {
    it('lists grids with pagination')
    it('creates subscriptions')
    it('updates grid content')
  })
  ```

### Integration Tests
- **Subscription Flow**
  ```typescript
  // Required in: src/__tests__/integration/
  describe('Subscription Process', () => {
    it('creates Stripe checkout session')
    it('handles webhook events')
    it('updates database records')
  })
  ```

### E2E Tests
- **User Journeys**
  ```typescript
  // Required in: e2e/
  describe('Grid Purchase', () => {
    it('completes full purchase flow')
    it('manages grid content')
    it('handles subscription updates')
  })
  ```

## 6. Deployment and Monitoring

### Vercel Configuration
- **Build Settings**
  ```json
  // Required in: vercel.json
  {
    "env": {
      "NEXT_PUBLIC_APP_URL": "@app_url",
      "STRIPE_SECRET_KEY": "@stripe_secret",
      "SUPABASE_URL": "@supabase_url"
    },
    "build": {
      "env": {
        "NEXT_PUBLIC_APP_URL": "@app_url"
      }
    }
  }
  ```

### Sentry Integration
- **Error Tracking**
  ```typescript
  // Required in: src/lib/sentry.ts
  import * as Sentry from '@sentry/nextjs';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV
  });
  ```

- **Performance Monitoring**
  ```typescript
  // Required in: src/lib/monitoring.ts
  interface PerformanceMetrics {
    pageLoad: number;
    apiLatency: number;
    resourceTiming: ResourceTiming[];
  }
  ```

### Build Scripts
- **Package Configuration**
  ```json
  // Required in: package.json
  {
    "scripts": {
      "build": "next build",
      "test": "jest",
      "e2e": "cypress run",
      "lint": "eslint . --ext .ts,.tsx"
    }
  }
  ```

## 7. Documentation

### API Documentation
- OpenAPI/Swagger specifications
- API endpoint documentation
- Authentication flows
- Error codes and handling

### Development Guide
- Local setup instructions
- Environment configuration
- Testing procedures
- Deployment workflow

### User Documentation
- User guides
- FAQ
- Troubleshooting
- Support contact information 
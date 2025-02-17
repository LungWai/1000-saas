# Grid Content SaaS - Product Requirements Document

## 1. Core Product Specification
- **Product Type:** Grid-based content marketplace
- **Grid System:** 1000 individual content spaces
- **Purchase Model:** Time-based leasing (minimum 1 month, auto-recurring)
- **Stack:** 
            Frontend: Next.js, TypeScript
            Backend: Supabase
            Payment Processing: Stripe
            Email: Resend
            Hosting: Vercel
            Monitoring: Sentry

## 2. Technical Requirements

### 2.1 Database Schema (Supabase)

```typescript
interface Grid {
  id: string;              // UUID, primary key
  user_id: string;         // Foreign key to users table
  image_url: string;       // URL to Supabase storage
  title: string;           // Max 50 chars
  description: string;     // Max 250 chars
  external_url: string;    // Click-through URL
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive' | 'pending';
  subscription_id: string; // Stripe subscription ID
  created_at: Date;
  updated_at: Date;
}

interface User {
  id: string;             // UUID, primary key
  email: string;          // Unique
  stripe_customer_id: string;
  subscription_status: 'active' | 'past_due' | 'canceled';
  created_at: Date;
}

interface Subscription {
  id: string;             // UUID, primary key
  grid_id: string;        // Foreign key to grids
  user_id: string;        // Foreign key to users
  amount: number;         // In cents
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'past_due';
  next_billing_date: Date;
  created_at: Date;
}
```

### 2.2 API Endpoints

```typescript
// Grid Management
GET    /api/grids                 // List all grids with pagination
GET    /api/grids/:id            // Get single grid details
POST   /api/grids/subscribe      // Create subscription intent
PUT    /api/grids/:id/content    // Update grid content
PUT    /api/grids/:id/url        // Update click-through URL

// User Management
GET    /api/user/grids           // List user's subscribed grids
POST   /api/user/profile         // Update user profile
PUT    /api/user/subscription/:id // Update subscription

// Stripe Webhooks
POST   /api/webhooks/stripe      // Handle subscription events
```

### 2.3 Frontend Components

```typescript
interface GridProps {
  id: string;
  status: 'empty' | 'leased';
  price: number;
  imageUrl?: string;
  title?: string;
  description?: string;
  externalUrl?: string;
  onPurchaseClick: () => void;
}

interface GridHoverOverlayProps {
  price: number;
  isVisible: boolean;
  onPurchaseClick: () => void;
}

interface PurchaseModalProps {
  gridId: string;
  price: number;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => Promise<void>;
}

interface GridContainerProps {
  grids: GridProps[];
  containerSize: number; // Default: 1000
  columns: number;       // Responsive grid layout
}
```

### 2.4 Grid Layout Configuration

```typescript
const GRID_CONFIG = {
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
}
```

## 3. Implementation Requirements

### 3.1 Grid Display System

#### Base Grid Layout
- Initial display of 1000 grids in responsive layout
- Empty state styling:
  ```css
  .grid-empty {
    background-color: var(--empty-grid-color);
    border: 1px solid #eaeaea;
    aspect-ratio: 1;
  }
  ```

#### Hover Interaction
```typescript
interface HoverState {
  isHovered: boolean;
  position: { x: number; y: number };
  price: number;
}
```

- Hover behavior:
  1. Scale transform: 1.2x
  2. Overlay appears with:
     - Monthly price
     - "Lease This Grid" button
     - Semi-transparent background
  3. Z-index management to prevent overlap

#### Purchase Flow
1. Initial Grid State:
   ```typescript
   type GridState = {
     empty: true;
     price: number;
   } | {
     empty: false;
     content: {
       image: string;
       title: string;
       url: string;
     }
   }
   ```

2. Hover Interaction:
   ```typescript
   const HoverOverlay: React.FC<{
     price: number;
     onPurchaseClick: () => void;
   }> = ({ price, onPurchaseClick }) => (
     <div className="grid-hover-overlay">
       <p>${price}/month</p>
       <button onClick={onPurchaseClick}>
         Lease This Grid
       </button>
     </div>
   )
   ```

3. Purchase Modal Flow:
   ```typescript
   interface PurchaseFlowState {
     step: 'info' | 'checkout';
     gridId: string;
     price: number;
   }
   ```

### 3.2 User Interaction Flow

1. **Initial View**
   - Display 1000 grids in responsive layout
   - Empty grids shown with light background
   - Leased grids display content

2. **Hover Interaction**
   - Mouse enter triggers scale animation
   - Display overlay with:
     - Monthly price
     - "Lease This Grid" button
   - Mouse leave reverts to normal state

3. **Purchase Flow**
   ```mermaid
   graph TD
     A[Hover Grid] -->|Click Lease Button| B[Open Modal]
     B --> C[Display Info]
     C -->|Confirm| D[Stripe Checkout]
     D -->|Success| E[Update Grid Status]
     D -->|Cancel| F[Close Modal]
     E --> G[Refresh Grid Display]
   ```

### 3.3 Technical Implementation

```typescript
// Grid Container Component
const GridContainer: React.FC = () => {
  const gridItems = Array.from({ length: 1000 }, (_, index) => ({
    id: `grid-${index}`,
    status: 'empty',
    price: 99, // Base price, can be dynamic
  }));

  return (
    <div className="grid-container">
      {gridItems.map(grid => (
        <GridItem
          key={grid.id}
          {...grid}
          onPurchaseClick={() => handlePurchase(grid.id)}
        />
      ))}
    </div>
  );
};

// Responsive Grid Layout
const gridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
  gap: '4px',
  padding: '20px',
  maxWidth: '100vw',
};
```

### 3.4 Post-Purchase Workflow

1. **Stripe Checkout Completion**
   ```typescript
   interface StripeCheckoutComplete {
     success: boolean;
     subscriptionId: string;
     customerEmail: string;
     gridId: string;
     amount: number;
   }
   ```

2. **Email Notification (Resend)**
   ```typescript
   interface PurchaseEmail {
     to: string;
     from: "noreply@yourdomain.com";
     subject: "Your Grid Purchase Confirmation";
     content: {
       subscriptionDetails: {
         id: string;
         amount: number;
         renewalDate: Date;
       };
       gridDetails: {
         id: string;
         location: string;
       };
       editInstructions: {
         url: string; // Edit portal URL
         requiredInfo: [
           "Subscription ID",
           "Purchase Email"
         ]
       }
     }
   }
   ```

3. **Edit Access Flow**
   ```typescript
   interface EditAccess {
     subscriptionId: string;
     email: string;
     gridId: string;
   }

   interface EditResponse {
     success: boolean;
     grid?: Grid; // Using existing Grid schema
     error?: string;
   }
   ```

### 3.5 Edit Interface Implementation

1. **Edit Button Component**
   ```typescript
   const EditButton: React.FC<{
     gridId: string;
     isLeased: boolean;
   }> = ({ gridId, isLeased }) => (
     <button 
       className="edit-grid-btn"
       onClick={() => openEditModal(gridId)}
       style={{ display: isLeased ? 'block' : 'none' }}
     >
       Edit Grid
     </button>
   );
   ```

2. **Edit Modal Component**
   ```typescript
   interface EditModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (data: EditAccess) => Promise<void>;
   }

   const EditModal: React.FC<EditModalProps> = ({
     isOpen,
     onClose,
     onSubmit
   }) => {
     const [credentials, setCredentials] = useState<EditAccess>({
       subscriptionId: '',
       email: '',
       gridId: ''
     });

     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <form onSubmit={handleSubmit}>
           <input 
             type="text"
             placeholder="Subscription ID"
             value={credentials.subscriptionId}
           />
           <input 
             type="email"
             placeholder="Purchase Email"
             value={credentials.email}
           />
           <button type="submit">
             Verify & Edit
           </button>
         </form>
       </Modal>
     );
   };
   ```

3. **Grid Content Editor**
   ```typescript
   interface ContentEditorProps {
     grid: Grid;
     onSave: (updates: Partial<Grid>) => Promise<void>;
   }

   const ContentEditor: React.FC<ContentEditorProps> = ({
     grid,
     onSave
   }) => (
     <div className="content-editor">
       <input 
         type="text"
         maxLength={50}
         placeholder="Grid Title"
         value={grid.title}
       />
       <textarea
         maxLength={250}
         placeholder="Grid Description"
         value={grid.description}
       />
       <input 
         type="url"
         placeholder="External URL"
         value={grid.external_url}
       />
       <ImageUploader
         currentUrl={grid.image_url}
         onUpload={(url) => onSave({ image_url: url })}
       />
       <button onClick={handleSave}>
         Save Changes
       </button>
     </div>
   );
   ```

### 3.6 API Routes for Edit Access

```typescript
// Verify Edit Access
POST /api/grid/verify-access
Body: {
  subscriptionId: string;
  email: string;
  gridId: string;
}

// Update Grid Content
PUT /api/grid/update
Body: {
  subscriptionId: string;
  email: string;
  gridId: string;
  updates: Partial<Grid>
}

// Image Upload
POST /api/grid/upload-image
Body: FormData // Contains image file
Headers: {
  'Authorization': `Bearer ${subscriptionId}`
}
```

### 3.7 Content Management
- Click-to-edit URL management
- Image optimization pipeline
- Content validation:
  - Image size limits: 2MB
  - Supported formats: JPG, PNG, GIF
  - Title: 50 chars
  - Description: 250 chars
  - URL: Valid URL format with https://

### 3.8 Security Requirements
- Supabase RLS policies for grid access
- Content validation middleware
- Rate limiting on API routes
- CORS configuration
- URL validation and sanitization

## 4. Monitoring & Operations
- Supabase Dashboard for data management
- Stripe Dashboard for subscription monitoring
- Vercel Analytics for performance tracking
- Error tracking via Sentry
- Subscription status monitoring
- Failed payment handling

## 5. MVP Features
1. Grid browsing & filtering
2. Stripe subscription integration
3. URL-based content management
4. Hover-to-zoom functionality
5. User authentication
6. Mobile responsive design

## 6. Post-MVP Roadmap
1. Bulk grid subscriptions
2. Advanced analytics
3. API access for subscribed grids
4. Custom grid arrangements
5. Multi-URL support per grid

## 7. Implementation Workflow

1. **Purchase Completion**
   - Stripe webhook receives successful subscription
   - Create grid record in database
   - Generate and send email via Resend
   - Update grid status to 'active'

2. **Edit Access**
   - User clicks edit button on grid
   - Enters subscription ID and email
   - System verifies against database
   - If valid, shows content editor
   - Updates are verified and saved

3. **Email Content**
   ```plaintext
   Subject: Your Grid Purchase Confirmation

   Thank you for your purchase!

   Grid Details:
   - Grid ID: {gridId}
   - Location: {gridLocation}
   - Monthly Price: ${amount}

   To edit your grid content:
   1. Click the "Edit" button on your grid
   2. Enter your:
      - Subscription ID: {subscriptionId}
      - Purchase Email: {customerEmail}
   3. Make your desired changes
   4. Save to update your grid

   Your subscription will renew on {renewalDate}.

   Need help? Contact support@yourdomain.com
   ```
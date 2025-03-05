export interface Grid {
  id: string;
  content: string | null;
  customerId: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  user_id: string;          // Now stores Stripe customer ID
  image_url: string;
  title: string;
  description: string;
  external_url: string;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive' | 'pending';
  subscription_id: string;
}

export interface User {
  id: string;
  email: string;
  stripe_customer_id: string;
  subscription_status: 'active' | 'past_due' | 'canceled';
  created_at: Date;
}

export interface Subscription {
  id: string;
  grid_id: string;
  amount: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'past_due';
  next_billing_date: Date;
  created_at: Date;
}

export interface GridProps {
  id: string;
  status: 'empty' | 'leased';
  price: number;
  imageUrl?: string;
  title?: string;
  description?: string;
  externalUrl?: string;
  onPurchaseClick: (gridId: string) => void;
}

export interface GridHoverOverlayProps {
  price: number;
  isVisible: boolean;
  onPurchaseClick: (gridId: string) => void;
}

export interface PurchaseModalProps {
  gridId: string;
  price: number;
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export interface GridContainerProps {
  grids: GridProps[];
  containerSize: number;
  columns: number;
}

export interface HoverState {
  isHovered: boolean;
  position: { x: number; y: number };
  price: number;
}

export interface EditAccess {
  subscriptionId: string;
  email: string;
  gridId: string;
}

export interface EditResponse {
  success: boolean;
  grid?: Grid;
  error?: string;
}

export interface ContentEditorProps {
  grid: Grid;
  onSave: (updates: Partial<Grid>) => Promise<void>;
}

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditAccess) => Promise<void>;
} 
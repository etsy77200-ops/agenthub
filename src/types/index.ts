export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role: "buyer" | "seller" | "both";
  stripe_account_id?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller?: User;
  title: string;
  description: string;
  short_description: string;
  category_id: string;
  category?: Category;
  price: number;
  price_type: "fixed" | "hourly" | "custom";
  tags: string[];
  images: string[];
  demo_url?: string;
  /** Production access URL; never expose in public listing queries — buyers get it after payment. */
  agent_access_url?: string;
  status: "active" | "paused" | "draft";
  rating: number;
  review_count: number;
  order_count: number;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer?: User;
  listing_id: string;
  listing?: Listing;
  seller_id: string;
  seller?: User;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  amount: number;
  platform_fee: number;
  requirements: string;
  stripe_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  listing_id: string;
  reviewer_id: string;
  reviewer?: User;
  rating: number;
  comment: string;
  created_at: string;
}

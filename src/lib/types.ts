// Client-facing shapes returned by the API (dates serialised as ISO strings)
import type { RenderSpec, ZoneSpec } from "./studio";

export type Role = "buyer" | "artisan";

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
  city: string;
  avatar?: string | null;
  craft?: string;
  lat?: number;
  lng?: number;
}

export interface ArtisanT {
  id: string;
  name: string;
  phone: string;
  craft: string;
  category: string;
  tagline: string;
  bio: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  years: number;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  avatar: string;
  cover: string;
  portfolio: string[];
  techniques: string[];
  languages: string[];
  verified: boolean;
  acceptingOrders: boolean;
  createdAt: string;
  distanceKm?: number | null;
}

export interface BuyerT {
  id: string;
  name: string;
  phone: string;
  city: string;
  lat: number;
  lng: number;
  avatar: string;
}

export interface ReviewT {
  id: string;
  artisanId: string;
  buyerName: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface DesignT {
  id: string;
  buyerId: string;
  artisanId: string | null;
  title: string;
  prompt: string;
  craft: string;
  category: string;
  itemType: string;
  materials: string[];
  colors: { name: string; hex: string }[];
  budget: number;
  timelineDays: number;
  notes: string;
  spec: RenderSpec;
  status: string;
  createdAt: string;
}

export interface MessageT {
  id: string;
  conversationId: string;
  senderRole: "buyer" | "artisan" | "system";
  senderName: string;
  body: string;
  kind: "text" | "quote" | "system";
  amount: number | null;
  etaDays: number | null;
  createdAt: string;
}

export interface OrderT {
  id: string;
  conversationId: string;
  designId: string;
  buyerId: string;
  artisanId: string;
  amount: number;
  address: string;
  city: string;
  pincode: string;
  etaDays: number;
  note: string;
  status: "locked" | "in_progress" | "shipped" | "delivered";
  createdAt: string;
}

export interface ConversationT {
  id: string;
  designId: string;
  buyerId: string;
  artisanId: string;
  status: "open" | "locked";
  lastAt: string;
  createdAt: string;
  design: DesignT;
  artisan: ArtisanT;
  buyer: BuyerT;
  last: MessageT | null;
  order: OrderT | null;
}

export interface ConversationDetail {
  conversation: ConversationT;
  messages: MessageT[];
  order: OrderT | null;
}

export interface OrderRow extends OrderT {
  design: DesignT;
  artisan: ArtisanT;
  buyer: BuyerT;
}

export interface DraftT {
  title: string;
  prompt: string;
  craft: string;
  category: string;
  itemType: string;
  materials: string[];
  colors: { name: string; hex: string }[];
  budget: number;
  timelineDays: number;
  notes: string;
  assumptions: string[];
  confidence: number;
  zones?: ZoneSpec[];
  spec: RenderSpec;
}

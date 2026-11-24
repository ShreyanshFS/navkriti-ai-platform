// Navkriti data model (Postgres via Drizzle — maps 1:1 to DynamoDB tables in production)
import { pgTable, text, integer, timestamp, jsonb, uuid, doublePrecision, boolean } from "drizzle-orm/pg-core";
import type { RenderSpec } from "@/lib/studio";

export const artisans = pgTable("artisans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  craft: text("craft").notNull(),
  category: text("category").notNull(), // textiles | paintings
  tagline: text("tagline").notNull(),
  bio: text("bio").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  years: integer("years").notNull().default(5),
  rating: doublePrecision("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  startingPrice: integer("starting_price").notNull().default(1000),
  avatar: text("avatar").notNull(),
  cover: text("cover").notNull(),
  portfolio: jsonb("portfolio").$type<string[]>().notNull(),
  techniques: jsonb("techniques").$type<string[]>().notNull(),
  languages: jsonb("languages").$type<string[]>().notNull(),
  verified: boolean("verified").notNull().default(false),
  acceptingOrders: boolean("accepting_orders").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const buyers = pgTable("buyers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  avatar: text("avatar").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  artisanId: uuid("artisan_id").notNull().references(() => artisans.id, { onDelete: "cascade" }),
  buyerName: text("buyer_name").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const designs = pgTable("designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id").notNull().references(() => buyers.id, { onDelete: "cascade" }),
  artisanId: uuid("artisan_id").references(() => artisans.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  craft: text("craft").notNull(),
  category: text("category").notNull(),
  itemType: text("item_type").notNull(),
  materials: jsonb("materials").$type<string[]>().notNull(),
  colors: jsonb("colors").$type<{ name: string; hex: string }[]>().notNull(),
  budget: integer("budget").notNull(),
  timelineDays: integer("timeline_days").notNull(),
  notes: text("notes").notNull(),
  spec: jsonb("spec").$type<RenderSpec>().notNull(),
  status: text("status").notNull().default("sent"), // sent | locked
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  designId: uuid("design_id").notNull().references(() => designs.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => buyers.id, { onDelete: "cascade" }),
  artisanId: uuid("artisan_id").notNull().references(() => artisans.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("open"), // open | locked
  lastAt: timestamp("last_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull(), // buyer | artisan | system
  senderName: text("sender_name").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("text"), // text | quote | system
  amount: integer("amount"),
  etaDays: integer("eta_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  designId: uuid("design_id").notNull().references(() => designs.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => buyers.id, { onDelete: "cascade" }),
  artisanId: uuid("artisan_id").notNull().references(() => artisans.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  pincode: text("pincode").notNull(),
  etaDays: integer("eta_days").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("locked"), // locked | in_progress | shipped | delivered
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Artisan = typeof artisans.$inferSelect;
export type Buyer = typeof buyers.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Design = typeof designs.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Order = typeof orders.$inferSelect;

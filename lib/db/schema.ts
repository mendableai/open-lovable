import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  image: text("image"),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  plan: text("plan"),
  status: text("status"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  provider: text("provider"),
  providerSubscriptionId: text("provider_subscription_id"),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  messages: jsonb("messages"),
  createdAt: timestamp("created_at").defaultNow(),
});

import { foreignKey } from "drizzle-orm/gel-core";
import { integer, pgTable, timestamp, varchar,ForeignKey} from "drizzle-orm/pg-core";

export const restaurantsTable = pgTable("restaurants", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  address: varchar({ length: 500 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 32 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
  ownerPhoneNumber: varchar("owner_phone_number", { length: 32 }).notNull(),
});

export const ordersTable = pgTable("orders", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  items: varchar("items", { length: 255 }).array().notNull(),
  price: integer("price").notNull(),
  orderStatus: varchar("order_status", { length: 32 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedbackTable = pgTable("feedback", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  feedbackText: varchar("feedback_text", { length: 1000 }).notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


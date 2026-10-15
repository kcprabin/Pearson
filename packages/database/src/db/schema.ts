import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const restaurantsTable = pgTable("restaurants", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  address: varchar({ length: 500 }),
  phoneNumber: varchar("phone_number", { length: 32 }),
  email: varchar({ length: 255 }),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 255 }),
  ownerPhoneNumber: varchar("owner_phone_number", { length: 32 }),
  thread_id: integer("thread_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menusTable = pgTable("menus", {
  menuId: integer("menu_id").generatedAlwaysAsIdentity().primaryKey(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurantsTable.id, { onDelete: "cascade" }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menusRelations = relations(menusTable, ({ one }) => ({
  restaurant: one(restaurantsTable, {
    fields: [menusTable.restaurantId],
    references: [restaurantsTable.id],
  }),
}));

export const ordersTable = pgTable("orders", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurantsTable.id, { onDelete: "cascade" }),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  items: varchar("items", { length: 255 }).array().notNull(),
  price: integer("price").notNull(),
  orderStatus: varchar("order_status", { length: 32 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(ordersTable, ({ one }) => ({
  restaurant: one(restaurantsTable, {
    fields: [ordersTable.restaurantId],
    references: [restaurantsTable.id],
  }),
}));

export const feedbackTable = pgTable("feedback", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurantsTable.id, { onDelete: "cascade" }),
  restaurantName: varchar("restaurant_name", { length: 255 }).notNull(),
  feedbackText: varchar("feedback_text", { length: 1000 }).notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restaurantsRelations = relations(restaurantsTable, ({ many }) => ({
  menuItems: many(menusTable),
  orders: many(ordersTable),
  feedback: many(feedbackTable),
}));

export const feedbackRelations = relations(feedbackTable, ({ one }) => ({
  restaurant: one(restaurantsTable, {
    fields: [feedbackTable.restaurantId],
    references: [restaurantsTable.id],
  }),
}));


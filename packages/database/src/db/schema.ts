import { integer, pgTable, varchar } from "drizzle-orm/pg-core";


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

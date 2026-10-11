import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";


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

export const incomingMessagesTable = pgTable("incoming_messages", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  messageId: varchar("message_id", { length: 255 }).notNull().unique(),
  senderJid: varchar("sender_jid", { length: 255 }).notNull(),
  chatJid: varchar("chat_jid", { length: 255 }).notNull(),
  text: varchar({ length: 10000 }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

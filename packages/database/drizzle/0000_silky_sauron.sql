CREATE TABLE "feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"restaurant_id" integer NOT NULL,
	"restaurant_name" varchar(255) NOT NULL,
	"feedback_text" varchar(1000) NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"restaurant_id" integer NOT NULL,
	"restaurant_name" varchar(255) NOT NULL,
	"items" varchar(255)[] NOT NULL,
	"price" integer NOT NULL,
	"order_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "restaurants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"restaurant_name" varchar(255) NOT NULL,
	"address" varchar(500),
	"phone_number" varchar(32),
	"email" varchar(255),
	"username" varchar(255),
	"password" varchar(255),
	"owner_name" varchar(255) NOT NULL,
	"owner_email" varchar(255),
	"owner_phone_number" varchar(32),
	"thread_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"token" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
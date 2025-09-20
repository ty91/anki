DROP INDEX "entries_expression_key";--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entries_user_expression_key" ON "entries" USING btree ("user_id","expression");
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"expression" text NOT NULL,
	"meaning" text NOT NULL,
	"examples" jsonb NOT NULL,
	"tone_tip" text NOT NULL,
	"etymology" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "entries_expression_key" ON "entries" USING btree ("expression");
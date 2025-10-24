CREATE TABLE "forks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "forks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"original_agent_id" integer NOT NULL,
	"forked_agent_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_original_agent_id_agents_id_fk" FOREIGN KEY ("original_agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_forked_agent_id_agents_id_fk" FOREIGN KEY ("forked_agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
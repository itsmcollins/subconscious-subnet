ALTER TABLE "forks" DROP CONSTRAINT "forks_original_agent_id_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_original_agent_id_agents_id_fk" FOREIGN KEY ("original_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
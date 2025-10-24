import { integer, pgTable, varchar, text, jsonb } from 'drizzle-orm/pg-core';

export const agentsTable = pgTable('agents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  prompt: text().notNull(),
  tools: jsonb(),
});

export const forksTable = pgTable('forks', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  originalAgentId: integer('original_agent_id')
    .notNull()
    .references(() => agentsTable.id),
  forkedAgentId: integer('forked_agent_id')
    .notNull()
    .references(() => agentsTable.id, { onDelete: 'cascade' }),
});

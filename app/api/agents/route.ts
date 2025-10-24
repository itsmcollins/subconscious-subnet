import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentsTable, forksTable } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all forked agent IDs (agents that are forks of something)
    const forkedAgentIds = await db.select({ id: forksTable.forkedAgentId }).from(forksTable);

    // Get all original agent IDs (agents that have been forked from)
    const originalAgentIds = await db.select({ id: forksTable.originalAgentId }).from(forksTable);

    const forkedIds = forkedAgentIds.map((f) => f.id);
    const originalIds = originalAgentIds.map((o) => o.id);

    // Get all agents
    const agents = await db.select().from(agentsTable).orderBy(desc(agentsTable.id)).limit(50);

    // Filter to show agents that are either:
    // 1. NOT a fork (not in forkedAgentId), OR
    // 2. HAVE been forked from (in originalAgentId)
    // This means forks that have their own forks appear on the home page
    const filteredAgents = agents.filter(
      (agent) => !forkedIds.includes(agent.id) || originalIds.includes(agent.id),
    );

    // Map database fields to match Agent interface
    const mappedAgents = filteredAgents.map((agent) => ({
      id: agent.id.toString(),
      title: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      tools: (agent.tools as string[]) || [],
    }));

    return NextResponse.json(mappedAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, prompt, tools } = body;

    if (!title || !description || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newAgent] = await db
      .insert(agentsTable)
      .values({
        name: title,
        description,
        prompt,
        tools: tools || [],
      })
      .returning();

    // Map database fields to match Agent interface
    const mappedAgent = {
      id: newAgent.id.toString(),
      title: newAgent.name,
      description: newAgent.description,
      prompt: newAgent.prompt,
      tools: (newAgent.tools as string[]) || [],
    };

    return NextResponse.json(mappedAgent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

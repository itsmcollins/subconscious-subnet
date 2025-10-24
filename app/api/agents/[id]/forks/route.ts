import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentsTable, forksTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/agents/[id]/forks - Get all forks of an agent
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);

    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Get all forks for this agent
    const forks = await db
      .select({
        id: agentsTable.id,
        name: agentsTable.name,
        description: agentsTable.description,
        prompt: agentsTable.prompt,
        tools: agentsTable.tools,
      })
      .from(forksTable)
      .innerJoin(agentsTable, eq(forksTable.forkedAgentId, agentsTable.id))
      .where(eq(forksTable.originalAgentId, agentId));

    // Map database fields to match Agent interface
    const mappedForks = forks.map((fork) => ({
      id: fork.id.toString(),
      title: fork.name,
      description: fork.description,
      prompt: fork.prompt,
      tools: (fork.tools as string[]) || [],
    }));

    return NextResponse.json(mappedForks);
  } catch (error) {
    console.error('Error fetching forks:', error);
    return NextResponse.json({ error: 'Failed to fetch forks' }, { status: 500 });
  }
}

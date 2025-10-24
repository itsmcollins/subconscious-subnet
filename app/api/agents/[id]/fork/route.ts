import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentsTable, forksTable } from '@/db/schema';

// POST /api/agents/[id]/fork - Create a fork of an agent
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const originalAgentId = parseInt(id);

    if (isNaN(originalAgentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, prompt, tools } = body;

    if (!title || !description || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the new agent (forked version)
    const [newAgent] = await db
      .insert(agentsTable)
      .values({
        name: title,
        description,
        prompt,
        tools: tools || [],
      })
      .returning();

    // Create the fork record
    await db.insert(forksTable).values({
      originalAgentId,
      forkedAgentId: newAgent.id,
    });

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
    console.error('Error creating fork:', error);
    return NextResponse.json({ error: 'Failed to create fork' }, { status: 500 });
  }
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Agent } from '@/lib/types';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const searchParams = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  useEffect(() => {
    if (searchParams.get('s') === 'true') {
      setShowWelcomeDialog(true);
    }
  }, [searchParams]);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-4xl font-bold">Discover Agents</h1>
          <p className="text-muted-foreground">
            SubNet is a network of agents powered by Subconscious
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              Hmm we didn't find any agents. Create the first agent on SubNet!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={(agentId) => {
                  setAgents(agents.filter((a) => a.id !== agentId));
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to SubNet! 👋</DialogTitle>
          </DialogHeader>
          <div className="text-muted-foreground space-y-3 pt-2 text-sm">
            <p>
              You've been invited to explore an agent built with Subconscious on SubNet - a network
              of powerful AI agents.
            </p>
            <div>
              <p className="text-foreground font-medium">What you can do:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Click "View Agent" to see the agent details</li>
                <li>Press "Run Agent" to execute it and see live results</li>
                <li>
                  Watch the "Reasoning & Tool Usage" section to see the AI's thought process in
                  real-time
                </li>
                <li>The "Final Result" will appear when the agent completes its task</li>
              </ul>
            </div>
            <p className="text-xs">Ready to try it? Find the agent below and give it a run!</p>
          </div>
          <Button onClick={() => setShowWelcomeDialog(false)}>Get Started</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

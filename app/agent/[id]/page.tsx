'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from '@/components/ui/item';
import type { Agent } from '@/lib/types';
import { AVAILABLE_TOOLS } from '@/lib/types';
import { ArrowLeft, GitFork, Play, ChevronDown, ChevronUp } from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [forks, setForks] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFork, setExpandedFork] = useState<string | null>(null);

  const getToolLabel = (toolValue: string) => {
    const tool = AVAILABLE_TOOLS.find((t) => t.value === toolValue);
    return tool?.label || toolValue;
  };

  useEffect(() => {
    async function fetchData() {
      const id = params.id as string;

      try {
        // Fetch agent details
        const agentResponse = await fetch(`/api/agents/${id}`);
        if (!agentResponse.ok) {
          router.push('/');
          return;
        }
        const agentData = await agentResponse.json();
        setAgent(agentData);

        // Fetch forks
        const forksResponse = await fetch(`/api/agents/${id}/forks`);
        if (forksResponse.ok) {
          const forksData = await forksResponse.json();
          setForks(forksData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.id, router]);

  const handleFork = () => {
    router.push(`/create?fork=${agent?.id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto max-w-7xl px-4 py-6">
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading agent...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl px-4 py-6">
        {/* Back button */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Desktop and mobile layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left sidebar - sticky on large screens */}
          <div className="hidden space-y-4 lg:block">
            <div className="sticky top-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{agent.title}</CardTitle>
                  <CardDescription className="text-sm">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-medium">
                      Connected Tools
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">
                          {getToolLabel(tool)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleFork}
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      Fork Agent
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2"
                      onClick={() => router.push(`/run/${agent.id}`)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Run Original
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right content area - Forks List */}
          <div className="min-w-0">
            {/* Mobile header */}
            <div className="mb-4 space-y-2 lg:hidden">
              <div>
                <h2 className="text-lg font-semibold">{agent.title}</h2>
                <p className="text-muted-foreground text-sm">{agent.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="text-xs">
                    {getToolLabel(tool)}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleFork}>
                  <GitFork className="h-3.5 w-3.5" />
                  Fork
                </Button>
                <Button size="sm" className="gap-2" onClick={() => router.push(`/run/${agent.id}`)}>
                  <Play className="h-3.5 w-3.5" />
                  Run Original
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forks ({forks.length})</CardTitle>
                <CardDescription>Community variations of this agent</CardDescription>
              </CardHeader>
              <CardContent>
                {forks.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    <p className="mb-2 text-sm">No forks yet</p>
                    <p className="text-xs">Be the first to fork this agent!</p>
                  </div>
                ) : (
                  <ItemGroup>
                    {forks.map((fork) => (
                      <Item key={fork.id} variant="outline" className="flex-col items-start">
                        <div className="flex w-full items-start justify-between gap-4">
                          <ItemContent>
                            <ItemTitle>{fork.title}</ItemTitle>
                            <ItemDescription>{fork.description}</ItemDescription>
                          </ItemContent>
                          <ItemActions className="shrink-0">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/run/${fork.id}`)}
                              className="gap-2"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Run
                            </Button>
                          </ItemActions>
                        </div>
                        <Collapsible
                          open={expandedFork === fork.id}
                          onOpenChange={(open) => setExpandedFork(open ? fork.id : null)}
                          className="w-full"
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2 gap-2">
                              {expandedFork === fork.id ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Hide Instructions
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  View Instructions
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <Textarea
                              value={fork.prompt}
                              disabled
                              className="min-h-[200px] resize-none font-mono text-xs"
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </Item>
                    ))}
                  </ItemGroup>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

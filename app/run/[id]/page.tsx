'use client';

import type React from 'react';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Agent } from '@/lib/types';
import { AVAILABLE_TOOLS } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { parse } from 'partial-json';
import { cn } from '@/lib/utils';
import {
  LoaderCircle,
  ArrowLeft,
  Share2,
  Check,
  ExternalLink,
  GitFork,
  FileText,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function RunAgentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const reasoningRef = useRef<HTMLPreElement>(null);

  const getToolLabel = (toolValue: string) => {
    const tool = AVAILABLE_TOOLS.find((t) => t.value === toolValue);
    return tool?.label || toolValue;
  };

  useEffect(() => {
    async function fetchAgent() {
      const id = params.id as string;

      try {
        const response = await fetch(`/api/agents/${id}`);

        if (!response.ok) {
          router.push('/');
          return;
        }

        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
        router.push('/');
      }
    }

    fetchAgent();
  }, [params.id, router]);

  useEffect(() => {
    if (searchParams.get('s') === 'true') {
      setShowWelcomeDialog(true);
    }
  }, [searchParams]);

  // Scroll to bottom when result updates
  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [result]);

  const handleRun = async () => {
    if (isRunning || !agent) return;

    setIsRunning(true);
    setResult('');

    try {
      const response = await fetch(`/api/agents/${agent.id}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start agent');
      }

      // Get the readable stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and accumulate it
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        console.log('Accumulated text', accumulatedText);
        setResult(parse(accumulatedText));
      }

      setIsRunning(false);
    } catch (error) {
      console.error('Error running agent:', error);
      setResult('Error: Failed to run agent. Please try again.');
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResult('');
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/run/${agent?.id}?s=true`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setPopoverOpen(false);
    }, 2000);
  };

  const handleShareOnX = () => {
    const link = `${window.location.origin}/run/${agent?.id}?s=true`;
    const text = `Check out my ${agent?.title} agent that I built using Subconscious: ${link}`;
    const twitterUrl = `https://x.com/compose/post?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
    setPopoverOpen(false);
  };

  const handleFork = () => {
    router.push(`/create?fork=${agent?.id}`);
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl px-4 py-6">
        {/* Back button - outside cards */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Desktop and mobile layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left sidebar - sticky on large screens, hidden on mobile */}
          <div className="hidden space-y-4 lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Model Info Card */}
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
                  <div className="flex gap-2 pt-2">
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={handleCopyLink}
                          >
                            {copied ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Share2 className="h-4 w-4" />
                                Copy Link
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={handleShareOnX}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Share on X
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={handleFork}
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      Fork
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => setShowInstructionsDialog(true)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Instructions
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2"
                    onClick={handleRun}
                    disabled={isRunning}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isRunning ? 'Running...' : 'Run Agent'}
                  </Button>
                  {result && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleReset}
                      disabled={isRunning}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right content area - Response Card */}
          <div className="min-w-0">
            {/* Mobile header & actions */}
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
            </div>

            <div className="sticky top-16 z-20 mb-4 lg:hidden">
              <div className="bg-background/90 border-border text-foreground flex items-center gap-2 overflow-x-auto rounded-full border px-3 py-2 shadow-sm backdrop-blur">
                <Button
                  size="sm"
                  className="rounded-full px-3"
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <LoaderCircle className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1 h-4 w-4" />
                  )}
                  Play
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3"
                  onClick={() => setShowInstructionsDialog(true)}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Info
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-3"
                    onClick={handleReset}
                    disabled={isRunning}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reset
                  </Button>
                )}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full px-3">
                      <Share2 className="mr-1 h-4 w-4" />
                      Share
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="center">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={handleShareOnX}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Share on X
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3"
                  onClick={handleFork}
                >
                  <GitFork className="mr-1 h-4 w-4" />
                  Fork
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Run Results</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {!result ? (
                  <div className="text-muted-foreground py-12 text-center">
                    <p className="mb-2 text-sm">Ready to run this agent?</p>
                    <p className="text-xs">
                      Click the "Run Agent" button{' '}
                      <span className="hidden lg:inline">on the left</span>
                      <span className="lg:hidden">above</span> to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            'mb-2 text-sm font-semibold',
                            isRunning && 'animate-pulse text-gray-400',
                          )}
                        >
                          Reasoning & Tool Usage
                        </h3>
                        {isRunning && (
                          <div className="mb-2 flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="prose prose-sm text-foreground bg-muted/50 max-w-none overflow-hidden rounded-md border">
                        <pre
                          ref={reasoningRef}
                          className="bg-background max-h-[400px] overflow-auto p-3 text-xs"
                        >
                          <code className="break-all">
                            {JSON.stringify(result?.reasoning, null, 2)}
                          </code>
                        </pre>
                      </div>
                    </div>
                    {result?.answer && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold">Final Result</h3>
                        <div className="prose prose-sm text-foreground bg-muted/50 max-w-none rounded-md border p-3">
                          <ReactMarkdown>{result?.answer}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Instructions Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Instruction Set</DialogTitle>
            <DialogDescription>
              The system prompt that guides this agent's behavior
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={agent.prompt}
            disabled
            className="max-h-[60vh] min-h-[300px] resize-none font-mono text-xs"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleFork} className="gap-2">
              <GitFork className="h-4 w-4" />
              Fork Agent
            </Button>
            <Button onClick={() => setShowInstructionsDialog(false)} className="ml-auto">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to {agent.title}! 👋</DialogTitle>
          </DialogHeader>
          <div className="text-muted-foreground space-y-3 pt-2 text-sm">
            <p>{agent.description}</p>
            <div>
              <p className="text-foreground font-medium">What to expect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Press the "Run Agent" button to execute the agent</li>
                <li>
                  Watch the "Reasoning & Tool Usage" section to see the AI's decision-making process
                  in real-time
                </li>
                <li>
                  The agent will use tools like{' '}
                  {agent.tools
                    .slice(0, 2)
                    .map((t) => getToolLabel(t))
                    .join(', ')}{' '}
                  to complete its task
                </li>
                <li>The "Final Result" will appear when processing is complete</li>
              </ul>
            </div>
            <p className="text-xs">
              Ready to see it in action? Press the button to run this agent!
            </p>
          </div>
          <Button onClick={() => setShowWelcomeDialog(false)}>Let's Go!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

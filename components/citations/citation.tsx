'use client';

import { PaginationControls } from '@/components/citations/pagination-control';
import { Show } from '@/components/shared/show';
import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { citationStyles } from '@/lib/constants';
import type { Citation } from '@/lib/db/schema';
import { logger } from '@/lib/utils';
import { ArrowLeft, Copy, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function CitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;

  const [doi, setDoi] = useState('');
  const [style, setStyle] = useState(citationStyles[0]);
  const [citation, setCitation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [citations, setCitations] = useState<Citation[] | []>([]);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);
  const [, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [totalCitations, setTotalCitations] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'alpha'>('date');

  const setCurrentPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    router.push(`?${newParams.toString()}`);
  };

  useEffect(() => {
    fetchCitations(currentPage ? Number(currentPage) : 1);
  }, [currentPage]);

  const fetchCitations = async (page: number) => {
    setIsLoadingCitations(true);
    try {
      const response = await fetch(
        `/api/citation/save?page=${page}&limit=${ITEMS_PER_PAGE}&sortBy=${sortBy}`,
      );
      if (!response.ok) throw new Error('Failed to fetch citations');
      const data = await response.json();

      const totalCount = data.meta?.total || 0;
      setCitations(data.data || []);
      setTotalCitations(totalCount);
      setHasPrev(data.meta?.has_prev_page || false);
      setHasNext(data.meta?.has_next_page || false);
      const calculatedTotalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    } catch (error) {
      logger.error('failed to fetch citations:', error);
      toast({
        type: 'error',
        description: 'Failed to fetch citations',
      });
    } finally {
      setIsLoadingCitations(false);
    }
  };

  const handleGenerateCitation = async () => {
    if (!doi) {
      toast({
        type: 'error',
        description: 'Please enter a DOI',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi, style }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate citation');
      }

      const data = await response.json();
      setCitation(data.data);

      await fetch('/api/citation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi, style, content: data.data }),
      });

      toast({
        type: 'success',
        description: 'Citation generated and saved successfully',
      });

      // Refresh citations list
      setCurrentPage(1); // Reset to first page after new citation
      fetchCitations(1);
    } catch (error) {
      console.error('[ERROR]: Failed to generate citation:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate citation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/citation/save/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete citation');

      toast({
        type: 'success',
        description: 'Citation deleted successfully',
      });

      fetchCitations(currentPage);
    } catch (error) {
      console.error('[ERROR]: Failed to delete citation:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to delete citation',
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/citation/export');
      if (!response.ok) throw new Error('Failed to export citations');

      const text = await response.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'citations.txt';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        type: 'success',
        description: 'Citations exported successfully',
      });
    } catch (error) {
      console.error('[ERROR]: Failed to export citations:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to export citations',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    if (text.length < 1) {
      toast({
        type: 'error',
        description: 'No citation to copy',
      });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({
      type: 'success',
      description: 'Citations copied to clipboard',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="w-full max-w-2xl mx-auto shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">
                Generate Citation
              </CardTitle>
              <CardDescription>
                Enter a DOI and select a citation style to generate a formatted
                citation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="doi"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Digital Object Identifier (DOI)
                </label>
                <div className="relative">
                  <Input
                    id="doi"
                    placeholder="e.g., 10.1000/xyz123"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="style"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Citation Style
                </label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select a citation style" />
                  </SelectTrigger>
                  <SelectContent>
                    {citationStyles.map((citationStyle) => (
                      <SelectItem key={citationStyle} value={citationStyle}>
                        {citationStyle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateCitation}
                className="w-full"
                disabled={isLoading}
              >
                <Show when={isLoading}>
                  <span className="mr-2">Generating...</span>
                  <span className="animate-spin">⟳</span>
                </Show>
                <Show when={!isLoading}>
                  <FileText className="mr-2 size-4" />
                  Generate Citation
                </Show>
              </Button>
            </CardContent>

            <Show when={!!citation && citation.length > 0}>
              <CardFooter className="flex flex-col items-start pt-0">
                <div className="w-full p-4 rounded-md bg-muted">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">
                      Generated Citation:
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(citation as string)}
                      className="h-8 px-2 hover:bg-background/80"
                    >
                      <Copy className="size-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm break-words">{citation}</p>
                </div>
              </CardFooter>
            </Show>
          </Card>

          {/* Citations List */}
          <Card className="w-full shadow-sm mt-8">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-2xl font-bold">
                    My Citations
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {totalCitations}{' '}
                    {totalCitations === 1 ? 'citation' : 'citations'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'date' | 'alpha') => {
                      setSortBy(value);
                      setCurrentPage(1);
                      fetchCitations(1);
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Most Recent</SelectItem>
                      <SelectItem value="alpha">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allCitations = citations
                        .map((c) => c.content)
                        .join('\n\n');
                      copyToClipboard(allCitations);
                    }}
                    title="Copy all citations"
                    className="gap-1"
                  >
                    <Copy className="size-4" />
                    Copy All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    title="Export citations"
                  >
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Show when={isLoadingCitations}>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              </Show>
              <Show when={!isLoadingCitations && citations.length === 0}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="size-12 text-muted-foreground mb-3 opacity-20" />
                  <p className="text-muted-foreground">
                    No citations found. Generate your first citation!
                  </p>
                </div>
              </Show>
              <Show when={!isLoadingCitations && citations.length > 0}>
                <div className="space-y-4">
                  {citations.map((citation) => (
                    <Card
                      key={citation.id}
                      className="p-4 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                              {citation.style}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              DOI: {citation.doi}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{citation.content}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(citation.content)}
                            className="size-8 rounded-full"
                            title="Copy citation"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(citation.id)}
                            className="size-8 rounded-full text-destructive hover:text-destructive"
                            title="Delete citation"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                />
              </Show>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

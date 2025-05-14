'use client';

import { useState } from 'react';
import { toast } from '@/components/toast';

const citationStyles = ['APA', 'Harvard', 'MLA', 'Chicago'];

export default function CitationPage() {
  const [doi, setDoi] = useState('');
  const [style, setStyle] = useState(citationStyles[0]);
  const [citation, setCitation] = useState<string | null>(null);

  const handleGenerateCitation = async () => {
    if (!doi) {
      toast({ type: 'error', description: 'Please enter a DOI!' });
      return;
    }

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
      setCitation(data.citation);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        toast({ type: 'error', description: error.message });
      }
      toast({ type: 'error', description: 'An error occurred while generating the citation.' });

    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-2xl font-bold mb-4">Generate Citation</h1>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Enter DOI"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="p-2 border rounded"
        >
          {citationStyles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerateCitation}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Generate Citation
        </button>
        {citation && (
          <div className="mt-4 p-4 border rounded bg-gray-100">
            <h2 className="font-semibold">Generated Citation:</h2>
            <p>{citation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
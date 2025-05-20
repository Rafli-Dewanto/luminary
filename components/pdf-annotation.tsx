'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import PDFViewer from './pdf-viewer';

interface PDFAnnotationProps {
  url: string;
  className?: string;
  chatId: string;
  onAnnotationChange?: (annotations: any[]) => void;
}

export function PDFAnnotation({
  url,
  className,
  onAnnotationChange,
  chatId,
}: PDFAnnotationProps) {
  const [annotations, setAnnotations] = useState<any[]>([]);

  const handleAnnotationChange = (newAnnotations: any[]) => {
    setAnnotations(newAnnotations);
    if (onAnnotationChange) {
      onAnnotationChange(newAnnotations);
    }
  };

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-lg border',
        className,
      )}
    >
      <div className="relative flex-1 overflow-hidden">
        <PDFViewer
          chatId={chatId}
          url={url}
          onAnnotationChange={handleAnnotationChange}
        />
      </div>
    </div>
  );
}

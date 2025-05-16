'use client';

import { redis } from '@/lib/redis';
import { useEffect, useRef } from 'react';
import { toast } from './toast';

interface PDFViewerProps {
  url: string;
  chatId: string;
  onAnnotationChange?: (annotations: any[]) => void;
}

export default function PDFViewer({
  url,
  chatId,
  onAnnotationChange
}: PDFViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !viewerRef.current) return;

    let isMounted = true;

    const loadViewer = async () => {
      try {
        // Clean up previous instance if it exists
        if (instanceRef.current) {
          instanceRef.current.dispose();
          instanceRef.current = null;
        }
        // ignore types error
        const WebViewer = (await import('@pdftron/pdfjs-express')).default;

        // Only proceed if the component is still mounted
        if (!isMounted || !viewerRef.current) return;

        // Clear any content from the viewer div
        viewerRef.current.innerHTML = '';

        const instance = await WebViewer(
          {
            path: "/pdfjsexpress",
            initialDoc: url,
          },
          viewerRef.current
        );

        // Store the instance for cleanup
        instanceRef.current = instance;

        const { Core } = instance;
        const { annotationManager, documentViewer } = Core;

        documentViewer.addEventListener("documentLoaded", async () => {
          if (!isMounted) return;

          const redisKey = `${chatId}:${url}`;
          const xfdfString = await redis.get(redisKey);

          if (xfdfString) {
            await annotationManager.importAnnotations(xfdfString);
          }
        });

        annotationManager.addEventListener('annotationChanged', async () => {
          if (!isMounted) return;

          const xfdfString = await annotationManager.exportAnnotations();
          await redis.set(`${chatId}:${url}`, xfdfString);

          if (onAnnotationChange) {
            const annotations = await annotationManager.getAnnotationsList();
            onAnnotationChange(annotations);
          }
        });
      } catch (error) {
        toast({
          type: "error",
          description: "Error loading PDF viewer",
        })
      }
    };

    loadViewer();

    // Cleanup function
    return () => {
      isMounted = false;
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, [url, chatId, onAnnotationChange]);

  return <div ref={viewerRef} style={{ height: '100vh', width: '100%' }} />;
}

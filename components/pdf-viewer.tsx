'use client';

import type { Annotation } from 'pspdfkit';
import { useEffect, useRef, useState } from 'react';

interface PDFViewerProps {
  url: string;
  onAnnotationChange?: (annotations: Annotation[]) => void;
}

export default function PDFViewer({ url, onAnnotationChange }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isClient || !containerRef.current) return;

    const loadViewer = async () => {
        try {
            const PSPDFKit = (await import('pspdfkit')).default;

            const instance = await PSPDFKit.load({
                container: containerRef.current as HTMLElement,
                document: url,
                baseUrl: `${window.location.origin}/`,
            });

            // Fetch existing annotations
            const existingAnnotations = await instance.getAnnotations(0);
            setAnnotations(existingAnnotations.toArray());

            // Listen for annotation changes
            instance.addEventListener('annotations.create', (createdAnnotations) => {
                const newAnnotations = createdAnnotations.toArray();
                setAnnotations((prev) => [...prev, ...newAnnotations]);

                if (onAnnotationChange) {
                    onAnnotationChange([...annotations, ...newAnnotations]);
                }
            });

            instance.addEventListener('annotations.delete', (deletedAnnotations) => {
                const deletedIds = deletedAnnotations.toArray().map((a) => a.id);
                const updatedAnnotations = annotations.filter((a) => !deletedIds.includes(a.id));
                setAnnotations(updatedAnnotations);

                if (onAnnotationChange) {
                    onAnnotationChange(updatedAnnotations);
                }
            });

            // Clean up on unload
            return () => PSPDFKit.unload(containerRef.current);
        } catch (error) {
            console.error("Error loading PSPDFKit:", error);
        }
    };

    loadViewer();
}, [isClient, url, onAnnotationChange]);

  if (!isClient) return null;

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
}
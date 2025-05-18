'use client';

import { redis } from '@/lib/redis';
import type { Annotation, Instance } from '@nutrient-sdk/viewer';
import { useEffect, useRef, useState } from 'react';

interface PDFViewerProps {
  url: string;
  chatId: string;
  onAnnotationChange?: (annotations: Annotation[]) => void;
}

export default function PDFViewer({
  url,
  chatId,
  onAnnotationChange,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isClient || !containerRef.current)
      return;

    const loadViewer = async () => {
      try {
        const { NutrientViewer } = window;
        const container = containerRef.current as HTMLElement;

        // Load saved annotations from Redis
        if (NutrientViewer && containerRef) {
          let instance: Instance | null = null;
          const redisKey = `${chatId}:${url}`;
          const savedAnnotations = await redis.get(redisKey);
          if (!savedAnnotations) {
            instance = await NutrientViewer.load({
              container,
              document: url,
              baseUrl: `${window.location.origin}/nutrient-viewer/`,
            });
          } else {
            instance = await NutrientViewer.load({
              container,
              document: url,
              baseUrl: `${window.location.origin}/nutrient-viewer/`,
              // @ts-ignore - pspdfkit doesn't export the type for this
              instantJSON: savedAnnotations,
            });
          }

          // Fetch existing annotations
          const existingAnnotations = await instance.getAnnotations(0);
          setAnnotations(existingAnnotations.toArray());

          // Listen for annotation changes
          instance.addEventListener(
            'annotations.create',
            (createdAnnotations) => {
              const newAnnotations = createdAnnotations.toArray();
              setAnnotations((prev) => [...prev, ...newAnnotations]);

              if (onAnnotationChange) {
                onAnnotationChange([...annotations, ...newAnnotations]);
              }
            },
          );

          instance.addEventListener(
            'annotations.delete',
            (deletedAnnotations) => {
              const deletedIds = deletedAnnotations.toArray().map((a) => a.id);
              const updatedAnnotations = annotations.filter(
                (a) => !deletedIds.includes(a.id),
              );
              setAnnotations(updatedAnnotations);

              if (onAnnotationChange) {
                onAnnotationChange(updatedAnnotations);
              }
            },
          );

          // Save annotations to Redis when changes occur
          const saveAnnotations = async () => {
            instance.save();
            const instantJSON = await instance.exportInstantJSON();
            await redis.set(redisKey, JSON.stringify(instantJSON));
            console.log('Annotations saved to Redis:', redisKey);
          };

          instance.addEventListener('annotations.create', saveAnnotations);
          instance.addEventListener('annotations.delete', saveAnnotations);
          instance.addEventListener('annotations.update', saveAnnotations);

          // Clean up on unload
          return () => {
            NutrientViewer.unload(container);
            console.log('PSPDFKit unloaded');
          };
        }
      } catch (error) {
        console.error('Error loading PSPDFKit:', error);
      }
    };

    loadViewer();
  }, [isClient, url, onAnnotationChange]);

  if (!isClient) return null;

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
}

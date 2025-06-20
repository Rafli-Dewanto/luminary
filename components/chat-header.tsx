'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import type { Session } from 'next-auth';
import { Show } from './shared/show';
import { EyeIcon, EyeIcon as EyeOffIcon, PlusIcon } from './icons';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
  isPdfVisible,
  onPdfToggle,
  showPdfToggle,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  isPdfVisible?: boolean;
  onPdfToggle?: () => void;
  showPdfToggle?: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 space-x-4">
      <SidebarToggle />

      <Show when={!open || windowWidth < 768}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      </Show>

      {/* <Show when={!isReadonly}>
        <ModelSelector
          session={session}
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      </Show> */}

      <Show when={!isReadonly}>
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      </Show>

      <Show when={!!showPdfToggle}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-1 md:order-4 px-2"
              onClick={onPdfToggle}
            >
              {isPdfVisible ? <EyeIcon /> : <EyeOffIcon />}
              <span className="sr-only">
                {isPdfVisible ? 'Hide PDF' : 'Show PDF'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPdfVisible ? 'Hide PDF' : 'Show PDF'}
          </TooltipContent>
        </Tooltip>
      </Show>

      <Link
        href="/citation"
        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
      >
        Citation Generator
      </Link>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});

'use client';

import { ChatHeader } from '@/components/chat-header';
import { useArtifactSelector } from '@/hooks/use-artifact';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import type { Attachment, UIMessage } from 'ai';
import type { Session } from 'next-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { Artifact } from './artifact';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { VisibilityType } from './visibility-selector';

import dynamic from 'next/dynamic';
const PDFViewer = dynamic(() => import('../components/pdf-viewer'), {
  ssr: false,
});

import { Show } from './shared/show';
import { useBoolean } from '@/hooks/use-boolean';
import { useMediaQuery } from 'usehooks-ts';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  session,
  attachmentUrl,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  attachmentUrl?: string;
}) {
  const { mutate } = useSWRConfig();
  const isPDFSubmitted = useRef(false);
  const router = useRouter();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onResponse: () => {
      if (isPDFSubmitted.current) return;
      isPDFSubmitted.current = true;
      router.refresh();
      return;
    },
    onError: (error) => {
      toast({
        type: 'error',
        description: error.message,
      });
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { value: isPdfVisible, toggle: togglePdfVisible } = useBoolean(true);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <>
      <div
        className={`flex flex-col min-w-0 h-dvh bg-background ${attachmentUrl ? 'md:flex-row' : ''
          }`}
      >
        <div
          className={`flex flex-col flex-1 ${attachmentUrl ? 'md:w-1/2' : 'w-full'}`}
        >
          <ChatHeader
            chatId={id}
            selectedModelId={selectedChatModel}
            selectedVisibilityType={selectedVisibilityType}
            isReadonly={isReadonly}
            session={session}
            isPdfVisible={isPdfVisible}
            onPdfToggle={togglePdfVisible}
            showPdfToggle={Boolean(attachmentUrl)}
          />

          {/* mobile pdf viewer */}
          <Show when={Boolean(attachmentUrl) && attachmentUrl !== '' && isPdfVisible && isMobile}>
            <PDFViewer chatId={id} url={attachmentUrl as string} />
          </Show>

          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
          />

          <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            <Show when={!isReadonly}>
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            </Show>
          </form>
        </div>

        <Show when={Boolean(attachmentUrl) && attachmentUrl !== '' && isPdfVisible && !isMobile}>
          <div className="flex-1 md:w-1/2 overflow-y-auto bg-gray-100">
            <PDFViewer chatId={id} url={attachmentUrl as string} />
          </div>
        </Show>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}

import { useChatVisibility } from '@/hooks/use-chat-visibility';
import type { Chat } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/utils';
import { Check, Pen, X } from 'lucide-react';
import Link from 'next/link';
import { memo, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from './icons';
import { Show } from './shared/show';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  isEditing,
  editedChatId,
  setIsEditing,
  setEditedChatId,
}: {
  chat: Chat;
  isActive: boolean;
  isEditing: boolean;
  editedChatId: string;
  onDelete: (chatId: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  setEditedChatId: (editedChatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });
  const [name, setName] = useState(chat.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateChatName = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat`, {
        method: 'PATCH',
        body: JSON.stringify({
          id: chatId,
          name,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }

      setIsEditing(false);
      window.location.reload();
      toast.success('Chat name updated');
      return;
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setName(chat.title);
    setEditedChatId('');
  };

  useEffect(() => {
    if (isEditing && editedChatId === chat.id) {
      requestAnimationFrame(() => {
        editInputRef.current?.focus();
      });
    }
  }, [isEditing, editedChatId, chat.id]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <div className="w-full">
          <Show when={!isEditing || editedChatId !== chat.id}>
            <Link
              href={`/chat/${chat.id}`}
              onClick={() => setOpenMobile(false)}
            >
              <span className="truncate">
                <Show when={chat.title.length > 26}>
                  {chat.title.substring(0, 26)}.....
                </Show>
                <Show when={chat.title.length <= 26}>{chat.title}</Show>
              </span>
            </Link>
          </Show>
          <Show when={isEditing && editedChatId === chat.id}>
            <div className="flex items-center gap-1 h-6">
              <Input
                ref={editInputRef}
                type="text"
                value={name}
                className="h-6 min-h-0 px-2 py-0 text-sm"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateChatName(chat.id);
                  } else if (e.key === 'Escape') {
                    cancelEditing();
                  }
                }}
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateChatName(chat.id)}
                  className="flex items-center justify-center size-6 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-green-600"
                  aria-label="Submit"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center justify-center size-6 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600"
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </Show>
        </div>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer flex-row"
            onSelect={() => {
              setIsEditing(true);
              setEditedChatId(chat.id);
            }}
          >
            <Pen />
            <span>Rename</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat !== nextProps.chat) return false;
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  if (prevProps.editedChatId !== nextProps.editedChatId) return false;
  return true;
});

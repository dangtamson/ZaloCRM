import { useParams } from 'react-router-dom';
import ChatContactPanel from '../components/chat/ChatContactPanel';
import ConversationFilterSidebar from '../components/chat/ConversationFilterSidebar';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import { useChat } from '../hooks/useChat';
import { useFriendSocket } from '../hooks/useFriendSocket';
import { useZaloPresence } from '../hooks/useZaloPresence';

export default function ChatPage() {
  const { convId } = useParams();
  const chat = useChat(convId);
  useFriendSocket();
  useZaloPresence();

  return (
    <section className="grid gap-4 xl:grid-cols-[200px_320px_minmax(0,1fr)] 2xl:grid-cols-[200px_320px_minmax(0,1fr)_260px]">
      <h1 className="sr-only">Chat</h1>
      <ConversationFilterSidebar />
      <ConversationList
        conversations={chat.conversations}
        loading={chat.loadingConversations}
        onSelect={chat.selectConversation}
        selectedId={chat.selectedConversationId}
      />
      <MessageThread
        conversation={chat.selectedConversation}
        loading={chat.loadingMessages}
        messages={chat.messages}
        onSend={chat.sendMessage}
        sending={chat.sending}
      />
      <ChatContactPanel conversation={chat.selectedConversation} />
      {chat.error ? <p className="xl:col-span-3 text-sm text-red-600">{chat.error}</p> : null}
    </section>
  );
}

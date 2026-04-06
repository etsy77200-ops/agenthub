import MessagesInbox from "@/components/messages/MessagesInbox";

export default async function MessagesThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MessagesInbox initialConversationId={id} />;
}

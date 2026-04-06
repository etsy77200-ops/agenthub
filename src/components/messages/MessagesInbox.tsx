"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getStoredAccessToken } from "@/lib/supabase-rest";
import { useRouter } from "next/navigation";

type ConversationItem = {
  id: string;
  listing_id: string;
  listing_title: string;
  counterpart_id: string;
  counterpart_name: string;
  role: "buyer" | "seller";
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

type MessageItem = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ConversationMeta = {
  id: string;
  listing_id: string;
  listing_title: string;
  counterpart_name: string;
  role: "buyer" | "seller";
};

async function authedFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Accept", "application/json");
  const token = getStoredAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers, credentials: "include" });
}

export default function MessagesInbox({
  initialConversationId,
}: {
  initialConversationId?: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialConversationId ?? "");
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const res = await authedFetch("/api/messages/conversations");
        const data = (await res.json().catch(() => ({}))) as {
          conversations?: ConversationItem[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load conversations.");
          setConversations([]);
        } else {
          const list = Array.isArray(data.conversations) ? data.conversations : [];
          setConversations(list);
          const nextSelected =
            initialConversationId && list.some((c) => c.id === initialConversationId)
              ? initialConversationId
              : list[0]?.id ?? "";
          setSelectedId(nextSelected);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load conversations.");
          setConversations([]);
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, initialConversationId]);

  useEffect(() => {
    if (!selectedId || !user) {
      setMeta(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingThread(true);
      setError("");
      try {
        const res = await authedFetch(`/api/messages/conversations/${selectedId}/messages`);
        const data = (await res.json().catch(() => ({}))) as {
          conversation?: ConversationMeta;
          messages?: MessageItem[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load this conversation.");
          setMeta(null);
          setMessages([]);
          return;
        }
        setMeta(data.conversation ?? null);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch {
        if (!cancelled) {
          setError("Could not load this conversation.");
          setMeta(null);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, user]);

  const onSend = async () => {
    if (!selectedId || !user || sending) return;
    const body = draft.trim();
    if (!body) return;
    if (body.length > 4000) {
      setError("Message is too long.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await authedFetch(`/api/messages/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: MessageItem;
        error?: string;
      };
      if (!res.ok || !data.message) {
        setError(data.error || "Could not send message.");
        return;
      }
      setDraft("");
      setMessages((prev) => [...prev, data.message as MessageItem]);
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, last_message_at: data.message!.created_at, updated_at: data.message!.created_at }
              : c
          )
          .sort((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1))
      );
    } catch {
      setError("Could not send message.");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loadingList) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading messages...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted">
        Redirecting to login…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Messages</h1>
      <p className="text-muted mb-6">
        Contact buyers and sellers from inside AgentHub. Start a conversation from any listing via Contact Seller.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <aside className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-sm font-semibold">Conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              No conversations yet. Open a listing and click <strong>Contact Seller</strong>.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      router.push(`/dashboard/messages/${c.id}`);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-card-hover transition-colors ${
                      selectedId === c.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{c.listing_title}</p>
                    <p className="text-xs text-muted truncate">
                      {c.role === "buyer" ? "Seller" : "Buyer"}: {c.counterpart_name}
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      {new Date(c.last_message_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="lg:col-span-2 border border-border rounded-xl overflow-hidden min-h-[28rem] flex flex-col">
          {!selectedId ? (
            <div className="p-6 text-muted text-sm">
              Select a conversation from the left to open messages.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border bg-secondary">
                <p className="text-sm font-semibold">{meta?.listing_title ?? selectedConversation?.listing_title ?? "Listing"}</p>
                <p className="text-xs text-muted">
                  {meta ? `${meta.role === "buyer" ? "Seller" : "Buyer"}: ${meta.counterpart_name}` : "Loading..."}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {loadingThread ? (
                  <p className="text-sm text-muted animate-pulse">Loading conversation...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted">
                    No messages yet. Send the first one.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-primary text-white"
                              : "bg-secondary text-foreground border border-border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-muted"}`}>
                            {new Date(m.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border p-3">
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                    maxLength={4000}
                  />
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={sending || !draft.trim() || !selectedId}
                    className="self-end px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
                <p className="text-[11px] text-muted mt-1">{draft.length}/4000</p>
              </div>
            </>
          )}
        </section>
      </div>

      <p className="text-sm text-muted mt-4">
        Need platform help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>.
      </p>
    </div>
  );
}

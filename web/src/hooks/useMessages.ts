import { useEffect, useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "../contexts/AuthContext";
import {
  createMessage,
  deleteMessage,
  updateMessage,
  subscribeMessages,
  type Message,
  type MessageStatus,
  type CreateMessageDTO,
  type UpdateMessageDTO,
} from "../services/messagesService";

const PAGE_SIZE = 10;

export interface MessagesResult extends Array<Message> {
  messages: Message[];
  totalPages: number;
  hasNextPage: boolean;
  lastDocument: null;
}

export const useMessages = (
  connectionId?: string,
  statusFilter?: MessageStatus | "ALL",
  page?: number,
) => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [rawMessages, setRawMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = subscribeMessages(
      userId,
      connectionId || undefined,
      (messages) => {
        setRawMessages(messages);
        setIsLoading(false);
        setIsError(false);
      },
      () => {
        setIsError(true);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId, connectionId]);

  const effectiveRawMessages = useMemo(() => (userId ? rawMessages : []), [userId, rawMessages]);

  const filteredMessages = useMemo(() => {
    if (!statusFilter || statusFilter === "ALL") {
      return effectiveRawMessages;
    }
    return effectiveRawMessages.filter((msg) => msg.status === statusFilter);
  }, [effectiveRawMessages, statusFilter]);

  const counts = useMemo(() => {
    const total = effectiveRawMessages.length;
    const scheduled = effectiveRawMessages.filter((m) => m.status === "AGENDADA").length;
    const sent = effectiveRawMessages.filter((m) => m.status === "ENVIADA").length;
    return { total, scheduled, sent };
  }, [effectiveRawMessages]);

  const data = useMemo<MessagesResult>(() => {
    const totalPages = Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE));
    const currentPage = page ?? 1;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginated = page
      ? filteredMessages.slice(startIndex, startIndex + PAGE_SIZE)
      : filteredMessages;

    const result = [...paginated] as MessagesResult;
    result.messages = paginated;
    result.totalPages = totalPages;
    result.hasNextPage = currentPage < totalPages;
    result.lastDocument = null;
    return result;
  }, [filteredMessages, page]);

  return {
    data,
    messages: data.messages,
    allMessages: effectiveRawMessages,
    counts,
    isLoading: userId ? isLoading : false,
    isError,
    isFetching: false,
  };
};

export const useCreateMessageMutation = () => {
  return useMutation({
    mutationFn: (data: CreateMessageDTO) => createMessage(data),
  });
};

export const useUpdateMessageMutation = () => {
  return useMutation({
    mutationFn: (data: UpdateMessageDTO) => updateMessage(data),
  });
};

export const useDeleteMessageMutation = () => {
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
  });
};

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  onSnapshot,
  type Timestamp,
  type DocumentSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";

export type MessageStatus = "AGENDADA" | "ENVIADA";

export interface Message {
  id: string;
  text: string;
  status: MessageStatus;
  contactsIds: string[];
  connectionId: string;
  userId: string;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp | null;
  deletedAt: Timestamp | null;
}

export interface CreateMessageDTO {
  text: string;
  contactsIds: string[];
  connectionId: string;
  userId: string;
  status?: MessageStatus;
  scheduledAt?: Timestamp | null;
  sentAt?: Timestamp | null;
}

export interface UpdateMessageDTO {
  id: string;
  text: string;
  contactsIds: string[];
  scheduledAt?: Timestamp | null;
}

export interface MessagesPage {
  messages: Message[];
  lastDocument: DocumentSnapshot | null;
  hasNextPage: boolean;
}

export const MESSAGES_COLLECTION = "messages";
const PAGE_SIZE = 10;

export const subscribeMessages = (
  userId: string,
  connectionId?: string,
  callback?: (messages: Message[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    where("deletedAt", "==", null),
  ];

  if (connectionId) {
    constraints.push(where("connectionId", "==", connectionId));
  }

  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, MESSAGES_COLLECTION), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          sentAt: data.sentAt ?? data.sendAt ?? null,
        };
      }) as Message[];
      if (callback) callback(messages);
    },
    (error) => {
      if (onError) onError(error);
      else console.error("Erro ao escutar mensagens:", error);
    },
  );
};

export const getMessagesPage = async (
  userId: string,
  connectionId?: string,
  cursor?: DocumentSnapshot | null,
): Promise<MessagesPage> => {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    where("deletedAt", "==", null),
  ];

  if (connectionId) {
    constraints.push(where("connectionId", "==", connectionId));
  }

  constraints.push(orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1));

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, MESSAGES_COLLECTION), ...constraints);

  const snapshot = await getDocs(q);

  const hasNextPage = snapshot.docs.length > PAGE_SIZE;

  const docs = snapshot.docs.slice(0, PAGE_SIZE);

  const messages = docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      sentAt: data.sentAt ?? data.sendAt ?? null,
    };
  }) as Message[];

  return {
    messages,
    lastDocument: docs.at(-1) ?? null,
    hasNextPage,
  };
};

export const createMessage = async (data: CreateMessageDTO) => {
  const isImmediate = data.status === "ENVIADA" || !data.scheduledAt;

  const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
    text: data.text,
    status: isImmediate ? "ENVIADA" : "AGENDADA",
    contactsIds: data.contactsIds,
    connectionId: data.connectionId,
    userId: data.userId,
    scheduledAt: isImmediate ? null : data.scheduledAt,
    sentAt: isImmediate ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    deletedAt: null,
  });

  return docRef.id;
};

export const updateMessage = async ({ id, ...data }: UpdateMessageDTO) => {
  const docRef = doc(db, MESSAGES_COLLECTION, id);

  await updateDoc(docRef, {
    ...data,
  });
};

export const deleteMessage = async (id: string) => {
  const docRef = doc(db, MESSAGES_COLLECTION, id);

  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
  });
};

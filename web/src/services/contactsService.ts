import {
  collection,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  type Timestamp,
  type DocumentSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import { CONNECTIONS_COLLECTION } from "./connectionsService";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  connectionId: string;
  userId: string;
  createdAt: Timestamp | null;
  deletedAt: Timestamp | null;
}

export interface CreateContactDTO {
  name: string;
  phone: string;
  connectionId: string;
  userId: string;
}

export interface UpdateContactDTO {
  id: string;
  name: string;
  phone: string;
  connectionId?: string;
}

export interface ContactsPage {
  contacts: Contact[];
  lastDocument: DocumentSnapshot | null;
  hasNextPage: boolean;
}

export const CONTACTS_COLLECTION = "contacts";

const PAGE_SIZE = 10;

export const subscribeContacts = (
  userId: string,
  connectionId?: string,
  callback?: (contacts: Contact[]) => void,
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

  const q = query(collection(db, CONTACTS_COLLECTION), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const contacts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Contact[];
      if (callback) callback(contacts);
    },
    (error) => {
      if (onError) onError(error);
      else console.error("Erro ao escutar contatos:", error);
    },
  );
};

export const getContactsPage = async (
  connectionId: string,
  userId: string,
  cursor?: DocumentSnapshot | null,
): Promise<ContactsPage> => {
  const constraints: QueryConstraint[] = [
    where("connectionId", "==", connectionId),
    where("userId", "==", userId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE + 1),
  ];

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, CONTACTS_COLLECTION), ...constraints);

  const snapshot = await getDocs(q);

  const hasNextPage = snapshot.docs.length > PAGE_SIZE;

  const docs = snapshot.docs.slice(0, PAGE_SIZE);

  const contacts = docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Contact[];

  return {
    contacts,
    lastDocument: docs[docs.length - 1] ?? null,
    hasNextPage,
  };
};

export const createContact = async (data: CreateContactDTO) => {
  const contactRef = doc(collection(db, CONTACTS_COLLECTION));
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, data.connectionId);

  await runTransaction(db, async (transaction) => {
    const connectionSnap = await transaction.get(connectionRef);

    if (!connectionSnap.exists()) {
      throw new Error("Conexão informada não existe!");
    }

    const currentCount = connectionSnap.data().contacts || 0;

    transaction.update(connectionRef, {
      contacts: currentCount + 1,
    });

    transaction.set(contactRef, {
      name: data.name,
      phone: data.phone,
      connectionId: data.connectionId,
      userId: data.userId,
      createdAt: serverTimestamp(),
      deletedAt: null,
    });
  });

  return contactRef.id;
};

export const updateContact = async ({ id, ...data }: UpdateContactDTO) => {
  const docRef = doc(db, CONTACTS_COLLECTION, id);

  await updateDoc(docRef, {
    ...data,
  });
};

export const deleteContact = async (contactId: string) => {
  const contactRef = doc(db, CONTACTS_COLLECTION, contactId);

  await runTransaction(db, async (transaction) => {
    const contactSnap = await transaction.get(contactRef);

    if (!contactSnap.exists()) {
      throw new Error("Contato não encontrado!");
    }

    const contactData = contactSnap.data();

    if (contactData.deletedAt) {
      throw new Error("Este contato já foi excluído!");
    }

    const connectionId = contactData.connectionId;

    if (connectionId) {
      const connectionRef = doc(db, CONNECTIONS_COLLECTION, connectionId);

      const connectionSnap = await transaction.get(connectionRef);

      if (connectionSnap.exists()) {
        const currentCount = connectionSnap.data().contacts || 0;

        const newCount = Math.max(0, currentCount - 1);

        transaction.update(connectionRef, {
          contacts: newCount,
        });
      }
    }

    transaction.update(contactRef, {
      deletedAt: serverTimestamp(),
    });
  });
};

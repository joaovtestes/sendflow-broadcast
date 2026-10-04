import {
  collection,
  addDoc,
  updateDoc,
  writeBatch,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  getCountFromServer,
  limit,
  startAfter,
  onSnapshot,
  type Timestamp,
  type DocumentSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import { CONTACTS_COLLECTION } from "./contactsService";

export interface Connection {
  id: string;
  name: string;
  contacts: number;
  userId: string;
  createdAt: Timestamp | null;
  deletedAt: Timestamp | null;
}

export interface CreateConnectionDTO {
  name: string;
  userId: string;
}

export interface UpdateConnectionDTO {
  id: string;
  name: string;
}

export interface ConnectionsPage {
  connections: Connection[];
  totalPages: number;
  lastDocument: DocumentSnapshot | null;
  hasNextPage: boolean;
}

export const CONNECTIONS_COLLECTION = "connections";

export const PAGE_SIZE = 10;

export const subscribeConnections = (
  userId: string,
  callback: (connections: Connection[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const q = query(
    collection(db, CONNECTIONS_COLLECTION),
    where("userId", "==", userId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const connections = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Connection[];
      callback(connections);
    },
    (error) => {
      if (onError) onError(error);
      else console.error("Erro ao escutar conexões:", error);
    },
  );
};

export const getConnectionsPage = async (
  userId: string,
  cursor?: DocumentSnapshot | null,
): Promise<ConnectionsPage> => {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
  ];

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(
    collection(db, CONNECTIONS_COLLECTION),
    ...constraints,
    limit(PAGE_SIZE + 1),
  );

  const totalSnapshot = await getCountFromServer(
    query(
      collection(db, CONNECTIONS_COLLECTION),
      where("userId", "==", userId),
      where("deletedAt", "==", null),
    ),
  );

  const snapshot = await getDocs(q);

  const hasNextPage = snapshot.docs.length > PAGE_SIZE;

  const docs = snapshot.docs.slice(0, PAGE_SIZE);

  const connections = docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Connection[];

  return {
    connections,
    totalPages: Math.ceil(totalSnapshot.data().count / PAGE_SIZE),
    lastDocument: docs[docs.length - 1] ?? null,
    hasNextPage,
  };
};

export const getCountConnections = async (userId: string) => {
  const q = query(
    collection(db, CONNECTIONS_COLLECTION),
    where("userId", "==", userId),
    where("deletedAt", "==", null),
  );

  const snapshot = await getCountFromServer(q);

  return snapshot.data().count;
};

export const createConnection = async (data: CreateConnectionDTO) => {
  const docRef = await addDoc(collection(db, CONNECTIONS_COLLECTION), {
    name: data.name,
    contacts: 0,
    userId: data.userId,
    createdAt: serverTimestamp(),
    deletedAt: null,
  });

  return docRef.id;
};

export const updateConnection = async ({ id, name }: UpdateConnectionDTO) => {
  const docRef = doc(db, CONNECTIONS_COLLECTION, id);

  await updateDoc(docRef, {
    name,
  });
};

export const deleteConnection = async (id: string) => {
  const batch = writeBatch(db);

  const connectionRef = doc(db, CONNECTIONS_COLLECTION, id);

  batch.update(connectionRef, {
    deletedAt: serverTimestamp(),
  });

  const contactsQuery = query(
    collection(db, CONTACTS_COLLECTION),
    where("connectionId", "==", id),
    where("deletedAt", "==", null),
  );

  const contactsSnap = await getDocs(contactsQuery);

  contactsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      deletedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

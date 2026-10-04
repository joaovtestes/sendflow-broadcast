import { useEffect, useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "../contexts/AuthContext";
import {
  createContact,
  deleteContact,
  updateContact,
  subscribeContacts,
  type Contact,
  type CreateContactDTO,
  type UpdateContactDTO,
} from "../services/contactsService";

const PAGE_SIZE = 10;

export interface ContactsResult extends Array<Contact> {
  contacts: Contact[];
  totalPages: number;
  hasNextPage: boolean;
  lastDocument: null;
}

export const useContacts = (connectionId?: string, page?: number) => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = subscribeContacts(
      userId,
      connectionId || undefined,
      (contacts) => {
        setAllContacts(contacts);
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

  const data = useMemo<ContactsResult>(() => {
    const effectiveContacts = userId ? allContacts : [];
    const totalPages = Math.max(1, Math.ceil(effectiveContacts.length / PAGE_SIZE));
    const currentPage = page ?? 1;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginated = page
      ? effectiveContacts.slice(startIndex, startIndex + PAGE_SIZE)
      : effectiveContacts;

    const result = [...paginated] as ContactsResult;
    result.contacts = paginated;
    result.totalPages = totalPages;
    result.hasNextPage = currentPage < totalPages;
    result.lastDocument = null;
    return result;
  }, [userId, allContacts, page]);

  return {
    data,
    contacts: data.contacts,
    allContacts: userId ? allContacts : [],
    isLoading: userId ? isLoading : false,
    isError,
    isFetching: false,
  };
};

export const useCreateContactMutation = () => {
  return useMutation({
    mutationFn: (data: CreateContactDTO) => createContact(data),
  });
};

export const useUpdateContactMutation = () => {
  return useMutation({
    mutationFn: (data: UpdateContactDTO) => updateContact(data),
  });
};

export const useDeleteContactMutation = () => {
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
  });
};

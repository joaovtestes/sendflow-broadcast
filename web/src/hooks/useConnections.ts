import { useEffect, useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "../contexts/AuthContext";
import {
  createConnection,
  deleteConnection,
  updateConnection,
  subscribeConnections,
  PAGE_SIZE,
  type Connection,
  type CreateConnectionDTO,
  type UpdateConnectionDTO,
} from "../services/connectionsService";

export interface ConnectionsResult extends Array<Connection> {
  connections: Connection[];
  totalPages: number;
  hasNextPage: boolean;
  lastDocument: null;
}

export const useConnections = (page?: number) => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = subscribeConnections(
      userId,
      (connections) => {
        setAllConnections(connections);
        setIsLoading(false);
        setIsError(false);
      },
      (error) => {
        console.log(error);
        setIsError(true);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const data = useMemo<ConnectionsResult>(() => {
    const effectiveConnections = userId ? allConnections : [];
    const totalPages = Math.max(
      1,
      Math.ceil(effectiveConnections.length / PAGE_SIZE),
    );
    const currentPage = page ?? 1;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginated = page
      ? effectiveConnections.slice(startIndex, startIndex + PAGE_SIZE)
      : effectiveConnections;

    const result = [...paginated] as ConnectionsResult;
    result.connections = paginated;
    result.totalPages = totalPages;
    result.hasNextPage = currentPage < totalPages;
    result.lastDocument = null;
    return result;
  }, [userId, allConnections, page]);

  return {
    data,
    connections: data.connections,
    allConnections: userId ? allConnections : [],
    isLoading: userId ? isLoading : false,
    isError,
    isFetching: false,
  };
};

export const useCreateConnectionMutation = () => {
  return useMutation({
    mutationFn: (data: CreateConnectionDTO) => createConnection(data),
  });
};

export const useUpdateConnectionMutation = () => {
  return useMutation({
    mutationFn: (data: UpdateConnectionDTO) => updateConnection(data),
  });
};

export const useDeleteConnectionMutation = () => {
  return useMutation({
    mutationFn: (id: string) => deleteConnection(id),
  });
};

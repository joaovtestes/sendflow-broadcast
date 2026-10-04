import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  type AuthCredentials,
} from "../services/authService";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: AuthCredentials) => loginWithEmail(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: AuthCredentials) =>
      registerWithEmail(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

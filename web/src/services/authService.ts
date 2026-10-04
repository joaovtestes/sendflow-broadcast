import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export interface AuthCredentials {
  email: string;
  password: string;
}

export const getCurrentUser = async (): Promise<User | null> => {
  await auth.authStateReady();
  return auth.currentUser;
};

export const loginWithEmail = async ({ email, password }: AuthCredentials) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const registerWithEmail = async ({
  email,
  password,
}: AuthCredentials) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return credential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

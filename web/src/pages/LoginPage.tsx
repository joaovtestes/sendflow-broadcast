import React, { useState } from "react";
import {
  Card,
  Box,
  TextField,
  Button,
  FormLabel,
  FormControl,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../hooks/useAuthMutations";
import TextLogo from "../components/TextLogo";

const formatAuthError = (error: unknown): string => {
  if (!error || typeof error !== "object") return "Erro ao fazer login.";
  const err = error as { code?: string; message?: string };
  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "Formato de e-mail inválido.";
    case "auth/user-disabled":
      return "Esta conta foi desativada.";
    case "auth/too-many-requests":
      return "Muitas tentativas sem sucesso. Tente novamente mais tarde.";
    default:
      return err.message || "Erro ao realizar login. Tente novamente.";
  }
};

const darkInputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    "&:hover fieldset": {
      borderColor: "#6366f1",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#818cf8",
      borderWidth: "2px",
    },
  },
  "& .MuiInputBase-input": {
    color: "#ffffff !important",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#9ca3af !important",
    opacity: 1,
  },
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate("/"),
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1e24] p-4">
      <Card
        variant="outlined"
        className="w-full max-w-md rounded-2xl! py-8 px-6 bg-[#2a2a33]! border-gray-700 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <TextLogo />
          </div>
          <p className="text-sm text-gray-400">
            Acesse sua conta para gerenciar conexões e broadcasts
          </p>
        </div>

        {loginMutation.isError && (
          <Alert severity="error" className="mb-4">
            {formatAuthError(loginMutation.error)}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 2.5,
          }}
        >
          <FormControl>
            <FormLabel
              htmlFor="email"
              className="text-start mb-1 text-gray-300 text-sm"
            >
              E-mail
            </FormLabel>
            <TextField
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              size="small"
              disabled={loginMutation.isPending}
              sx={darkInputSx}
            />
          </FormControl>

          <FormControl>
            <FormLabel
              htmlFor="password"
              className="text-start mb-1 text-gray-300 text-sm"
            >
              Senha
            </FormLabel>
            <TextField
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              id="password"
              autoComplete="current-password"
              required
              fullWidth
              variant="outlined"
              size="small"
              disabled={loginMutation.isPending}
              sx={darkInputSx}
            />
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loginMutation.isPending || !email || !password}
            sx={{
              marginTop: "8px",
              padding: "10px 0",
              fontWeight: 600,
              fontSize: "0.95rem",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "#4f46e5",
              },
            }}
          >
            {loginMutation.isPending ? (
              <span className="flex items-center gap-2">
                <CircularProgress size={18} color="inherit" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </Button>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-gray-700 w-full" />
            <span className="bg-[#2a2a33] px-3 text-xs text-gray-400 uppercase font-medium">
              ou
            </span>
            <div className="border-t border-gray-700 w-full" />
          </div>

          <Button
            type="button"
            fullWidth
            variant="outlined"
            onClick={() => navigate("/register")}
            sx={{
              padding: "10px 0",
              fontWeight: 600,
              fontSize: "0.95rem",
              borderColor: "#6366f1",
              color: "#ffffff",
              borderWidth: "1.5px",
              "&:hover": {
                borderColor: "#818cf8",
                borderWidth: "1.5px",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
              },
            }}
          >
            Criar Conta
          </Button>
        </Box>
      </Card>
    </div>
  );
};

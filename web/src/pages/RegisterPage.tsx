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
import { useRegisterMutation } from "../hooks/useAuthMutations";
import TextLogo from "../components/TextLogo";

const formatRegisterError = (error: unknown): string => {
  if (!error || typeof error !== "object") return "Erro ao criar conta.";
  const err = error as { code?: string; message?: string };
  switch (err.code) {
    case "auth/email-already-in-use":
      return "Este e-mail já está sendo utilizado por outro usuário.";
    case "auth/invalid-email":
      return "Formato de e-mail inválido.";
    case "auth/weak-password":
      return "A senha deve conter pelo menos 6 caracteres.";
    case "auth/operation-not-allowed":
      return "Cadastro com e-mail/senha não está habilitado.";
    default:
      return err.message || "Erro ao criar conta. Tente novamente.";
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

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!email || !password) return;

    if (password.length < 6) {
      setValidationError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("As senhas não coincidem.");
      return;
    }

    registerMutation.mutate(
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
            Crie sua conta para começar a enviar broadcasts
          </p>
        </div>

        {(validationError || registerMutation.isError) && (
          <Alert severity="error" className="mb-4">
            {validationError || formatRegisterError(registerMutation.error)}
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
              disabled={registerMutation.isPending}
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
              placeholder="Mínimo 6 caracteres"
              type="password"
              id="password"
              autoComplete="new-password"
              required
              fullWidth
              variant="outlined"
              size="small"
              disabled={registerMutation.isPending}
              sx={darkInputSx}
            />
          </FormControl>

          <FormControl>
            <FormLabel
              htmlFor="confirmPassword"
              className="text-start mb-1 text-gray-300 text-sm"
            >
              Confirmar Senha
            </FormLabel>
            <TextField
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              required
              fullWidth
              variant="outlined"
              size="small"
              disabled={registerMutation.isPending}
              sx={darkInputSx}
            />
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={
              registerMutation.isPending ||
              !email ||
              !password ||
              !confirmPassword
            }
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
            {registerMutation.isPending ? (
              <span className="flex items-center gap-2">
                <CircularProgress size={18} color="inherit" />
                Cadastrando...
              </span>
            ) : (
              "Criar Conta"
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
            onClick={() => navigate("/login")}
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
            Já tenho uma conta (Fazer Login)
          </Button>
        </Box>
      </Card>
    </div>
  );
};

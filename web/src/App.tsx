import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ConnectionsPage from "./pages/ConnectionsPage";
import ContactsPage from "./pages/ContactsPage";
import MessagesPage from "./pages/MessagesPage";

const theme = createTheme({
  palette: {
    text: {
      primary: "#2a2a33",
      secondary: "#6b7280",
    },
    primary: {
      main: "#6366f1",
      contrastText: "#fff",
    },
    secondary: {
      main: "#4f46e5",
      contrastText: "#fff",
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
  },
  components: {
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.02)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "10px",
          padding: "8px 16px",
          fontWeight: 600,

          "&.Mui-disabled": {
            color: "rgba(169, 169, 169, 0.38)",
            backgroundColor: "rgba(0, 0, 0, 0.12)",
            boxShadow: "none",
          },
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: "#1f2937",
          fontWeight: 700,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "16px",
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "12px 24px 16px",
          "&:first-of-type": {
            paddingTop: "12px",
          },
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "8px 24px 20px",
          gap: "8px",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6366f1",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4f46e5",
            borderWidth: "2px",
          },
          "& input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 100px #2a2a33 inset !important",
            WebkitTextFillColor: "#ffffff !important",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route
                  path="/connections/:id/contacts"
                  element={<ContactsPage />}
                />
                <Route path="/messages" element={<MessagesPage />} />
                <Route
                  path="/connections/:id/messages"
                  element={<MessagesPage />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

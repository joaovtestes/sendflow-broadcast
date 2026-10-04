import { Link, useLocation, useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import TextLogo from "./TextLogo";
import { useAuth } from "../contexts/AuthContext";
import { useLogoutMutation } from "../hooks/useAuthMutations";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/login");
  };

  const navLinks = [
    { label: "Dashboard", path: "/" },
    { label: "Conexões", path: "/connections" },
    { label: "Contatos", path: "/contacts" },
    { label: "Mensagens", path: "/messages" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (location.pathname.endsWith("messages")) {
      return path == "/messages";
    }
    if (location.pathname.endsWith("contacts")) {
      return path == "/contacts";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <header className="h-20 bg-bgprimary w-full flex justify-center border-b border-gray-800 shadow-sm sticky top-0 z-50">
      <div className="h-full w-[90%] max-w-[1400px] flex items-center justify-between px-4">
        <Link to="/" className="flex items-center no-underline">
          <TextLogo variant="short" />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  active
                    ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-700">
              <AccountCircleIcon fontSize="small" className="text-indigo-400" />
              <span className="truncate max-w-[160px]">{user.email}</span>
            </div>
          )}

          <Tooltip title="Sair da conta">
            <IconButton
              onClick={handleLogout}
              size="small"
              className="text-gray-400 hover:text-red-400"
              sx={{ color: "#9ca3af" }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

import { Card, Button, CircularProgress, Chip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import ChatIcon from "@mui/icons-material/Chat";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Link, useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import { useConnections } from "@/hooks/useConnections";
import { useContacts } from "@/hooks/useContacts";
import { useMessages } from "@/hooks/useMessages";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { allConnections, isLoading: isLoadingConnections } = useConnections();
  const { allContacts, isLoading: isLoadingContacts } = useContacts();
  const { allMessages, counts, isLoading: isLoadingMessages } = useMessages();

  const isLoading =
    isLoadingConnections || isLoadingContacts || isLoadingMessages;

  const recentMessages = allMessages.slice(0, 5);

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-100 pb-16">
      <Header />

      <main className="w-[90%] max-w-[1200px] mt-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary! text-start">
              Painel de Controle
            </h1>
            <p className="text-sm text-bgprimary! mt-1">
              Visão geral das suas conexões, contatos e mensagens de broadcast
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card
            variant="outlined"
            className="p-6 bg-[#2a2a33]! text-white border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/connections")}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider text-gray-400">
                CONEXÕES
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <GroupsIcon />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                allConnections.length
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2!">
              Conexões ativas cadastradas
            </p>
          </Card>

          <Card
            variant="outlined"
            className="p-6 bg-[#2a2a33]! text-white border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/contacts")}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider text-gray-400">
                CONTATOS
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <PersonIcon />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                allContacts.length
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2!">
              Total de contatos em todas as conexões
            </p>
          </Card>

          <Card
            variant="outlined"
            className="p-6 bg-[#2a2a33]! text-white border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/messages")}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider text-gray-400">
                MENSAGENS
              </span>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <ChatIcon />
              </div>
            </div>
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-3xl font-extrabold text-white">
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  counts.total
                )}
              </span>
            </div>
            {!isLoading && (
              <p className="text-xs text-gray-400 mt-2!">
                ({counts.sent} enviadas, {counts.scheduled} agendadas)
              </p>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            variant="outlined"
            className="p-6 bg-white shadow-sm flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-bold text-primary! mb-1! text-start">
                Ações Rápidas
              </h2>
              <p className="text-xs text-bgprimary! mb-4! text-start">
                Acesso direto às principais funcionalidades da plataforma.
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outlined"
                  fullWidth
                  className="justify-between! text-left!"
                  onClick={() => navigate("/connections")}
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                >
                  Gerenciar Conexões
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  className="justify-between! text-left!"
                  onClick={() => navigate("/contacts")}
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                >
                  Gerenciar Contatos
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  className="justify-between! text-left!"
                  onClick={() => navigate("/messages")}
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                >
                  Disparar Mensagens
                </Button>
              </div>
            </div>
          </Card>

          <Card
            variant="outlined"
            className="p-6 bg-white shadow-sm lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-primary! mb-1! text-start">
                  Mensagens Recentes
                </h2>
                <p className="text-xs text-bgprimary!">
                  Últimos disparos e agendamentos realizados
                </p>
              </div>

              <Link
                to="/messages"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
              >
                Ver todas
                <ArrowForwardIcon fontSize="inherit" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <CircularProgress size={30} />
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Nenhum broadcast criado até o momento.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600! truncate">
                        {msg.text}
                      </p>
                      <span className="text-xs text-gray-400">
                        {msg.contactsIds ? msg.contactsIds.length : "0"}{" "}
                        destinatário(s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {msg.status === "ENVIADA" ? (
                        <Chip
                          icon={<CheckCircleIcon fontSize="small" />}
                          label="Enviada"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<ScheduleIcon fontSize="small" />}
                          label="Agendada"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

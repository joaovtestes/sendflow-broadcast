import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import DeselectIcon from "@mui/icons-material/Deselect";
import MessageIcon from "@mui/icons-material/Message";

import { useParams, useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";

import { useAuth } from "../contexts/AuthContext";
import { useConnections } from "../hooks/useConnections";
import { useContacts } from "../hooks/useContacts";
import {
  useMessages,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
} from "../hooks/useMessages";
import Pagination from "@/components/Pagination";
import Header from "@/components/Header";
import type { Message, MessageStatus } from "../services/messagesService";

const formatDate = (
  timestamp: { toDate?: () => Date } | Date | string | null | undefined,
): string => {
  if (!timestamp) return "-";
  if (
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof timestamp.toDate === "function"
  ) {
    return timestamp.toDate().toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }
  return new Date(timestamp as string | Date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getMinDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function MessagesPage() {
  const { id: routeConnectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { allConnections, isLoading: isLoadingConnections } = useConnections();

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");

  const activeConnectionId =
    routeConnectionId || selectedConnectionId || (allConnections[0]?.id ?? "");

  const selectedConnection = useMemo(
    () => allConnections.find((c) => c.id === activeConnectionId),
    [allConnections, activeConnectionId],
  );

  const { allContacts: connectionContacts, isLoading: isLoadingContacts } =
    useContacts(activeConnectionId);

  const [statusFilter, setStatusFilter] = useState<MessageStatus | "ALL">(
    "ALL",
  );
  const [page, setPage] = useState(1);

  const [prevFilterState, setPrevFilterState] = useState({
    connectionId: activeConnectionId,
    filter: statusFilter,
  });

  if (
    prevFilterState.connectionId !== activeConnectionId ||
    prevFilterState.filter !== statusFilter
  ) {
    setPrevFilterState({
      connectionId: activeConnectionId,
      filter: statusFilter,
    });
    setPage(1);
  }

  const {
    data: messagesData,
    counts,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
  } = useMessages(activeConnectionId || undefined, statusFilter, page);

  const messages = messagesData?.messages ?? [];
  const totalPages = messagesData?.totalPages ?? 1;
  const hasNextPage = messagesData?.hasNextPage ?? false;

  const createMutation = useCreateMessageMutation();
  const updateMutation = useUpdateMessageMutation();
  const deleteMutation = useDeleteMessageMutation();

  const [text, setText] = useState("");
  const [sendType, setSendType] = useState<"IMMEDIATE" | "SCHEDULED">(
    "IMMEDIATE",
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editSelectedContactIds, setEditSelectedContactIds] = useState<
    string[]
  >([]);
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllContacts = () => {
    if (selectedContactIds.length === connectionContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(connectionContacts.map((c) => c.id));
    }
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!user?.uid || !activeConnectionId) {
      setFormError("Selecione uma conexão válida.");
      return;
    }

    if (!text.trim()) {
      setFormError("Digite a mensagem do broadcast.");
      return;
    }

    if (selectedContactIds.length === 0) {
      setFormError("Selecione pelo menos um contato para receber o broadcast.");
      return;
    }

    let scheduleTimestamp: Timestamp | null = null;

    if (sendType === "SCHEDULED") {
      if (!scheduledAt) {
        setFormError("Informe a data e horário para agendar o envio.");
        return;
      }

      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate.getTime() <= Date.now()) {
        setFormError(
          "O horário de agendamento deve ser uma data e horário futuros.",
        );
        return;
      }

      scheduleTimestamp = Timestamp.fromDate(scheduledDate);
    }

    try {
      await createMutation.mutateAsync({
        text: text.trim(),
        contactsIds: selectedContactIds,
        connectionId: activeConnectionId,
        userId: user.uid,
        status: sendType === "IMMEDIATE" ? "ENVIADA" : "AGENDADA",
        scheduledAt: scheduleTimestamp,
      });

      setText("");
      setScheduledAt("");
      setSelectedContactIds([]);
      setFormSuccess(
        sendType === "IMMEDIATE"
          ? "Mensagem disparada com sucesso!"
          : "Mensagem agendada com sucesso! O envio será realizado na data programada.",
      );
      setPage(1);

      setTimeout(() => setFormSuccess(""), 5000);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || "Erro ao processar mensagem.");
    }
  };

  const handleOpenEdit = (msg: Message) => {
    setEditingMessage(msg);
    setEditText(msg.text);
    setEditSelectedContactIds(msg.contactsIds || []);
    if (msg.scheduledAt) {
      const date = msg.scheduledAt.toDate();
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      setEditScheduledAt(localISOTime);
    } else {
      setEditScheduledAt("");
    }
    setEditError("");
  };

  const handleCloseEdit = () => {
    setEditingMessage(null);
    setEditText("");
    setEditScheduledAt("");
    setEditSelectedContactIds([]);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    setFormError("");

    if (!editingMessage) return;
    setEditError("");

    if (!editText.trim()) {
      setEditError("A mensagem não pode ficar vazia.");
      return;
    }

    if (editSelectedContactIds.length === 0) {
      setEditError("Selecione pelo menos um contato destinatário.");
      return;
    }

    let scheduleTimestamp: Timestamp | null = null;
    if (editScheduledAt) {
      const scheduledDate = new Date(editScheduledAt);
      scheduleTimestamp = Timestamp.fromDate(scheduledDate);

      if (scheduledDate.getTime() <= Date.now()) {
        setFormError(
          "O horário de agendamento deve ser uma data e horário futuros.",
        );
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: editingMessage.id,
        text: editText.trim(),
        contactsIds: editSelectedContactIds,
        scheduledAt: scheduleTimestamp,
      });
      handleCloseEdit();
    } catch (err: unknown) {
      const error = err as Error;
      setEditError(error?.message || "Erro ao atualizar mensagem.");
    }
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error("Erro ao excluir mensagem:", err);
    }
  };

  if (!isLoadingConnections && allConnections.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center bg-gray-100 pb-10">
        <Header />
        <main className="w-full max-w-4xl px-4 mt-12 flex flex-col items-center">
          <Paper className="p-8 text-center max-w-md w-full rounded-2xl shadow-sm">
            <MessageIcon
              sx={{ fontSize: 48, color: "#6366f1" }}
              className="mb-3"
            />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Nenhuma Conexão Encontrada
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Para disparar broadcasts, você precisa primeiro criar uma conexão
              e adicionar contatos.
            </p>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/connections")}
            >
              Criar Conexão
            </Button>
          </Paper>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-100 pb-16">
      <Header />

      <main className="w-full max-w-4xl px-4 mt-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="text"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
          >
            Dashboard
          </Button>

          <FormControl
            size="small"
            sx={{ minWidth: 240 }}
            className="w-full sm:w-auto"
          >
            <InputLabel id="connection-select-label">Conexão</InputLabel>
            <Select
              labelId="connection-select-label"
              value={activeConnectionId}
              label="Conexão"
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedConnectionId(newId);
                navigate(`/connections/${newId}/messages`);
              }}
            >
              {allConnections.map((conn) => (
                <MenuItem key={conn.id} value={conn.id}>
                  {conn.name} ({conn.contacts ?? 0} contatos)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <Paper className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary! text-start">
                Novo Broadcast
              </h2>
              <p className="text-xs text-gray-500 text-bgprimary!">
                Envie ou agende mensagens para os contatos de{" "}
                {selectedConnection?.name || "sua conexão"}.
              </p>
            </div>
          </div>

          {formError && (
            <Alert severity="error" className="mb-4">
              {formError}
            </Alert>
          )}

          {formSuccess && (
            <Alert severity="success" className="mb-4">
              {formSuccess}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <TextField
              label="Mensagem do Broadcast"
              placeholder="Digite o texto da mensagem que deseja transmitir aos contatos..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              required
              helperText={`${text.length} caracteres`}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Destinatários ({selectedContactIds.length} selecionado
                  {selectedContactIds.length === 1 ? "" : "s"})
                </span>

                {connectionContacts.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={
                      selectedContactIds.length ===
                      connectionContacts.length ? (
                        <DeselectIcon />
                      ) : (
                        <SelectAllIcon />
                      )
                    }
                    onClick={handleSelectAllContacts}
                  >
                    {selectedContactIds.length === connectionContacts.length
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </Button>
                )}
              </div>

              {isLoadingContacts ? (
                <div className="py-4 flex justify-center">
                  <CircularProgress size={24} />
                </div>
              ) : connectionContacts.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                  <span>
                    Esta conexão ainda não possui contatos cadastrados.
                  </span>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() =>
                      navigate(`/connections/${selectedConnectionId}/contacts`)
                    }
                  >
                    Adicionar Contatos
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                  {connectionContacts.map((contact) => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    return (
                      <Chip
                        key={contact.id}
                        label={`${contact.name} (${contact.phone})`}
                        clickable
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        onClick={() => handleToggleContact(contact.id)}
                        size="medium"
                        className="transition-all"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Modo de Disparo
              </span>
              <RadioGroup
                row
                value={sendType}
                onChange={(e) =>
                  setSendType(e.target.value as "IMMEDIATE" | "SCHEDULED")
                }
              >
                <FormControlLabel
                  value="IMMEDIATE"
                  control={<Radio size="small" />}
                  label="Enviar Imediatamente"
                />
                <FormControlLabel
                  value="SCHEDULED"
                  control={<Radio size="small" />}
                  label="Agendar para Data Futura"
                />
              </RadioGroup>

              {sendType === "SCHEDULED" && (
                <div className="mt-3 max-w-sm">
                  <TextField
                    label="Data e Hora do Envio"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { min: getMinDateTimeLocal() },
                    }}
                    fullWidth
                    size="small"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={
                  sendType === "IMMEDIATE" ? <SendIcon /> : <ScheduleIcon />
                }
                disabled={
                  createMutation.isPending ||
                  !text.trim() ||
                  selectedContactIds.length === 0 ||
                  (sendType === "SCHEDULED" && !scheduledAt)
                }
              >
                {createMutation.isPending
                  ? "Processando..."
                  : sendType === "IMMEDIATE"
                    ? "Disparar Imediatamente"
                    : "Agendar Broadcast"}
              </Button>
            </div>
          </form>
        </Paper>

        <Paper className="overflow-hidden rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Histórico de Mensagens
              </h2>
              <p className="text-xs text-gray-500">
                Atualização em tempo real sincronizada via Firestore
              </p>
            </div>

            <Tabs
              value={statusFilter}
              onChange={(_, val) => setStatusFilter(val)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label={`Todas (${counts.total})`} value="ALL" />
              <Tab label={`Agendadas (${counts.scheduled})`} value="AGENDADA" />
              <Tab label={`Enviadas (${counts.sent})`} value="ENVIADA" />
            </Tabs>
          </div>

          {isLoadingMessages ? (
            <div className="flex justify-center py-12">
              <CircularProgress size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Nenhuma mensagem encontrada para o filtro selecionado.
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {messages.map((message) => {
                  const expanded = expandedMessages.has(message.id);
                  const isLong = message.text.length > 160;
                  const displayText =
                    isLong && !expanded
                      ? `${message.text.slice(0, 160)}...`
                      : message.text;

                  const isSent = message.status === "ENVIADA";

                  return (
                    <div
                      key={message.id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isSent ? (
                              <Chip
                                icon={<CheckCircleIcon fontSize="small" />}
                                label="Enviada"
                                color="success"
                                size="small"
                                variant="filled"
                              />
                            ) : (
                              <Chip
                                icon={<ScheduleIcon fontSize="small" />}
                                label="Agendada"
                                color="warning"
                                size="small"
                                variant="filled"
                              />
                            )}

                            {isSent && message.sentAt && (
                              <span className="text-xs text-emerald-700 font-medium">
                                Enviada em {formatDate(message.sentAt)}
                              </span>
                            )}

                            {!isSent && message.scheduledAt && (
                              <span className="text-xs text-amber-700 font-medium">
                                Programada para{" "}
                                {formatDate(message.scheduledAt)}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
                            {displayText}
                          </p>

                          {isLong && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => toggleMessage(message.id)}
                              startIcon={
                                expanded ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )
                              }
                              className="mt-1! p-0!"
                            >
                              {expanded ? "Ver menos" : "Ver mais"}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isSent && (
                            <Tooltip title="Editar Mensagem Agendada">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(message)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Excluir Mensagem">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(message.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">
                          {message.contactsIds.length} Destinatário(s):
                        </span>
                        {message.contactsIds.map((cId) => {
                          const contact = connectionContacts.find(
                            (c) => c.id === cId,
                          );
                          return (
                            <span
                              key={cId}
                              className="px-2 py-0.5 bg-gray-100 rounded text-gray-700"
                            >
                              {contact ? contact.name : cId}
                            </span>
                          );
                        })}
                        <span className="ml-auto text-[11px] text-gray-400">
                          Criada em: {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  hasNextPage={hasNextPage}
                  disabled={isFetchingMessages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </Paper>
      </main>

      <Dialog
        open={!!editingMessage}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar Mensagem Agendada</DialogTitle>
        {formError && (
          <Alert severity="error" className="mb-4">
            {formError}
          </Alert>
        )}
        <DialogContent className="flex flex-col gap-4 pt-2">
          {editError && <Alert severity="error">{editError}</Alert>}

          <TextField
            label="Mensagem"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            required
          />

          <TextField
            label="Data e Hora do Envio"
            type="datetime-local"
            value={editScheduledAt}
            onChange={(e) => setEditScheduledAt(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: getMinDateTimeLocal() },
            }}
            fullWidth
            size="small"
            required
          />

          <div>
            <span className="text-xs font-semibold text-gray-600 block mb-2">
              Destinatários ({editSelectedContactIds.length} selecionado(s))
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {connectionContacts.map((contact) => {
                const isSelected = editSelectedContactIds.includes(contact.id);
                return (
                  <Chip
                    key={contact.id}
                    label={contact.name}
                    clickable
                    color={isSelected ? "primary" : "default"}
                    variant={isSelected ? "filled" : "outlined"}
                    size="small"
                    onClick={() => {
                      setEditSelectedContactIds((prev) =>
                        prev.includes(contact.id)
                          ? prev.filter((id) => id !== contact.id)
                          : [...prev, contact.id],
                      );
                    }}
                  />
                );
              })}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={handleCloseEdit} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={updateMutation.isPending || !editText.trim()}
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Excluir Mensagem?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza de que deseja excluir esta mensagem? Esta ação removerá
            o registro do seu histórico.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setDeletingId(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

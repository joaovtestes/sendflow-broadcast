import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  Alert,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import SendIcon from "@mui/icons-material/Send";

import Header from "@/components/Header";
import Pagination from "../components/Pagination";
import { useAuth } from "../contexts/AuthContext";
import { useConnections } from "../hooks/useConnections";
import {
  useContacts,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "../hooks/useContacts";
import { useParams, useNavigate } from "react-router-dom";
import type { Contact } from "../services/contactsService";

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatDate = (
  timestamp: { toDate?: () => Date } | Date | string | null | undefined,
): string => {
  if (!timestamp) return "-";
  if (
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof timestamp.toDate === "function"
  ) {
    return timestamp.toDate().toLocaleDateString("pt-BR");
  }
  return new Date(timestamp as string | Date).toLocaleDateString("pt-BR");
};

export default function ContactsPage() {
  const { id: routeConnectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { allConnections, isLoading: isLoadingConnections } = useConnections();

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");

  const activeConnectionId =
    routeConnectionId || selectedConnectionId || (allConnections[0]?.id ?? "");

  const selectedConnection = useMemo(() => {
    return allConnections.find((c) => c.id === activeConnectionId);
  }, [allConnections, activeConnectionId]);

  const [page, setPage] = useState(1);
  const [prevConnId, setPrevConnId] = useState(activeConnectionId);

  if (prevConnId !== activeConnectionId) {
    setPrevConnId(activeConnectionId);
    setPage(1);
  }

  const {
    data: dataContacts,
    isLoading: isLoadingContacts,
    isError,
    isFetching,
  } = useContacts(activeConnectionId, page);

  const contacts = dataContacts?.contacts ?? [];
  const totalPages = dataContacts?.totalPages ?? 1;
  const hasNextPage = dataContacts?.hasNextPage ?? false;

  const createMutation = useCreateContactMutation();
  const updateMutation = useUpdateContactMutation();
  const deleteMutation = useDeleteContactMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingContact(null);
    setNameInput("");
    setPhoneInput("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setNameInput(contact.name);
    setPhoneInput(contact.phone);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNameInput("");
    setPhoneInput("");
    setEditingContact(null);
    setFormError("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneInput(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!nameInput.trim()) {
      setFormError("Informe o nome do contato.");
      return;
    }

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFormError("Informe um telefone válido com DDD (mínimo 10 dígitos).");
      return;
    }

    if (!user?.uid || !activeConnectionId) {
      setFormError("Selecione uma conexão válida.");
      return;
    }

    try {
      if (editingContact) {
        await updateMutation.mutateAsync({
          id: editingContact.id,
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          connectionId: activeConnectionId,
        });
      } else {
        await createMutation.mutateAsync({
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          connectionId: activeConnectionId,
          userId: user.uid,
        });
      }
      handleCloseModal();
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || "Erro ao salvar contato.");
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingId(id);
  };

  const handleCloseDeleteDialog = () => {
    setDeletingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error("Erro ao excluir contato:", err);
    }
  };

  if (!isLoadingConnections && allConnections.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center bg-gray-100 pb-10">
        <Header />
        <main className="w-full max-w-4xl px-4 mt-12 flex flex-col items-center">
          <Paper className="p-8 text-center max-w-md w-full rounded-2xl shadow-sm">
            <PersonIcon
              sx={{ fontSize: 48, color: "#6366f1" }}
              className="mb-3"
            />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Nenhuma Conexão Encontrada
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Para cadastrar contatos, você precisa primeiro criar pelo menos
              uma conexão.
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
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-100 pb-10">
      <Header />

      <main className="w-full max-w-4xl px-4 mt-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="text"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/connections")}
          >
            Voltar para Conexões
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {selectedConnection && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<SendIcon />}
                onClick={() =>
                  navigate(`/connections/${selectedConnection.id}/messages`)
                }
              >
                Broadcast
              </Button>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModal}
              disabled={!activeConnectionId}
            >
              Novo Contato
            </Button>
          </div>
        </div>

        <Paper className="p-4 shadow-sm rounded-xl flex flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full flex items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {selectedConnection?.contacts ?? 0} contato(s) nesta conexão
            </span>
          </div>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              id="select-connection"
              value={activeConnectionId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedConnectionId(newId);
                navigate(`/connections/${newId}/contacts`);
              }}
            >
              {allConnections.map((conn) => (
                <MenuItem key={conn.id} value={conn.id}>
                  {conn.name} ({conn.contacts ?? 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <TableContainer
          component={Paper}
          className="shadow-sm rounded-lg overflow-hidden"
        >
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell className="font-semibold text-gray-700">
                  Nome
                </TableCell>
                <TableCell className="font-semibold text-gray-700">
                  Telefone
                </TableCell>
                <TableCell className="font-semibold text-gray-700">
                  Cadastrado em
                </TableCell>
                <TableCell
                  align="center"
                  className="font-semibold text-gray-700"
                >
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoadingContacts ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" className="py-8">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    className="py-6 text-red-500"
                  >
                    Erro ao carregar contatos desta conexão.
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    className="py-8 text-gray-500"
                  >
                    Nenhum contato cadastrado nesta conexão.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id} hover>
                    <TableCell className="font-medium text-gray-800">
                      {contact.name}
                    </TableCell>

                    <TableCell className="text-gray-600">
                      {contact.phone}
                    </TableCell>

                    <TableCell className="text-gray-500 text-xs">
                      {formatDate(contact.createdAt)}
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip title="Editar Contato">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEditModal(contact)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Excluir Contato">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(contact.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoadingContacts &&
            !isError &&
            contacts.length > 0 &&
            totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                disabled={isFetching}
                onPageChange={setPage}
              />
            )}
        </TableContainer>
      </main>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="xs"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingContact ? "Editar Contato" : "Novo Contato"}
          </DialogTitle>

          <DialogContent className="flex flex-col gap-4 pt-2">
            {formError && (
              <Alert severity="error" className="mb-2">
                {formError}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              label="Nome do Contato"
              placeholder="Ex: João da Silva"
              type="text"
              fullWidth
              variant="outlined"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />

            <TextField
              margin="dense"
              label="Telefone com DDD"
              placeholder="(11) 98765-4321"
              type="tel"
              fullWidth
              variant="outlined"
              value={phoneInput}
              onChange={handlePhoneChange}
              helperText="Formato: (DDD) 9XXXX-XXXX"
              required
            />
          </DialogContent>

          <DialogActions className="px-6 pb-4">
            <Button onClick={handleCloseModal} color="inherit">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !nameInput.trim() ||
                !phoneInput.trim()
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : editingContact
                  ? "Salvar"
                  : "Cadastrar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={!!deletingId}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Excluir Contato?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza de que deseja excluir este contato? Esta ação não pode
            ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={handleCloseDeleteDialog} color="inherit">
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

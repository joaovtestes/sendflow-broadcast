import { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";

import Pagination from "@/components/Pagination";
import Header from "@/components/Header";
import {
  useConnections,
  useCreateConnectionMutation,
  useUpdateConnectionMutation,
  useDeleteConnectionMutation,
} from "../hooks/useConnections";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const createMutation = useCreateConnectionMutation();
  const updateMutation = useUpdateConnectionMutation();
  const deleteMutation = useDeleteConnectionMutation();

  const [page, setPage] = useState(1);

  const {
    data: dataConnections,
    isLoading,
    isError,
    isFetching,
  } = useConnections(page);

  const connections = dataConnections?.connections ?? [];
  const hasNextPage = dataConnections?.hasNextPage ?? false;
  const totalPages = dataConnections?.totalPages ?? 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNameInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (id: string, currentName: string) => {
    setEditingId(id);
    setNameInput(currentName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNameInput("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !user?.uid) return;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        name: nameInput.trim(),
      });
    } else {
      await createMutation.mutateAsync({
        name: nameInput.trim(),
        userId: user.uid,
      });
    }

    handleCloseModal();
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingId(id);
  };

  const handleCloseDeleteDialog = () => {
    setDeletingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    await deleteMutation.mutateAsync(deletingId);
    handleCloseDeleteDialog();
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-100 pb-10">
      <Header />
      <main className="w-full max-w-4xl px-4 mt-10 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Button
            variant="text"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
          >
            Voltar
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
          >
            Nova Conexão
          </Button>
        </div>

        <TableContainer
          component={Paper}
          className="shadow-sm rounded-lg overflow-hidden"
        >
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell className="font-semibold text-gray-700">
                  Nome da Conexão
                </TableCell>
                <TableCell
                  align="center"
                  className="font-semibold text-gray-700"
                >
                  Contatos
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" className="py-8">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    align="center"
                    className="py-6 text-red-500"
                  >
                    Erro ao carregar conexões.
                  </TableCell>
                </TableRow>
              ) : connections.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    align="center"
                    className="py-8 text-gray-500"
                  >
                    Nenhuma conexão cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                connections.map((conn) => (
                  <TableRow key={conn.id} hover>
                    <TableCell className="font-medium text-gray-800">
                      {conn.name}
                    </TableCell>

                    <TableCell align="center">
                      <Link
                        to={`/connections/${conn.id}/contacts`}
                        className="relative group relative inline-flex items-center justify-center gap-1 hover:text-indigo-600 font-medium text-gray-700 no-underline"
                      >
                        <span>
                          {conn.contacts && conn.contacts > 0
                            ? `${conn.contacts}`
                            : "Sem contatos"}
                        </span>
                        <ArrowForwardIcon
                          fontSize="small"
                          className="absolute ml-[calc(100%+30px)] opacity-0 group-hover:opacity-70"
                        />
                      </Link>
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip title="Enviar Broadcast">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() =>
                              navigate(`/connections/${conn.id}/messages`)
                            }
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Editar Conexão">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() =>
                              handleOpenEditModal(conn.id, conn.name)
                            }
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Excluir Conexão">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(conn.id)}
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
          {!isLoading &&
            !isError &&
            connections.length > 0 &&
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
            {editingId ? "Editar Conexão" : "Nova Conexão"}
          </DialogTitle>

          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nome da Conexão"
              placeholder="Ex: Suporte WhatsApp, Vendas..."
              type="text"
              fullWidth
              variant="outlined"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
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
                !nameInput.trim()
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : editingId
                  ? "Salvar"
                  : "Criar"}
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
        <DialogTitle>Excluir Conexão?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza de que deseja excluir esta conexão? Esta ação também
            excluirá todos os contatos associados a ela.
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

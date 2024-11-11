import express from "express";
import {
  getTasks,
  createTask,
  updateTaskData,
  deleteTask,
  getTaskCount,
  searchTasks,
  updateTaskOrder,
} from "../controllers/tasks.js";

const router = express.Router();

// Rota para obter todas as tarefas
router.get("/", getTasks);

// Rota para criar uma nova tarefa
router.post("/", createTask);

// Rota para atualizar os dados de uma tarefa
router.put("/:id", updateTaskData);

// Rota para atualizar a ordem de uma tarefa
router.put("/:id/order", updateTaskOrder);

// Rota para deletar uma tarefa
router.delete("/:id", deleteTask);

// Rota para pesquisar tarefas
router.get("/search", searchTasks);

// Rota para obter o número total de tarefas cadastradas
router.get("/count", getTaskCount);

export default router;

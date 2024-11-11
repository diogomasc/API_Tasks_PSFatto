import express from "express";
import taskRoutes from "../routes/tasks.js";

const router = express.Router();

// Importa todas as rotas de tasks
router.use("/", taskRoutes);

export default router;

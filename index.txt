import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/tasks", taskRoutes);

// Tratamento de erro para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (error) => {
  console.error("Erro não tratado:", error);
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;

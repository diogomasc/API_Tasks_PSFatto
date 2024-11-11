import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks.js";
import { PrismaClient } from "@prisma/client";

// Configurações do app
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/", taskRoutes);

// Tratamento de erro para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

// Teste inicial do Prisma
async function testarConexao() {
  try {
    const novaTarefa = await prisma.task.create({
      data: {
        displayOrder: 1,
        description: "Primeira tarefa de teste",
        value: 150.0,
        deadline: new Date("2024-12-31"),
      },
    });
    console.log("Tarefa criada com sucesso:", novaTarefa);
  } catch (erro) {
    console.error("Erro ao criar tarefa:", erro);
  } finally {
    await prisma.$disconnect();
  }
}

// Inicialização do servidor e teste do Prisma
app.listen(8800, () => {
  console.log("Servidor rodando em: http://localhost:8800");
  testarConexao();
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (error) => {
  console.error("Erro não tratado:", error);
  process.exit(1);
});

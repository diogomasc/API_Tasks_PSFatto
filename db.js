import { Client } from "pg";

// Cria uma nova instância do cliente PostgreSQL utilizando variáveis de ambiente
const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Necessário para conexões seguras
  },
});

// Conecta ao banco de dados e trata possíveis erros
client.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    process.exit(1);
  } else {
    console.log("Conectado ao banco de dados PostgreSQL com sucesso!");
  }
});

// Tratamento de erro para perda de conexão
client.on("error", (err) => {
  console.error("Erro na conexão com o banco de dados:", err);
  if (err.code === "ECONNRESET" || err.code === "EHOSTUNREACH") {
    console.error(
      "Conexão com o banco de dados foi perdida. Tentando reconectar..."
    );
    // Tente reconectar após um intervalo
    setTimeout(() => {
      client
        .connect()
        .catch((error) => console.error("Falha na reconexão:", error));
    }, 5000);
  } else {
    throw err;
  }
});

export default client;

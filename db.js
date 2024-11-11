import mysql from "mysql";

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "0103",
  database: "crud_tasks",
  port: 3308,
});

// Estabelece a conexão e trata possíveis erros
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Conexão com o banco de dados foi perdida");
    } else if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("O banco de dados tem muitas conexões");
    } else if (err.code === "ECONNREFUSED") {
      console.error("Conexão com o banco de dados foi recusada");
    }
    return;
  }
  console.log("Conectado ao banco de dados MySQL com sucesso!");
});

// Tratamento de erro para perda de conexão
db.on("error", (err) => {
  console.error("Erro na conexão com o banco de dados:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error(
      "Conexão perdida com o banco de dados. Tentando reconectar..."
    );

    // Função para tentar reconexão
    const tryReconnect = () => {
      db.connect((err) => {
        if (err) {
          console.error("Tentativa de reconexão falhou:", err);
          // Tenta reconectar novamente após 5 segundos
          setTimeout(tryReconnect, 5000);
        } else {
          console.log("Reconexão bem-sucedida!");
        }
      });
    };

    // Inicia a tentativa de reconexão
    tryReconnect();
  } else {
    throw err;
  }
});

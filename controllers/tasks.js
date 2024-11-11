import { db } from "../db.js";

// Função para recuperar todas as tarefas ordenadas por display_order
export const getTasks = async (_, res) => {
  try {
    const query = "SELECT * FROM tasks ORDER BY display_order ASC";

    const data = await new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao recuperar tarefas:", error);
    return res.status(500).json({
      message: "Erro ao recuperar tarefas.",
      error: error.message,
    });
  }
};

export const createTask = async (req, res) => {
  try {
    const { description, value, deadline } = req.body;

    // Obtém o próximo valor de display_order
    const [orderResult] = await new Promise((resolve, reject) => {
      db.query(
        "SELECT COALESCE(MAX(display_order), 0) + 1 AS nextOrder FROM tasks",
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    const nextOrder = orderResult.nextOrder;

    // Insere a nova tarefa
    const result = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO tasks (description, value, deadline, display_order) VALUES (?, ?, ?, ?)",
        [description, value, deadline, nextOrder],
        (err, data) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    });

    console.log("Tarefa criada com sucesso:", result.insertId);
    return res.status(201).json({
      message: "Tarefa criada com sucesso",
      taskId: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    return res.status(500).json({
      message: "Erro ao criar tarefa",
      error: error.message,
    });
  }
};

// Função para atualizar uma tarefa existente
export const updateTaskData = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, value, deadline } = req.body;

    // Consulta para atualizar apenas os dados, sem o display_order
    const result = await new Promise((resolve, reject) => {
      const query = `
        UPDATE tasks 
        SET description = ?, value = ?, deadline = ? 
        WHERE id = ?
      `;

      db.query(query, [description, value, deadline, id], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      console.log("Tarefa não encontrada para o ID:", id);
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    console.log("Tarefa atualizada com sucesso:", id);
    return res.status(200).json({ message: "Tarefa atualizada com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return res.status(500).json({
      message: "Erro ao atualizar tarefa.",
      error: error.message,
    });
  }
};

// Função para deletar uma tarefa
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM tasks WHERE id = ?";

    const result = await new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      console.log("Tarefa não encontrada para o ID:", id);
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    console.log("Tarefa deletada com sucesso:", id);
    return res.status(200).json({ message: "Tarefa deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    return res.status(500).json({
      message: "Erro ao deletar tarefa.",
      error: error.message,
    });
  }
};

// Função para obter o número total de tarefas
export const getTaskCount = async (_, res) => {
  try {
    const query = "SELECT COUNT(*) AS count FROM tasks";

    const data = await new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    return res.status(200).json(data[0]);
  } catch (error) {
    console.error("Erro ao contar tarefas:", error);
    return res.status(500).json({
      message: "Erro ao contar tarefas.",
      error: error.message,
    });
  }
};

// Função para pesquisar tarefas
export const searchTasks = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      console.log("Termo de busca vazio.");
      return res.status(400).json({
        message: "Termo de busca não pode estar vazio.",
      });
    }

    const searchQuery = "SELECT * FROM tasks WHERE description LIKE ?";
    const results = await new Promise((resolve, reject) => {
      db.query(searchQuery, [`%${searchTerm}%`], (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return res.status(500).json({
      message: "Erro ao buscar tarefas.",
      error: error.message,
    });
  }
};

// Função para alterar a ordem de uma tarefa
export const updateTaskOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body;

    // Verifica se a tarefa existe e obtém sua ordem atual
    const checkTaskQuery = "SELECT display_order FROM tasks WHERE id = ?";
    const [task] = await new Promise((resolve, reject) => {
      db.query(checkTaskQuery, [id], (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const currentOrder = task.display_order;

    if (currentOrder === newOrder) {
      return res.status(200).json({ message: "Ordem não alterada" });
    }

    // Verifica se a nova ordem é válida
    const [countResult] = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as total FROM tasks", (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });

    const totalTasks = countResult.total;
    if (newOrder < 1 || newOrder > totalTasks) {
      return res.status(400).json({
        message: "Nova ordem inválida",
        valid_range: { min: 1, max: totalTasks },
      });
    }

    // Obtém tarefas afetadas pela reordenação
    const getAffectedTasksQuery = `
      SELECT id, display_order 
      FROM tasks 
      WHERE display_order BETWEEN LEAST(?, ?) AND GREATEST(?, ?)
      ORDER BY display_order ${currentOrder > newOrder ? "DESC" : "ASC"}
    `;

    const affectedTasks = await new Promise((resolve, reject) => {
      db.query(
        getAffectedTasksQuery,
        [currentOrder, newOrder, currentOrder, newOrder],
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });

    // Atualiza temporariamente a tarefa movida
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE tasks SET display_order = ? WHERE id = ?",
        [totalTasks + 1, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    // Atualiza a ordem das tarefas afetadas
    await Promise.all(
      affectedTasks.map((task) => {
        if (task.id === parseInt(id)) return Promise.resolve();

        const newPosition =
          currentOrder < newOrder
            ? task.display_order - 1
            : task.display_order + 1;

        return new Promise((resolve, reject) => {
          db.query(
            "UPDATE tasks SET display_order = ? WHERE id = ?",
            [newPosition, task.id],
            (err) => {
              if (err) reject(err);
              resolve();
            }
          );
        });
      })
    );

    // Move a tarefa para posição final
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE tasks SET display_order = ? WHERE id = ?",
        [newOrder, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    return res.status(200).json({
      message: "Ordem atualizada com sucesso",
      task: {
        id,
        new_order: newOrder,
        previous_order: currentOrder,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar ordem da tarefa:", error);
    return res.status(500).json({
      message: "Erro ao atualizar ordem da tarefa",
      error: error.message,
    });
  }
};

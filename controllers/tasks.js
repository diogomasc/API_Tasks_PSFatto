import client from "../db.js";

// Função para recuperar todas as tarefas ordenadas por display_order
export const getTasks = async (_, res) => {
  try {
    const query = "SELECT * FROM tasks ORDER BY display_order ASC";
    const { rows } = await client.query(query);
    return res.status(200).json(rows);
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
    const orderResult = await client.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 AS nextOrder FROM tasks"
    );
    const nextOrder = orderResult.rows[0].nextorder;

    // Insere a nova tarefa
    const result = await client.query(
      "INSERT INTO tasks (description, value, deadline, display_order) VALUES ($1, $2, $3, $4) RETURNING id",
      [description, value, deadline, nextOrder]
    );

    console.log("Tarefa criada com sucesso:", result.rows[0].id);
    return res.status(201).json({
      message: "Tarefa criada com sucesso",
      taskId: result.rows[0].id,
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

    const query = `
      UPDATE tasks 
      SET description = $1, value = $2, deadline = $3 
      WHERE id = $4
    `;

    const result = await client.query(query, [
      description,
      value,
      deadline,
      id,
    ]);

    if (result.rowCount === 0) {
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
    const query = "DELETE FROM tasks WHERE id = $1";

    const result = await client.query(query, [id]);

    if (result.rowCount === 0) {
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
    const { rows } = await client.query(query);
    return res.status(200).json(rows[0]);
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

    const searchQuery = "SELECT * FROM tasks WHERE description ILIKE $1";
    const { rows } = await client.query(searchQuery, [`%${searchTerm}%`]);

    return res.status(200).json(rows);
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
    const checkTaskQuery = "SELECT display_order FROM tasks WHERE id = $1";
    const taskResult = await client.query(checkTaskQuery, [id]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const currentOrder = taskResult.rows[0].display_order;

    if (currentOrder === newOrder) {
      return res.status(200).json({ message: "Ordem não alterada" });
    }

    // Verifica se a nova ordem é válida
    const countResult = await client.query(
      "SELECT COUNT(*) as total FROM tasks"
    );
    const totalTasks = parseInt(countResult.rows[0].total);

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
      WHERE display_order BETWEEN LEAST($1, $2) AND GREATEST($1, $2)
      ORDER BY display_order ${currentOrder > newOrder ? "DESC" : "ASC"}
    `;

    const affectedTasks = await client.query(getAffectedTasksQuery, [
      currentOrder,
      newOrder,
    ]);

    // Atualiza temporariamente a tarefa movida
    await client.query("UPDATE tasks SET display_order = $1 WHERE id = $2", [
      totalTasks + 1,
      id,
    ]);

    // Atualiza a ordem das tarefas afetadas
    for (const task of affectedTasks.rows) {
      if (task.id === parseInt(id)) continue;

      const newPosition =
        currentOrder < newOrder
          ? task.display_order - 1
          : task.display_order + 1;

      await client.query("UPDATE tasks SET display_order = $1 WHERE id = $2", [
        newPosition,
        task.id,
      ]);
    }

    // Move a tarefa para posição final
    await client.query("UPDATE tasks SET display_order = $1 WHERE id = $2", [
      newOrder,
      id,
    ]);

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

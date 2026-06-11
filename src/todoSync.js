import { useEffect, useState } from 'react';
import { createMockTasks } from './data/mockTasks';

export const TODOS_STORAGE_KEY = 'intoday_ui_prototype_tasks';

const readLocalTodos = (normalizeTodo) => {
  try {
    const raw = localStorage.getItem(TODOS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : createMockTasks();
    return Array.isArray(parsed) ? parsed.map(normalizeTodo) : createMockTasks().map(normalizeTodo);
  } catch {
    return createMockTasks().map(normalizeTodo);
  }
};

const writeLocalTodos = (todos) => {
  try {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Keep the prototype usable even if storage is unavailable.
  }
};

export const useSyncedTodos = ({ normalizeTodo }) => {
  const [todos, setTodosState] = useState(() => readLocalTodos(normalizeTodo));

  useEffect(() => {
    writeLocalTodos(todos.map(normalizeTodo));
  }, [normalizeTodo, todos]);

  return [todos, setTodosState];
};

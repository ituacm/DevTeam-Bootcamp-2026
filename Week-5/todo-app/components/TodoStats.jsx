function TodoStats({ todos }) {
  const remaining = todos.filter((todo) => !todo.completed).length;
  return (
    <p className="text-xs text-slate-400">
      {remaining} tasks of {todos.length} are waiting
    </p>
  );
}

export default TodoStats;

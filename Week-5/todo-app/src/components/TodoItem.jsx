function TodoItem({ todo, onToggle, onDelete }) {
  /*function handleToggle() {
    todo.completed = !todo.completed;
    console.log(todo);
  }*/

  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      ></input>
      <span>{todo.title}</span>
      <button
        className="ml-auto px-1 text-lg leading-none text-slate-400 hover:text-red-600"
        onClick={() => onDelete(todo.id)}
      >
        &#x2613;
      </button>
    </li>
  );
}

export default TodoItem;

import { useState } from "react";

function AddTodoForm({ onAdd }) {
  const [todoTitle, setTodoTitle] = useState("");

  function handleSubmit() {
    event.preventDefault();
    onAdd(todoTitle);
    setTodoTitle("");
  }

  return (
    <form className="gap-2 flex" onSubmit={handleSubmit}>
      <input
        className="flex-1 rounded-lg border border-b-slate-300 px-3 py-2 text-sm"
        value={todoTitle}
        onChange={(event) => setTodoTitle(event.target.value)}
      ></input>
      <button className="rounded-lg bg-slate-900 text-white font-medium px-4 py-2 text-sm">
        Add
      </button>
    </form>
  );
}

export default AddTodoForm;

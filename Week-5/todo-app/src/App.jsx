import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import TodoList from "./components/TodoList";
import AddTodoForm from "./components/AddTodoForm";
import TodoStats from "./components/TodoStats";

function App() {
  /*const todoList = [
    { id: 1, title: "Ders içeriklerini incele.", completed: true },
    { id: 2, title: "Ders seçimlerini yap.", completed: false },
    { id: 3, title: "Ders programını ayarla.", completed: false },
  ];*/

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/todos?_limit=8")
      .then((response) => response.json())
      //.then((json) => console.log(json));
      .then((data) => setTodos(data.map((item) => ({ ...item }))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function onToggle(todoId) {
    setTodos(
      todos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function onAdd(todoTitle) {
    setTodos([
      { id: todos.length + 1, title: todoTitle, completed: false },
      ...todos,
    ]);
  }

  function onDelete(todoId) {
    setTodos(todos.filter((todo) => todo.id !== todoId));
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto w-full max-w-md px-4">
        <Header />
        <div className="bg-white rounded-xl shadow-sm space-y-4 p-5">
          <AddTodoForm onAdd={onAdd} />
          {error && (
            <p className="text-red-500">
              There is an error while fetching your data.
            </p>
          )}
          {loading && <p className="text-slate-700">Loading...</p>}
          {!loading && !error && (
            <TodoList todos={todos} onToggle={onToggle} onDelete={onDelete} />
          )}
          <TodoStats todos={todos} />
        </div>
      </div>
    </div>
  );
}

export default App;

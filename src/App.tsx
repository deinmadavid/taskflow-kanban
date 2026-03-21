import { useEffect, useMemo, useState } from "react";
import "./kanban.css";

type ColumnId = "backlog" | "active" | "review" | "done";

type Task = {
  id: string;
  title: string;
  summary: string;
  assignee: string;
  priority: "Low" | "Medium" | "High";
  sprint: string;
  column: ColumnId;
};

const columns: { id: ColumnId; label: string; hint: string }[] = [
  { id: "backlog", label: "Backlog", hint: "Needs scope" },
  { id: "active", label: "In Progress", hint: "Currently building" },
  { id: "review", label: "Review", hint: "Waiting for feedback" },
  { id: "done", label: "Done", hint: "Shipped or verified" },
];

const seedTasks: Task[] = [
  {
    id: "t-1",
    title: "Refresh onboarding walkthrough",
    summary: "Tighten copy and remove blockers from the first-run experience.",
    assignee: "Ada",
    priority: "High",
    sprint: "Sprint 12",
    column: "active",
  },
  {
    id: "t-2",
    title: "Prepare metrics export",
    summary: "Create a downloadable report for weekly delivery review.",
    assignee: "Kore",
    priority: "Medium",
    sprint: "Sprint 12",
    column: "review",
  },
  {
    id: "t-3",
    title: "Document rollback checklist",
    summary: "Add deployment rollback steps for the release playbook.",
    assignee: "Deinma",
    priority: "Low",
    sprint: "Sprint 11",
    column: "done",
  },
];

const storageKey = "taskflow-kanban-board";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as Task[]) : seedTasks;
  });
  const [draft, setDraft] = useState({
    title: "",
    summary: "",
    assignee: "Deinma",
    priority: "Medium" as Task["priority"],
    sprint: "Sprint 13",
    column: "backlog" as ColumnId,
  });
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"All" | Task["priority"]>("All");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        search.trim() === "" ||
        `${task.title} ${task.summary} ${task.assignee}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [priorityFilter, search, tasks]);

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim() || !draft.summary.trim()) {
      return;
    }

    setTasks((current) => [
      {
        id: `task-${crypto.randomUUID()}`,
        ...draft,
        title: draft.title.trim(),
        summary: draft.summary.trim(),
      },
      ...current,
    ]);

    setDraft((current) => ({
      ...current,
      title: "",
      summary: "",
      column: "backlog",
    }));
  }

  function moveTask(taskId: string, nextColumn: ColumnId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, column: nextColumn } : task,
      ),
    );
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => task.column !== "done"));
  }

  return (
    <main className="kanban-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Taskflow Kanban</p>
          <h1>Run delivery in clear, visible handoff lanes.</h1>
          <p className="description">
            Track sprint work, capture ownership, and keep the board readable
            for standups, review, and release prep.
          </p>
        </div>
        <div className="hero-metrics">
          <article>
            <strong>{tasks.length}</strong>
            <span>Open tasks</span>
          </article>
          <article>
            <strong>{tasks.filter((task) => task.priority === "High").length}</strong>
            <span>High priority</span>
          </article>
        </div>
      </section>

      <section className="composer-card">
        <div className="section-header">
          <h2>Add a task</h2>
          <button type="button" className="ghost-button" onClick={clearCompleted}>
            Clear done
          </button>
        </div>
        <form className="task-form" onSubmit={addTask}>
          <input
            placeholder="Task title"
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
          />
          <textarea
            placeholder="Task summary"
            value={draft.summary}
            onChange={(event) =>
              setDraft((current) => ({ ...current, summary: event.target.value }))
            }
          />
          <div className="form-row">
            <input
              placeholder="Assignee"
              value={draft.assignee}
              onChange={(event) =>
                setDraft((current) => ({ ...current, assignee: event.target.value }))
              }
            />
            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priority: event.target.value as Task["priority"],
                }))
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select
              value={draft.column}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  column: event.target.value as ColumnId,
                }))
              }
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Create task</button>
        </form>
      </section>

      <section className="filters-card">
        <input
          placeholder="Search by title, summary, or assignee"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as "All" | Task["priority"])
          }
        >
          <option value="All">All priorities</option>
          <option value="Low">Low priority</option>
          <option value="Medium">Medium priority</option>
          <option value="High">High priority</option>
        </select>
      </section>

      <section className="board-grid">
        {columns.map((column) => (
          <article
            key={column.id}
            className="board-column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedTaskId) {
                moveTask(draggedTaskId, column.id);
              }
              setDraggedTaskId(null);
            }}
          >
            <header>
              <div>
                <h2>{column.label}</h2>
                <p>{column.hint}</p>
              </div>
              <span>
                {filteredTasks.filter((task) => task.column === column.id).length}
              </span>
            </header>

            <div className="task-stack">
              {filteredTasks
                .filter((task) => task.column === column.id)
                .map((task) => (
                  <div
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                  >
                    <div className="task-meta">
                      <span className={`priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span>{task.sprint}</span>
                    </div>
                    <h3>{task.title}</h3>
                    <p>{task.summary}</p>
                    <footer>
                      <span>{task.assignee}</span>
                      <div className="task-actions">
                        {columns
                          .filter((candidate) => candidate.id !== task.column)
                          .slice(0, 2)
                          .map((candidate) => (
                            <button
                              key={candidate.id}
                              type="button"
                              className="ghost-button"
                              onClick={() => moveTask(task.id, candidate.id)}
                            >
                              {candidate.label}
                            </button>
                          ))}
                      </div>
                    </footer>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

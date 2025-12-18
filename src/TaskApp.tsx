// src/TaskApp.tsx
import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import Sidebar from "./Sidebar";
import { useAuthFetch } from "./hooks/useAuthFetch";


const API = "http://localhost:8000/api"; 

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked" | "archived";

export type TaskRow = {
  id: number;
  title: string;
  status: TaskStatus;
  priority: Priority;
  created_at?: number;
};

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "blocked", "archived"];
const PRIOS: Priority[] = ["low", "medium", "high"];

export default function TaskApp() {
  const authFetch = useAuthFetch();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");
  const [draftStatus, setDraftStatus] = useState<TaskStatus>("todo");
  const [editId, setEditId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [q, setQ] = useState("");
  const [isNewOpen, setNewOpen] = useState(false);

  
  const reload = async () => {
    try {
      const url = q ? API + "/tasks?q=" + encodeURIComponent(q) : API + "/tasks";
      const res = await authFetch(url);
      if (res.ok) {
        const data: TaskRow[] = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Yükleme hatası:", err);
    }
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) reload();
  }, [q]);

  
  const visible = useMemo(() => {
    return filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const base = { total: tasks.length, byStatus: { todo: 0, in_progress: 0, done: 0, blocked: 0, archived: 0 } };
    tasks.forEach(t => base.byStatus[t.status as TaskStatus]++);
    return base;
  }, [tasks]);

  
  const apiAdd = async (title: string, priority: Priority, status: TaskStatus) => {
    try {
      const res = await authFetch(API + "/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, status })
      });
      if (res.ok) await reload();
    } catch (err) {
      console.error("İstek hatası:", err);
    }
  };

  const apiUpdate = async (id: number, patch: Partial<TaskRow>) => {
    await authFetch(API + "/tasks/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    await reload();
  };

  const apiDelete = async (id: number) => {
  try {
    const res = await authFetch(API + "/tasks/" + id, { 
      method: "DELETE" 
    });
    
    if (res.ok) {
      console.log("🗑️ Görev silindi, liste yenileniyor...");
      await reload(); 
    }
  } catch (err) {
    console.error("Silme işlemi başarısız:", err);
  }
};

  const addFromModal = async () => {
    const title = draftTitle.trim();
    if (!title) return;
    await apiAdd(title, draftPriority, draftStatus);
    setDraftTitle(""); setDraftPriority("medium"); setDraftStatus("todo"); setNewOpen(false);
  };

  const filteredVisible = visible.filter(t =>
    !q || t.title.toLowerCase().includes(q.toLowerCase())
  );

  const editing: TaskRow | null = editId !== null
    ? tasks.find(t => t.id === editId) || null
    : null;

  const saveEdit = async (fields: Partial<{ title: string; priority: Priority; status: TaskStatus }>) => {
    if (!editing) return;
    await apiUpdate(editing.id, fields);
    setEditId(null);
  };

  
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar
        active={filter}
        counts={counts}
        onPick={setFilter}
        onNew={() => setNewOpen(true)}
        onClearDone={async () => {
          const done = tasks.filter(t => t.status === "done");
          await Promise.all(done.map(t => apiDelete(t.id)));
          reload();
        }}
      />

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 24px", flex: 1 }}>
        <h2 style={{ margin: 0 }}>Task Manager</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Search tasks…" style={{ padding: 8, flex: 1 }} />
          <button onClick={() => setNewOpen(true)}>＋ New</button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {filteredVisible.map((t) => (
            <li key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px repeat(5, max-content)", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <button onClick={() => setEditId(t.id)} style={{ textAlign: "left", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                <span style={{ textDecoration: t.status === "archived" ? "line-through" : "none" }}>{t.title}</span>
              </button>

              <select value={t.status} onChange={(e) => apiUpdate(t.id, { status: e.target.value as TaskStatus })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select value={t.priority} onChange={(e) => apiUpdate(t.id, { priority: e.target.value as Priority })}>
                {PRIOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <button onClick={() => setEditId(t.id)}>✎</button>
              <button onClick={() => apiDelete(t.id)}>✕</button>
            </li>
          ))}
        </ul>
      </main>

      <Modal open={isNewOpen} onClose={() => setNewOpen(false)} title="New Task"
        footer={
          <>
            <button onClick={() => setNewOpen(false)}>Cancel</button>
            <button onClick={addFromModal}>Create</button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 10 }}>
          <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Task title" style={{ padding: 8 }} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label>Priority{" "}
              <select value={draftPriority} onChange={e => setDraftPriority(e.target.value as Priority)}>
                {PRIOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label>Status{" "}
              <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as TaskStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={!!editing} onClose={() => setEditId(null)} title="Edit Task">
        {editing && (
          <div style={{ display: "grid", gap: 10 }}>
            <input id="edit-title" defaultValue={editing.title} style={{ padding: 8 }} />
            <button onClick={() => {
              const title = (document.getElementById("edit-title") as HTMLInputElement).value;
              saveEdit({ title });
            }}>Save</button>
          </div>
        )}
      </Modal>
    </div>
  );
}


import React, { useEffect, useState } from 'react';

const DEFAULT_TASKS = [
  { id: 'signup', label: 'Create your account', required: true },
  { id: 'profile', label: 'Complete your profile (set diabetes type, height, weight)', required: false },
  { id: 'reading', label: 'Log your first glucose reading', required: false },
  { id: 'medication', label: 'Add a medication and mark one as taken', required: false },
  { id: 'bmi', label: 'View your BMI on the dashboard', required: false },
];

export default function ToDoList() {
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem('todo_tasks');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_TASKS.map(t => ({ ...t, done: false }));
  });

  useEffect(() => {
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  function toggle(id) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function reset() {
    setTasks(DEFAULT_TASKS.map(t => ({ ...t, done: false })));
  }

  const completed = tasks.filter(t => t.done).length;

  return (
    <div>
      <div className="space-between">
        <h3 style={{ margin: 0 }}>Getting Started Checklist</h3>
        <small className="small">{completed}/{tasks.length} completed</small>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 8, display: 'grid', gap: 6 }}>
        {tasks.map(t => (
          <li key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <input
                id={`task-${t.id}`}
                type="checkbox"
                checked={!!t.done}
                onChange={() => toggle(t.id)}
              />
              <label htmlFor={`task-${t.id}`} style={{ cursor: 'pointer' }}>
                {t.label} {t.required ? <span className="pill bad">required</span> : null}
              </label>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={reset} className="btn ghost">Reset</button>
    </div>
  );
} 
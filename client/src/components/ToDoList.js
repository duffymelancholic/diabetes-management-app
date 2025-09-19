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
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Getting Started Checklist</h3>
        <small>{completed}/{tasks.length} completed</small>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 8, display: 'grid', gap: 6 }}>
        {tasks.map(t => (
          <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id={`task-${t.id}`}
              type="checkbox"
              checked={!!t.done}
              onChange={() => toggle(t.id)}
            />
            <label htmlFor={`task-${t.id}`} style={{ cursor: 'pointer' }}>
              {t.label} {t.required ? <span style={{ color: 'crimson' }}>(required)</span> : null}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={reset}>Reset</button>
    </div>
  );
} 
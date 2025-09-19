import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ReadingSchema = Yup.object({
  value: Yup.number().min(40).max(500).required('Required'),
  date: Yup.string().required('Required'), // simple check; browser date input helps
  time: Yup.string().required('Required'), // browser time input helps
  context: Yup.string().oneOf(['', 'pre_meal', 'post_meal']),
  notes: Yup.string(),
});

function evaluateGlucose(value, context) {
  if (context === 'pre_meal') {
    if (value < 80) return { status: 'low', color: 'goldenrod' };
    if (value <= 130) return { status: 'normal', color: 'green' };
    return { status: 'high', color: 'crimson' };
  }
  // post_meal or unknown
  if (value < 180) return { status: 'normal', color: 'green' };
  return { status: 'high', color: 'crimson' };
}

export default function Readings() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function fetchReadings() {
    try {
      const res = await fetch('/readings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { fetchReadings(); }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading?')) return;
    try {
      const res = await fetch(`/readings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 204) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      setItems(items.filter(r => r.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleCreate(values, { setSubmitting, resetForm, setStatus }) {
    setStatus(null);
    try {
      const res = await fetch('/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setItems(prev => [...prev, data]);
      resetForm();
    } catch (e) {
      setStatus(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Readings</h2>
        <Formik
          initialValues={{ value: '', date: '', time: '', context: '', notes: '' }}
          validationSchema={ReadingSchema}
          onSubmit={handleCreate}
        >
          {({ isSubmitting, status }) => (
            <Form className="form" style={{ marginBottom: 8 }}>
              <label className="label">Value (mg/dL)</label>
              <Field name="value" type="number" step="1" className="input" />
              <div className="error"><ErrorMessage name="value" /></div>

              <label className="label">Date</label>
              <Field name="date" type="date" className="input" />
              <div className="error"><ErrorMessage name="date" /></div>

              <label className="label">Time</label>
              <Field name="time" type="time" className="input" />
              <div className="error"><ErrorMessage name="time" /></div>

              <label className="label">Context (optional)</label>
              <Field as="select" name="context" className="input">
                <option value="">Select</option>
                <option value="pre_meal">Pre-meal</option>
                <option value="post_meal">Post-meal</option>
              </Field>
              <div className="error"><ErrorMessage name="context" /></div>

              <label className="label">Notes (optional)</label>
              <Field name="notes" as="textarea" rows={2} className="input" />

              {status && <div className="error">{status}</div>}
              <div className="row">
                <button type="submit" disabled={isSubmitting} className="btn">Add Reading</button>
              </div>
            </Form>
          )}
        </Formik>

        {error && <div className="error">{error}</div>}
      </div>

      <ul className="list-grid">
        {items.map(r => {
          const { status, color } = evaluateGlucose(r.value, r.context);
          return (
            <li key={r.id} className="item" style={{ borderLeftColor: color }}>
              <div className="space-between">
                <div><strong>{r.date}</strong> {r.time?.slice(0,5)} — {r.context || 'n/a'}</div>
                <span className={status === 'normal' ? 'pill ok' : status === 'low' ? 'pill warn' : 'pill bad'}>{status}</span>
              </div>
              <div>Value: <strong style={{ color }}>{r.value}</strong></div>
              {r.notes && <div className="small">Notes: {r.notes}</div>}
              <div className="row" style={{ marginTop: 8 }}>
                <button onClick={() => handleDelete(r.id)} className="btn ghost">Delete</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

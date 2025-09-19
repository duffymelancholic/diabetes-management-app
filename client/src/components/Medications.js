import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const MedSchema = Yup.object({
  name: Yup.string().required('Required'),
  dose: Yup.string().required('Required'),
  time: Yup.string().required('Required'), // HH:MM
  status: Yup.string().oneOf(['pending', 'taken', 'missed']).optional(),
});

export default function Medications() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/medications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(values, { setSubmitting, resetForm, setStatus }) {
    setStatus(null);
    try {
      const res = await fetch('/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/medications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setItems(prev => prev.map(m => (m.id === id ? data : m)));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Medications</h2>

        <Formik
          initialValues={{ name: '', dose: '', time: '', status: 'pending' }}
          validationSchema={MedSchema}
          onSubmit={create}
        >
          {({ isSubmitting, status }) => (
            <Form className="form" style={{ marginBottom: 8 }}>
              <label className="label">Name</label>
              <Field name="name" className="input" />
              <div className="error"><ErrorMessage name="name" /></div>

              <label className="label">Dose</label>
              <Field name="dose" className="input" />
              <div className="error"><ErrorMessage name="dose" /></div>

              <label className="label">Time</label>
              <Field name="time" type="time" className="input" />
              <div className="error"><ErrorMessage name="time" /></div>

              <label className="label">Status</label>
              <Field as="select" name="status" className="input">
                <option value="pending">Pending</option>
                <option value="taken">Taken</option>
                <option value="missed">Missed</option>
              </Field>

              {status && <div className="error">{status}</div>}
              <div className="row">
                <button type="submit" disabled={isSubmitting} className="btn">Add Medication</button>
              </div>
            </Form>
          )}
        </Formik>

        {error && <div className="error">{error}</div>}
      </div>

      <ul className="list-grid">
        {items.map(m => (
          <li key={m.id} className="item">
            <div className="space-between">
              <div><strong>{m.name}</strong> — {m.dose}</div>
              <span className={m.status === 'taken' ? 'pill ok' : m.status === 'missed' ? 'pill bad' : 'pill warn'}>{m.status}</span>
            </div>
            <div className="small">Time: {m.time?.slice(0,5)}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={() => updateStatus(m.id, 'taken')} className="btn secondary">Mark Taken</button>
              <button onClick={() => updateStatus(m.id, 'missed')} className="btn ghost">Mark Missed</button>
              <button onClick={() => updateStatus(m.id, 'pending')} className="btn ghost">Reset</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

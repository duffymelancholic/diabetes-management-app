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
    <div>
      <h2>Medications</h2>

      <Formik
        initialValues={{ name: '', dose: '', time: '', status: 'pending' }}
        validationSchema={MedSchema}
        onSubmit={create}
      >
        {({ isSubmitting, status }) => (
          <Form style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
            <label>Name</label>
            <Field name="name" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="name" /></div>

            <label>Dose</label>
            <Field name="dose" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="dose" /></div>

            <label>Time</label>
            <Field name="time" type="time" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="time" /></div>

            <label>Status</label>
            <Field as="select" name="status">
              <option value="pending">Pending</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
            </Field>

            {status && <div style={{ color: 'crimson' }}>{status}</div>}
            <button type="submit" disabled={isSubmitting}>Add Medication</button>
          </Form>
        )}
      </Formik>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {items.map(m => (
          <li key={m.id} style={{ border: '1px solid #eee', padding: 8 }}>
            <div><strong>{m.name}</strong> — {m.dose}</div>
            <div>Time: {m.time?.slice(0,5)} | Status: <strong>{m.status}</strong></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => updateStatus(m.id, 'taken')}>Mark Taken</button>
              <button onClick={() => updateStatus(m.id, 'missed')}>Mark Missed</button>
              <button onClick={() => updateStatus(m.id, 'pending')}>Reset</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

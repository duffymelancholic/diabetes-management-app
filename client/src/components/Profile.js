import React from 'react';
import { useAuth } from './AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const TYPES = [
  { value: '', label: 'Select (optional)' },
  { value: 'type1', label: 'Type 1' },
  { value: 'type2', label: 'Type 2' },
  { value: 'gestational', label: 'Gestational' },
  { value: 'prediabetes', label: 'Prediabetes' },
];

const ProfileSchema = Yup.object({
  diabetes_type: Yup.string().oneOf(['', 'type1', 'type2', 'gestational', 'prediabetes']),
  height_cm: Yup.number().nullable().min(50, 'Too short').max(250, 'Too tall'),
  weight_kg: Yup.number().nullable().min(20, 'Too low').max(400, 'Too high'),
});

export default function Profile() {
  const { token, user, setUser, setEducation } = useAuth();
  if (!user) return null;

  async function handleSubmit(values, { setSubmitting, setStatus }) {
    setStatus(null);
    try {
      const res = await fetch('/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diabetes_type: values.diabetes_type || null,
          height_cm: values.height_cm === '' ? null : values.height_cm,
          weight_kg: values.weight_kg === '' ? null : values.weight_kg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      const { education, ...userData } = data;
      setUser(userData);
      if (education) setEducation(education);
      setStatus('Saved!');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2>Profile</h2>
      <Formik
        initialValues={{
          diabetes_type: user.diabetes_type || '',
          height_cm: user.height_cm ?? '',
          weight_kg: user.weight_kg ?? '',
        }}
        validationSchema={ProfileSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, status }) => (
          <Form className="form">
            <label className="label">Diabetes Type</label>
            <Field as="select" name="diabetes_type" className="input">
              {TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Field>
            <div className="error"><ErrorMessage name="diabetes_type" /></div>

            <label className="label">Height (cm)</label>
            <Field name="height_cm" type="number" step="0.1" className="input" />
            <div className="error"><ErrorMessage name="height_cm" /></div>

            <label className="label">Weight (kg)</label>
            <Field name="weight_kg" type="number" step="0.1" className="input" />
            <div className="error"><ErrorMessage name="weight_kg" /></div>

            {status && (
              <div className={status === 'Saved!' ? 'status-ok' : 'error'}>{status}</div>
            )}
            <div className="row">
              <button type="submit" disabled={isSubmitting} className="btn">Save</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

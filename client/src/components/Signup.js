import React from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const SignupSchema = Yup.object({
  name: Yup.string().min(2, 'Too short').required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Required'),
  diabetes_type: Yup.string().oneOf(['', 'type1', 'type2', 'gestational', 'prediabetes'], 'Invalid'),
});

const TYPES = [
  { value: '', label: 'Select (optional)' },
  { value: 'type1', label: 'Type 1' },
  { value: 'type2', label: 'Type 2' },
  { value: 'gestational', label: 'Gestational' },
  { value: 'prediabetes', label: 'Prediabetes' },
];

export default function Signup() {
  const history = useHistory();
  const { setToken, setUser, setEducation } = useAuth();

  async function handleSubmit(values, { setSubmitting, setStatus }) {
    setStatus(null);
    try {
      const res = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setToken(data.access_token);
      setUser(data.user);
      setEducation(data.education || []);
      history.push('/dashboard');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Signup</h2>
      <Formik
        initialValues={{ name: '', email: '', password: '', diabetes_type: '' }}
        validationSchema={SignupSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form style={{ display: 'grid', gap: 8 }}>
            <label>Name</label>
            <Field name="name" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="name" /></div>

            <label>Email</label>
            <Field name="email" type="email" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="email" /></div>

            <label>Password</label>
            <Field name="password" type="password" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="password" /></div>

            <label>Diabetes Type (optional)</label>
            <Field as="select" name="diabetes_type">
              {TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Field>
            <div style={{ color: 'crimson' }}><ErrorMessage name="diabetes_type" /></div>

            {status && <div style={{ color: 'crimson' }}>{status}</div>}
            <button type="submit" disabled={isSubmitting}>Create Account</button>

            <div>
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

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
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2>Create your account</h2>
      <p className="small">Join and get personalized insights.</p>
      <Formik
        initialValues={{ name: '', email: '', password: '', diabetes_type: '' }}
        validationSchema={SignupSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form className="form">
            <label className="label">Name</label>
            <Field name="name" className="input" />
            <div className="error"><ErrorMessage name="name" /></div>

            <label className="label">Email</label>
            <Field name="email" type="email" className="input" />
            <div className="error"><ErrorMessage name="email" /></div>

            <label className="label">Password</label>
            <Field name="password" type="password" className="input" />
            <div className="error"><ErrorMessage name="password" /></div>

            <label className="label">Diabetes Type (optional)</label>
            <Field as="select" name="diabetes_type" className="input">
              {TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Field>
            <div className="error"><ErrorMessage name="diabetes_type" /></div>

            {status && <div className="error">{status}</div>}
            <div className="row">
              <button type="submit" disabled={isSubmitting} className="btn">Create Account</button>
              <Link to="/login" className="btn secondary" style={{ textDecoration: 'none' }}>Login</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

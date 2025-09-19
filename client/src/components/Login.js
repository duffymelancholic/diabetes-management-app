import React from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const LoginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Required'),
});

export default function Login() {
  const history = useHistory();
  const { setToken, setUser, setEducation } = useAuth();

  async function handleSubmit(values, { setSubmitting, setStatus }) {
    setStatus(null);
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
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
      <h2>Login</h2>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form style={{ display: 'grid', gap: 8 }}>
            <label>Email</label>
            <Field name="email" type="email" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="email" /></div>

            <label>Password</label>
            <Field name="password" type="password" />
            <div style={{ color: 'crimson' }}><ErrorMessage name="password" /></div>

            {status && <div style={{ color: 'crimson' }}>{status}</div>}
            <button type="submit" disabled={isSubmitting}>Login</button>

            <div>
              No account? <Link to="/signup">Create one</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

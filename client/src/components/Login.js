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
    <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2>Welcome back</h2>
      <p className="small">Sign in to track your readings and medications.</p>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form className="form">
            <label className="label">Email</label>
            <Field name="email" type="email" className="input" />
            <div className="error"><ErrorMessage name="email" /></div>

            <label className="label">Password</label>
            <Field name="password" type="password" className="input" />
            <div className="error"><ErrorMessage name="password" /></div>

            {status && <div className="error">{status}</div>}
            <div className="row">
              <button type="submit" disabled={isSubmitting} className="btn">Login</button>
              <Link to="/signup" className="btn secondary" style={{ textDecoration: 'none' }}>Create account</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { readError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState({ fields: {} });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/'); // intended destination preserved (FR-03)
    } catch (ex) {
      const r = readError(ex);
      if (r.code === 'ACCOUNT_NOT_VERIFIED') navigate('/verify', { state: { email: form.email } });
      setErr(r);
    }
  };
  return (
    <main className="page narrow">
      <h1>Sign in</h1>
      <form onSubmit={submit} noValidate>
        <Field id="email" label="E-mail" type="email" autoComplete="email" value={form.email} error={err.fields.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" value={form.password} error={err.fields.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {err.message && !Object.keys(err.fields).length && <p className="error" role="alert">{err.message}</p>}
        <button type="submit">Sign in</button>
      </form>
      <p><Link to="/forgot-password">Forgot password?</Link> · <Link to="/register">Create an account</Link></p>
    </main>
  );
}

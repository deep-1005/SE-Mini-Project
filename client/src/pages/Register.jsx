// FR-01: client-side checks mirror the server for responsiveness only; the server re-validates.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import api, { readError } from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'BUYER' });
  const [err, setErr] = useState({ fields: {} });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      navigate('/verify', { state: { email: form.email } });
    } catch (ex) {
      setErr(readError(ex));
    }
  };
  return (
    <main className="page narrow">
      <h1>Create an account</h1>
      <form onSubmit={submit} noValidate>
        <fieldset className="roles">
          <legend>I want to</legend>
          <label><input type="radio" name="role" value="BUYER" checked={form.role === 'BUYER'} onChange={set('role')} /> Buy books</label>
          <label><input type="radio" name="role" value="SELLER" checked={form.role === 'SELLER'} onChange={set('role')} /> Sell books</label>
        </fieldset>
        <Field id="name" label="Full name" value={form.name} onChange={set('name')} error={err.fields.name} autoComplete="name" />
        <Field id="email" label="E-mail" type="email" value={form.email} onChange={set('email')} error={err.fields.email} autoComplete="email" />
        <Field id="phone" label="Mobile number (10 digits)" inputMode="numeric" maxLength={10} value={form.phone} onChange={set('phone')} error={err.fields.phone} autoComplete="tel-national" />
        <Field id="password" label="Password" type="password" value={form.password} onChange={set('password')} error={err.fields.password} autoComplete="new-password" />
        <p className="hint">At least 8 characters with an upper-case letter, a lower-case letter, a digit and a symbol.</p>
        {err.message && !Object.keys(err.fields).length && <p className="error" role="alert">{err.message}</p>}
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}

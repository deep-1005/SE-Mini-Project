// FR-04: request and complete password reset.
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Field from '../components/Field';
import api, { readError } from '../api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/auth/forgot-password', { email }).catch((ex) => ({ data: { message: readError(ex).message } }));
    setDone(data.message);
  };
  return (
    <main className="page narrow">
      <h1>Reset your password</h1>
      {done ? <p role="status">{done}</p> : (
        <form onSubmit={submit}><Field id="email" label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><button type="submit">Send reset link</button></form>
      )}
    </main>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const [pw, setPw] = useState('');
  const [state, setState] = useState({ fields: {} });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), newPassword: pw });
      setState({ fields: {}, ok: true });
    } catch (ex) {
      setState(readError(ex));
    }
  };
  if (state.ok) return <main className="page narrow"><p role="status">Password changed. <Link to="/login">Sign in</Link>.</p></main>;
  return (
    <main className="page narrow">
      <h1>Choose a new password</h1>
      <form onSubmit={submit}>
        <Field id="newPassword" label="New password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={state.fields.newPassword} />
        {state.message && !Object.keys(state.fields).length && <p className="error" role="alert">{state.message}</p>}
        <button type="submit">Save password</button>
      </form>
    </main>
  );
}

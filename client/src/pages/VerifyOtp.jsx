// FR-02: six-digit OTP with a resend action.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import api, { readError } from '../api/client';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState({ fields: {} });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/verify-otp', { email, otp });
      navigate('/login', { state: { verified: true } });
    } catch (ex) {
      setErr(readError(ex));
    }
  };
  const resend = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      setMsg('A new code has been sent if the address needs verifying.');
    } catch (ex) {
      setErr(readError(ex));
    }
  };
  return (
    <main className="page narrow">
      <h1>Verify your e-mail</h1>
      <p>Enter the six-digit code we sent. It is valid for 10 minutes.</p>
      <form onSubmit={submit} noValidate>
        <Field id="email" label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err.fields.email} />
        <Field id="otp" label="Code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} error={err.fields.otp} />
        {err.message && !Object.keys(err.fields).length && <p className="error" role="alert">{err.message}</p>}
        {msg && <p role="status">{msg}</p>}
        <button type="submit">Verify</button> <button type="button" className="link" onClick={resend}>Send a new code</button>
      </form>
    </main>
  );
}

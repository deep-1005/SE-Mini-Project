// Form field with an inline error slot linked by aria-describedby (SAD 4.5).
export default function Field({ id, label, error, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && <span id={`${id}-err`} className="error">{error}</span>}
    </div>
  );
}

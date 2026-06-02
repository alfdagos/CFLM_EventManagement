export function Spinner({ label }: { label?: string }) {
  return (
    <div className="center">
      <div className="spinner" />
      {label && <p className="muted">{label}</p>}
    </div>
  );
}

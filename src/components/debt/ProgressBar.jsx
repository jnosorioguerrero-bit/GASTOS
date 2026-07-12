export default function ProgressBar({ pct, color }) {
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }} />
    </div>
  )
}

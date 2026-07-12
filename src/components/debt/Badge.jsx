export default function Badge({ variant = 'blue', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

import './Loader.css'

interface LoaderProps {
  message?: string
}

export function Loader({ message = 'Loading…' }: LoaderProps) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spinner" />
      <span>{message}</span>
    </div>
  )
}

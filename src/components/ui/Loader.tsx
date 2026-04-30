interface LoaderProps {
  label?: string
}

export function Loader({ label }: LoaderProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span
          className="block w-2 h-2 rounded-full bg-blue-500 fv-pulse-dot"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="block w-2 h-2 rounded-full bg-blue-500 fv-pulse-dot"
          style={{ animationDelay: '0.15s' }}
        />
        <span
          className="block w-2 h-2 rounded-full bg-blue-500 fv-pulse-dot"
          style={{ animationDelay: '0.3s' }}
        />
      </div>
      {label ? (
        <div className="text-xs uppercase tracking-widest text-ink-300">
          {label}
        </div>
      ) : null}
    </div>
  )
}

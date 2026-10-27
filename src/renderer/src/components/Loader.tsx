export default function Loader({ label }: { label?: string }) {
  const text = (label || 'Загрузка').replace(/[.…]+$/, '')
  return (
    <div className="loader">
      {text}
      <span className="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}

export default function Loader({ label }: { label?: string }) {
  return <div className="loader">{label || 'Загрузка...'}</div>
}

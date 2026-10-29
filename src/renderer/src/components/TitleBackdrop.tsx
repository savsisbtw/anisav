export default function TitleBackdrop({ src }: { src?: string }) {
  if (!src) return null
  return (
    <div className="title-backdrop" aria-hidden="true">
      <div style={{ backgroundImage: `url("${src}")` }} />
    </div>
  )
}

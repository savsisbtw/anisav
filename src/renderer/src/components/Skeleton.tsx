export function CardSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ aspectRatio: '2 / 3' }} />
      <div className="skeleton" style={{ height: 12, width: '80%', marginTop: 10 }} />
      <div className="skeleton" style={{ height: 10, width: '45%', marginTop: 6 }} />
    </div>
  )
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid-posters">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

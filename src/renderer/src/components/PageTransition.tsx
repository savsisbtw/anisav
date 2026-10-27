import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  return (
    <div key={pathname + search} className="page-in">
      {children}
    </div>
  )
}

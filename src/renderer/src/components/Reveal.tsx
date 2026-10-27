import { useRef } from 'react'
import type { ElementType, ReactNode } from 'react'
import { useInViewOnce } from '../lib/motion'

export default function Reveal({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: ElementType
}) {
  const ref = useRef<HTMLElement>(null)
  const seen = useInViewOnce(ref)
  return (
    <Tag ref={ref} className={`reveal${seen ? ' in' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  )
}

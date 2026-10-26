import { useEffect, useState } from 'react'
import { isInWishlist, toggleWishlist, onWishlistChange } from '../lib/wishlist'
import type { Release } from '../../../shared/types'

export default function WishlistButton({
  release,
  size = 'md',
}: {
  release: Release
  size?: 'sm' | 'md'
}) {
  const [saved, setSaved] = useState(() => isInWishlist(release.id))

  useEffect(() => onWishlistChange(() => setSaved(isInWishlist(release.id))), [release.id])

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSaved(toggleWishlist(release))
  }

  const iconSize = size === 'sm' ? 13 : 15

  return (
    <button
      onClick={onClick}
      title={saved ? 'Убрать из понравившегося' : 'Добавить в понравившееся'}
      className={`icon-btn${size === 'sm' ? ' sm' : ''}${saved ? ' on' : ''}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.6z" />
      </svg>
    </button>
  )
}

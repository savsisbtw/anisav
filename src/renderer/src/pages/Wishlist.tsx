import { useEffect, useState } from 'react'
import { getWishlist, onWishlistChange } from '../lib/wishlist'
import type { Release } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'

export default function Wishlist() {
  const [items, setItems] = useState<Release[]>(() => getWishlist())

  useEffect(() => onWishlistChange(() => setItems(getWishlist())), [])

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Понравилось</h1>
          <p>Локальный список на этом устройстве, вход в аккаунт не нужен</p>
        </div>
      </div>

      {items.length === 0 && <p className="empty">Пока пусто. Нажми на звёздочку у тайтла, чтобы добавить сюда</p>}

      {items.length > 0 && (
        <div className="grid-posters">
          {items.map((r) => (
            <AnimeCard key={r.id} release={r} />
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ScheduleDay } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import Loader from '../components/Loader'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7]

export default function Schedule() {
  const [week, setWeek] = useState<ScheduleDay[] | null>(null)

  useEffect(() => {
    api.scheduleWeek().then(setWeek).catch(() => setWeek([]))
  }, [])

  if (!week) return <Loader label="Загружаем расписание..." />

  const byDay = new Map<number, ScheduleDay[]>()
  for (const item of week) {
    if (!item.release) continue
    const day = item.release.publish_day?.value ?? 0
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(item)
  }

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Расписание</h1>
          <p>Выход серий по дням недели</p>
        </div>
      </div>
      {DAY_ORDER.filter((d) => byDay.has(d)).map((day) => (
        <section key={day} className="section">
          <h2 className="section-title">
            {byDay.get(day)![0].release.publish_day?.description}
            <span className="mono">{byDay.get(day)!.length}</span>
          </h2>
          <div className="grid-posters">
            {byDay.get(day)!.map((item) => (
              <AnimeCard key={item.release.id} release={item.release} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

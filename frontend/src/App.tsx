import { useEffect, useState } from "react"
import type { Booking, Chapel } from "./types"
import WeeklyGrid from "./components/WeeklyGrid"
import api from "./api"

function getWeekDates(referenceDate: Date): string[] {
  const day = referenceDate.getDay()
  const monday = new Date(referenceDate)
  monday.setDate(referenceDate.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split("T")[0]
  })
}

function App() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [chapels, setChapels] = useState<Chapel[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const weekDates = getWeekDates(currentDate)

  useEffect(() => {
    api.get("/chapels").then(res => setChapels(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const refDate = weekDates[0]
    api.get(`/bookings/week?reference_date=${refDate}`)
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
  }, [currentDate])

  function goToPreviousWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  function goToNextWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Farenga Scheduler</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button onClick={goToPreviousWeek}>← Previous week</button>
        <button onClick={goToNextWeek}>Next week →</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <WeeklyGrid
          chapels={chapels}
          bookings={bookings}
          weekDates={weekDates}
        />
      )}
    </div>
  )
}

export default App
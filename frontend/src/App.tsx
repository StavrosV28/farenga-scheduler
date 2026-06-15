import { useEffect, useState } from "react"
import type { Booking } from "./types"
import type { Chapel } from "./types"
import WeeklyGrid from "./components/WeeklyGrid"
import Login from "./components/Login"
import api from "./api"
import { supabase } from "./supabase"
import DailyView from "./components/DailyView"

function getWeekDates(referenceDate: Date): string[] {
  const day = referenceDate.getDay()
  const sunday = new Date(referenceDate)
  sunday.setDate(referenceDate.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d.toISOString().split("T")[0]
  })
}

function App() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [chapels, setChapels] = useState<Array<Chapel>>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [view, setView] = useState<'daily' | 'weekly'>('daily')

  const weekDates = getWeekDates(currentDate)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCheckingSession(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    api.get("/chapels").then(res => setChapels(res.data))
  }, [session])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    api.get(`/bookings/week?reference_date=${weekDates[0]}`)
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
  }, [currentDate, session])

  function refreshBookings() {
    api.get(`/bookings/week?reference_date=${weekDates[0]}`)
      .then(res => setBookings(res.data))
  }

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

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (checkingSession) return <p style={{ padding: "20px" }}>Loading...</p>
  if (!session) return <Login onLogin={() => {}} />

  return (
  <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <h1 style={{ margin: 0 }}>Farenga Scheduler</h1>
      <button onClick={handleSignOut} style={{ padding: "8px 16px", cursor: "pointer" }}>
        Sign out
      </button>
    </div>

    <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
      <button
        onClick={() => setView('daily')}
        style={tabStyle(view === 'daily')}
      >
        Today
      </button>
      <button
        onClick={() => setView('weekly')}
        style={tabStyle(view === 'weekly')}
      >
        Weekly
      </button>
    </div>

    {view === 'daily' ? (
      <DailyView
        chapels={chapels}
        onBookingChanged={refreshBookings}
      />
    ) : (
      <>
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
            onBookingCreated={refreshBookings}
          />
        )}
      </>
    )}
  </div>
)
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 20px",
    borderRadius: "99px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    background: active ? "#1a73e8" : "#f1f1f1",
    color: active ? "white" : "#555"
  }
}

export default App
import { useEffect, useState } from "react"
import type { Booking } from "./types"
import type { Chapel } from "./types"
import WeeklyGrid from "./components/WeeklyGrid"
import Login from "./components/Login"
import api from "./api"
import { supabase } from "./supabase"
import DailyView from "./components/DailyView"
import ContactsDirectory from "./components/ContactsDirectory"
import DailyBriefingTab from "./components/DailyBriefing"

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
  const [view, setView] = useState<'daily' | 'weekly' | 'contacts' | 'briefing'>('daily')

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
    <div className="animate-fade-in" style={{ 
      padding: "20px", 
      fontFamily: "inherit",
      maxWidth: "1000px", 
      margin: "0 auto",
      minHeight: "100vh"
    }}>
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "0.5px solid var(--border)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img 
          src="/farenga.png" 
          alt="Farenga Funeral Home" 
          style={{ height: "40px", width: "auto" }} 
        />
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "500", color: "var(--text-primary)" }}>
            Farenga Scheduler
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
      <button 
        onClick={handleSignOut} 
        style={{ 
          padding: "8px 16px", 
          background: "transparent",
          border: "0.5px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text-secondary)",
          fontSize: "13px"
        }}
      >
        Sign out
      </button>
    </div>

    <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
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

      <button
        onClick={() => setView('contacts')}
        style={tabStyle(view === 'contacts')}>
          Contacts
        </button>
      <button 
        onClick={() => setView('briefing')} 
        style={tabStyle(view === 'briefing')}>
        Briefing
      </button>

    </div>


    {view === 'daily' && (
      <div key="daily" className="tab-content">
        <DailyView
        chapels={chapels}
        onBookingChanged={refreshBookings}
      />
      </div>
    )}

    {view === 'weekly' && (
      <div key="weekly" className="tab-content">
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
      <button onClick={goToPreviousWeek} style={navButtonStyle}>← Previous</button>
      <button onClick={goToNextWeek} style={navButtonStyle}>Next →</button>
      </div>
    {loading ? (
      <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
    ) : (
      <WeeklyGrid
        chapels={chapels}
        bookings={bookings}
        weekDates={weekDates}
        onBookingCreated={refreshBookings}
      />
    )}
  </div>
    )}

    {view === 'contacts' && (
      <div key="contacts" className="tab-content">
        <ContactsDirectory />
      </div>
    )}
    {view === 'briefing' && (
      <div key="briefing" className="tab-content">
        <DailyBriefingTab />
      </div>
    )}
  </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 24px",
    borderRadius: "99px",
    border: active ? "none" : "0.5px solid var(--border)",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    background: active ? "var(--accent-blue)" : "transparent",
    color: active ? "#fff" : "var(--text-secondary)"
  }
}

const navButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-secondary)",
  fontSize: "13px"
}


export default App
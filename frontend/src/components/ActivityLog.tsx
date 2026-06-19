import { useEffect, useState } from "react"
import api from "../api"

interface AuditEntry {
  audit_id: string
  action: string
  changed_at: string
  previous_values: any
  users: { name: string } | null
  bookings: {
    family_name: string
    date: string
    chapels: { chapel_name: string } | null
  } | null
}

function getChanges(action: string, prev: any, current: any): string[] {
    if (action === "Created") return ["Booking created"]
    if (action === "Deleted") return [
        `${prev?.family_name} Family — ${prev?.service_type}`,
        prev?.start_time ? `${formatTime(prev.start_time)} — ${formatTime(prev.end_time)}` : ""
    ].filter(Boolean)
    if (!prev || !current) return ["Details updated"]

    const changes: string[] = []

  const fields: Record<string, string> = {
    start_time: "Start time",
    end_time: "End time",
    family_name: "Family name",
    service_type: "Service type",
    date: "Date",
    notes: "Notes",
    funeral_location: "Funeral location",
    funeral_date: "Funeral date",
    funeral_time: "Funeral time",
    internment: "Internment"
  }

  for (const [key, label] of Object.entries(fields)) {
    const oldVal = prev[key] ?? null
    const newVal = current[key] ?? null

    if (oldVal === newVal) continue
    if (oldVal === null && newVal === null) continue

    let oldDisplay = oldVal ?? "None"
    let newDisplay = newVal ?? "None"

    if (key === "start_time" || key === "end_time" || key === "funeral_time") {
      oldDisplay = oldDisplay !== "None" ? formatTime(oldDisplay) : "None"
      newDisplay = newDisplay !== "None" ? formatTime(newDisplay) : "None"
    }

    if (key === "date" || key === "funeral_date") {
      oldDisplay = oldDisplay !== "None"
        ? new Date(oldDisplay + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "None"
      newDisplay = newDisplay !== "None"
        ? new Date(newDisplay + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "None"
    }

    changes.push(`${label}: ${oldDisplay} → ${newDisplay}`)
  }

  return changes.length > 0 ? changes : ["No changes detected"]
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${minutes} ${ampm}`
}

function groupByDay(entries: AuditEntry[]): Record<string, AuditEntry[]> {
  return entries.reduce((groups, entry) => {
    const date = new Date(entry.changed_at.replace(" ", "T") + "Z")
    const day = date.toLocaleDateString("en-CA")
    if (!groups[day]) groups[day] = []
    groups[day].push(entry)
    return groups
  }, {} as Record<string, AuditEntry[]>)
}


function formatDay(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  if (dateStr === today) return "Today"
  if (dateStr === yesterday) return "Yesterday"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  })
}

function actionColor(action: string): string {
  if (action === "Created") return "#4ade80"
  if (action === "Deleted") return "#f87171"
  return "#93c5fd"
}

function actionBg(action: string): string {
  if (action === "Created") return "#166534"
  if (action === "Deleted") return "#7f1d1d"
  return "#1e3a5f"
}

function ActivityLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/audit").then(res => {
        setEntries(res.data)
        setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: "var(--text-secondary)" }}>Loading...</p>

  if (entries.length === 0) return (
    <div style={{
      background: "var(--bg-secondary)",
      borderRadius: "12px",
      padding: "40px",
      border: "0.5px solid var(--border)",
      textAlign: "center"
    }}>
      <p style={{ color: "var(--text-muted)" }}>No activity in the last 7 days</p>
    </div>
  )

  const grouped = groupByDay(entries)

  return (
    <div className="animate-fade-in-up">
      <h2 style={{ margin: "0 0 20px", fontWeight: "500", color: "var(--text-primary)", fontSize: "18px" }}>
        Activity — last 7 days
      </h2>

      {Object.entries(grouped).map(([day, dayEntries]) => (
        <div key={day} style={{ marginBottom: "28px" }}>
          <p style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "10px"
          }}>
            {formatDay(day)}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {dayEntries.map(entry => {
              const changes = getChanges(entry.action, entry.previous_values, entry.bookings)
              const time = new Date(entry.changed_at.replace(" ", "T") + "Z").toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              })
                const familyName = entry.bookings?.family_name ?? entry.previous_values?.family_name ?? "Unknown"
                const chapelName = entry.bookings?.chapels?.chapel_name ?? entry.previous_values?.chapel_name ?? "Unknown chapel"
                const bookingDate = entry.bookings?.date ?? entry.previous_values?.date ?? null

              return (
                <div
                  key={entry.audit_id}
                  style={{
                    background: entry.action === "Created" ? "#1a3a2a" : entry.action === "Deleted" ? "#3b1f2b" : "#1e2a45",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    border: entry.action === "Created" ? "0.5px solid #166534" : entry.action === "Deleted" ? "0.5px solid  #7f1d1d" : "0.5px solid #2d5a9e",
                    borderLeft: `3px solid ${actionColor(entry.action)}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        background: actionBg(entry.action),
                        color: actionColor(entry.action),
                        fontSize: "11px",
                        fontWeight: "500",
                        padding: "2px 8px",
                        borderRadius: "99px"
                      }}>
                        {entry.action}
                      </span>
                      <span style={{ fontWeight: "500", fontSize: "14px", color: "var(--text-primary)" }}>
                        {familyName} Family
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{time}</span>
                  </div>

                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {chapelName} —{" "}
                    {bookingDate
                      ? new Date(bookingDate + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short", day: "numeric"
                        })
                      : ""}
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>by </span>
                    {entry.users?.name ?? "Unknown"}
                  </div>

                  {changes.length > 0 && entry.action === "Updated" && (
                    <div style={{
                      marginTop: "10px",
                      paddingTop: "10px",
                      borderTop: "0.5px solid var(--border)"
                    }}>
                      {changes.map((change, i) => (
                        <div key={i} style={{
                          fontSize: "12px",
                          color: entry.action === "Created" ? "#86efac" : entry.action === "Deleted" ? "#fca5a5" : "#93c5fd",
                          padding: "2px 0"
                        }}>
                          → {change}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityLog
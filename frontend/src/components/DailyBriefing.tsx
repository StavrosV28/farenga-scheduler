import { useEffect, useState } from "react"
import type { DailyBriefing } from "../types"
import api from "../api"
import { supabase } from "../supabase"

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${minutes} ${ampm}`
}

function DailyBriefingTab() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  })

    async function generatePrefill() {
        try {
            const [dayResponse, funeralFollowResponse] = await Promise.all([
            api.get(`/bookings/day?date=${selectedDate}`),
            api.get(`/bookings/funerals?funeral_date=${selectedDate}`)
            ])

            const bookings = dayResponse.data
            const funeralFollows = funeralFollowResponse.data

            const funerals = bookings.filter((b: any) => b.service_type === "Funeral")
            const viewings = bookings.filter((b: any) => b.service_type === "Viewing")
            const memorials = bookings.filter((b: any) => b.service_type === "Memorial")

            const formatEntry = (b: any, index: number) => {
            let line = `${index + 1} - ${b.family_name} ${formatTime(b.start_time)}`
            if (b.funeral_location) line += ` - ${b.funeral_location}`
            if (b.internment) line += ` | Internment: ${b.internment}`
            return line
            }
        
            const formatFuneralFollow = (b: any, index: number) => {
            let line = `${index + 1} - ${b.family_name}`
            if (b.funeral_time) line += ` ${formatTime(b.funeral_time)}`
            if (b.funeral_location) line += ` - ${b.funeral_location}`
            if (b.internment) line += ` | Internment: ${b.internment}`
            return line
            }

            const allFunerals = [
            ...funerals.map((b: any, i: number) => formatEntry(b, i)),
            ...funeralFollows.map((b: any, i: number) => formatFuneralFollow(b, funerals.length + i))
            ]

            const funeralsSection = allFunerals.length > 0 ? allFunerals.join("\n") : "1 - "
            const arrangementsSection = memorials.length > 0
            ? memorials.map((b: any, i: number) => formatEntry(b, i)).join("\n")
            : "1 - "
            const visitationsSection = viewings.length > 0
            ? viewings.map((b: any, i: number) => formatEntry(b, i)).join("\n")
            : "1 - "

            const generated = `Funerals:\n${funeralsSection}\n\nArrangements:\n${arrangementsSection}\n\nVisitations:\n${visitationsSection}\n\nBodies out:\n1 - `

            setText(generated)
            setEditing(true)
        } catch {
            alert("Something went wrong generating the briefing")
        }
    }

  function fetchBriefing(date: string) {
    setLoading(true)
    api.get(`/briefings/${date}`)
      .then(res => {
        setBriefing(res.data)
        setText(res.data?.briefing_text ?? defaultTemplate)
        setLoading(false)
      })
      .catch(() => {
        setBriefing(null)
        setText(defaultTemplate)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchBriefing(selectedDate)
  }, [selectedDate])

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    try {
      if (briefing) {
        await api.put(`/briefings/${selectedDate}`, {
          briefing_date: selectedDate,
          briefing_text: text,
          created_by: userId
        })
      } else {
        await api.post("/briefings", {
          briefing_date: selectedDate,
          briefing_text: text,
          created_by: userId
        })
      }
      fetchBriefing(selectedDate)
      setEditing(false)
    } catch {
      alert("Something went wrong, please try again")
    } finally {
      setSaving(false)
    }
  }

  function handlePrint() {
    const printDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    })

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
        <!DOCTYPE html>
            <html>
                <head>
                    <title>Daily Briefing — ${printDate}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            margin: 1in;
                            size: letter;
                        }
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            font-family: 'Lato', Arial, sans-serif;
                            color: #1a1a1a;
                            font-size: 15px;
                            line-height: 2;
                        }
                        .date {
                            font-family: 'Playfair Display', serif;
                            font-size: 28px;
                            font-weight: 700;
                            color: #1a1a1a;
                            margin-bottom: 4px;
                        }
                        .subtitle {
                            font-size: 13px;
                            color: #555;
                            letter-spacing: 0.08em;
                            text-transform: uppercase;
                            margin-bottom: 24px;
                        }
                        .divider {
                            border: none;
                            border-top: 1.5px solid #1a1a1a;
                            margin-bottom: 28px;
                        }
                        pre {
                            white-space: pre-wrap;
                            font-family: 'Lato', Arial, sans-serif;
                            font-size: 15px;
                            line-height: 2.2;
                            color: #1a1a1a;
                        }
                    </style>
                </head>
    <body>
      <div class="date">${printDate}</div>
      <div class="subtitle">Farenga Funeral Home — Daily Briefing</div>
      <hr class="divider" />
      <pre>${briefing?.briefing_text ?? text}</pre>
    </body>
    </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  })

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: "500", color: "var(--text-primary)", fontSize: "18px" }}>
            Daily Briefing
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
            {displayDate}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value)
              setEditing(false)
            }}
            style={{ width: "auto", padding: "8px 12px", fontSize: "13px" }}
          />
          {briefing && !editing && (
            <button onClick={handlePrint} style={secondaryBtnStyle}>
              Print
            </button>
          )}
            {!editing && (
                <button onClick={generatePrefill} style={secondaryBtnStyle}>
                    Pre-fill from schedule
                </button>
            )}
          {!editing ? (
            <button onClick={() => setEditing(true)} style={primaryBtnStyle}>
              {briefing ? "Edit" : "Write briefing"}
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setText(briefing?.briefing_text ?? defaultTemplate) }} style={cancelBtnStyle}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : editing ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          style={{
            width: "100%",
            minHeight: "400px",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "0.5px solid var(--border)",
            borderRadius: "12px",
            padding: "20px",
            fontSize: "14px",
            lineHeight: "1.8",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
      ) : briefing ? (
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          padding: "24px",
          border: "0.5px solid var(--border)",
          fontSize: "14px",
          lineHeight: "1.8",
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap"
        }}>
          {briefing.briefing_text}
        </div>
      ) : (
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          padding: "40px",
          border: "0.5px solid var(--border)",
          textAlign: "center"
        }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
            No briefing written for this date yet
          </p>
          <button onClick={() => setEditing(true)} style={primaryBtnStyle}>
            Write briefing
          </button>
          {!editing && (
            <button onClick={generatePrefill} style={secondaryBtnStyle}>
                Pre-fill from schedule
            </button>
            )}
        </div>
      )}
    </div>
  )
}

const defaultTemplate = `Funerals:
1 - 

Arrangements:
1 - 

Visitations:
1 - 

Bodies out:
1 - `

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent-blue)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 18px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer"
}

const secondaryBtnStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--text-secondary)",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  padding: "8px 18px",
  fontSize: "14px",
  cursor: "pointer"
}

const cancelBtnStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--text-secondary)",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  padding: "8px 18px",
  fontSize: "14px",
  cursor: "pointer"
}

export default DailyBriefingTab
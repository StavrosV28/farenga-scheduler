import { useEffect, useState } from "react"
import type { Booking, Chapel } from "../types"
import api from "../api"
import BookingDetail from "./BookingDetail"

interface DailyViewProps {
  chapels: Chapel[]
  onBookingChanged: () => void
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${minutes} ${ampm}`
}

function DailyView({ chapels, onBookingChanged }: DailyViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; chapel: Chapel } | null>(null)

  const today = new Date().toISOString().split("T")[0]

  function fetchBookings() {
    setLoading(true)
    api.get(`/bookings/day?date=${today}`)
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h2 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "500", color: "var(--text-primary)" }}>
        {new Date(today + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        })}
      </h2>

      {chapels.map(chapel => {
        const chapelBookings = bookings.filter(b => b.chapel_id === chapel.chapel_id)

        return (
          <div key={chapel.chapel_id} style={chapelSectionStyle}>
            <h3 style={chapelHeaderStyle}>{chapel.chapel_name}</h3>

            {chapelBookings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: "10px 0", fontSize: "14px" }}>No services today</p>
            ) : (
              chapelBookings.map(booking => (
                <div
                  key={booking.booking_id}
                  style={bookingCardStyle}
                  onClick={() => setSelectedBooking({ booking, chapel })}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600", fontSize: "16px" }}>
                      {booking.family_name} Family
                    </span>
                    <span style={serviceTypeBadgeStyle(booking.service_type)}>
                      {booking.service_type}
                    </span>
                  </div>
                  <div style={{ color: "#555", marginTop: "6px", fontSize: "14px" }}>
                    {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
                  </div>
                  {booking.notes && (
                    <div style={{ color: "#777", marginTop: "6px", fontSize: "13px" }}>
                      {booking.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )
      })}

      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking.booking}
          chapel={selectedBooking.chapel}
          onClose={() => setSelectedBooking(null)}
          onBookingChanged={() => {
            fetchBookings()
            onBookingChanged()
            setSelectedBooking(null)
          }}
        />
      )}
    </div>
  )
}

function serviceTypeBadgeStyle(serviceType: string): React.CSSProperties {
  const colors: Record<string, { background: string; color: string }> = {
    Viewing: { background: "var(--accent-blue-dim)", color: "var(--accent-blue)" },
    Funeral: { background: "var(--accent-red-dim)", color: "var(--accent-red)" },
    Memorial: { background: "var(--accent-green-dim)", color: "var(--accent-green)" }
  }
  const { background, color } = colors[serviceType] || { background: "var(--bg-card)", color: "var(--text-secondary)" }
  return {
    background,
    color,
    padding: "3px 10px",
    borderRadius: "99px",
    fontSize: "12px",
    fontWeight: "500"
  }
}

const chapelSectionStyle: React.CSSProperties = {
  marginBottom: "16px",
  background: "var(--bg-secondary)",
  borderRadius: "12px",
  padding: "16px",
  border: "0.5px solid var(--border)"
}

const chapelHeaderStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "15px",
  fontWeight: "500",
  color: "var(--text-primary)",
  borderBottom: "0.5px solid var(--border)",
  paddingBottom: "10px"
}

const bookingCardStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  background: "var(--bg-card)",
  marginBottom: "8px",
  cursor: "pointer",
  border: "0.5px solid var(--border)",
  borderLeft: "3px solid var(--accent-blue)"
}

export default DailyView
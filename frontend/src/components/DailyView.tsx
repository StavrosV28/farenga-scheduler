import { useEffect, useState } from "react"
import type { Booking, Chapel } from "../types"
import api from "../api"
import BookingDetail from "./BookingDetail"

interface DailyViewProps {
  chapels: Chapel[]
  onBookingChanged: () => void
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
      <h2 style={{ marginBottom: "20px" }}>
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
              <p style={{ color: "#aaa", margin: "10px 0" }}>No services today</p>
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
                    {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
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
    Viewing: { background: "#e8f0fe", color: "#1a73e8" },
    Funeral: { background: "#fce8e6", color: "#d93025" },
    Memorial: { background: "#e6f4ea", color: "#1e8e3e" }
  }
  const { background, color } = colors[serviceType] || { background: "#f1f1f1", color: "#555" }
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
  marginBottom: "24px",
  background: "white",
  borderRadius: "12px",
  padding: "16px",
  border: "1px solid #e0e0e0"
}

const chapelHeaderStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  fontWeight: "600",
  color: "#333",
  borderBottom: "1px solid #f0f0f0",
  paddingBottom: "10px"
}

const bookingCardStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  background: "#f8f9fa",
  marginBottom: "8px",
  cursor: "pointer",
  border: "1px solid #e8e8e8"
}

export default DailyView
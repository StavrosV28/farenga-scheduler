import { useState } from "react"
import type { Booking, Chapel } from "../types"
import BookingModal from "./BookingModal"
import BookingDetail from "./BookingDetail"

interface WeeklyGridProps {
  chapels: Chapel[]
  bookings: Booking[]
  weekDates: string[]
  onBookingCreated: () => void
}

function WeeklyGrid({ chapels, bookings, weekDates, onBookingCreated }: WeeklyGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ chapel: Chapel; date: string } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; chapel: Chapel } | null>(null)

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cellStyle}>Chapel</th>
            {weekDates.map(date => (
              <th key={date} style={cellStyle}>
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric"
                })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chapels.map(chapel => (
            <tr key={chapel.chapel_id}>
              <td style={{ ...cellStyle, fontWeight: "bold" }}>
                {chapel.chapel_name}
              </td>
              {weekDates.map(date => {
                const cellBookings = bookings.filter(
                  b => b.chapel_id === chapel.chapel_id && b.date === date
                )
                return (
                  <td
                    key={date}
                    style={{ ...cellStyle, cursor: "pointer" }}
                    onClick={() => setSelectedCell({ chapel, date })}
                  >
                    {cellBookings.length === 0 ? (
                      <span style={{ color: "#aaa" }}>Available</span>
                    ) : (
                      cellBookings.map(booking => (
                        <div
                          key={booking.booking_id}
                          style={bookingStyle}
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedBooking({ booking, chapel })
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>
                            {booking.family_name}
                          </div>
                          <div style={{ fontSize: "12px" }}>
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </div>
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            {booking.service_type}
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCell && (
        <BookingModal
          chapel={selectedCell.chapel}
          date={selectedCell.date}
          onClose={() => setSelectedCell(null)}
          onBookingCreated={() => {
            onBookingCreated()
            setSelectedCell(null)
          }}
        />
      )}

      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking.booking}
          chapel={selectedBooking.chapel}
          onClose={() => setSelectedBooking(null)}
          onBookingChanged={() => {
            onBookingCreated()
            setSelectedBooking(null)
          }}
        />
      )}
    </div>
  )
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "10px",
  verticalAlign: "top",
  minWidth: "130px"
}

const bookingStyle: React.CSSProperties = {
  background: "#e8f0fe",
  borderRadius: "6px",
  padding: "6px",
  marginBottom: "4px",
  cursor: "pointer"
}

export default WeeklyGrid
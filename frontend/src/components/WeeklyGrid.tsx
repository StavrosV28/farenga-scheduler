import type { Booking, Chapel } from "../types"

interface WeeklyGridProps {
  chapels: Chapel[]
  bookings: Booking[]
  weekDates: string[]
}

function WeeklyGrid({ chapels, bookings, weekDates }: WeeklyGridProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>

        {/* Header row - days of the week */}
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

        {/* One row per chapel */}
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
                  <td key={date} style={cellStyle}>
                    {cellBookings.length === 0 ? (
                      <span style={{ color: "#aaa" }}>Available</span>
                    ) : (
                      cellBookings.map(booking => (
                        <div key={booking.booking_id} style={bookingStyle}>
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
  marginBottom: "4px"
}

export default WeeklyGrid
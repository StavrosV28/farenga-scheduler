import type { Booking, Chapel } from "../types"
import api from "../api"
import { useState } from "react"
import BookingModal from "./BookingModal"

interface BookingDetailProps {
  booking: Booking
  chapel: Chapel
  onClose: () => void
  onBookingChanged: () => void
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${minutes} ${ampm}`
}

function BookingDetail({ booking, chapel, onClose, onBookingChanged }: BookingDetailProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await api.delete(`/bookings/${booking.booking_id}?deleted_by=${booking.created_by}`)
      onBookingChanged()
      onClose()
    } catch {
      setError("Something went wrong, please try again")
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <BookingModal
        chapel={chapel}
        date={booking.date}
        onClose={() => setEditing(false)}
        onBookingCreated={() => {
          onBookingChanged()
          onClose()
        }}
        existingBooking={booking}
      />
    )
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="animate-fade-in-scale" style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: "var(--text-primary)", fontWeight: "500" }}>{booking.family_name} Family</h2>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Chapel</span>
          <span>{chapel.chapel_name}</span>
        </div>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Date</span>
          <span>{new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric"
          })}</span>
        </div>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Time</span>
          <span>{formatTime(booking.start_time)} — {formatTime(booking.end_time)}</span>
        </div>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Service</span>
          <span>{booking.service_type}</span>
        </div>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Funeral location</span>
          <span style={{ color: booking.funeral_location ? "var(--text-primary)" : "var(--text-muted)" }}>
          {booking.funeral_location || "Not specified"}
          </span>
        </div>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Internment</span>
          <span style={{ color: booking.internment ? "var(--text-primary)" : "var(--text-muted)" }}>
          {booking.internment || "Not specified"}
          </span>
        </div>

        <div style={detailRowStyle}>
          <span style={labelStyle}>Notes</span>
          <span style={{ color: booking.notes ? "var(--text-primary)" : "var(--text-muted)" }}>
            {booking.notes || "No notes added"}
          </span>
        </div>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        {!confirming ? (
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button style={editStyle} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button style={deleteStyle} onClick={() => setConfirming(true)}>
              Delete
            </button>
            <button style={cancelStyle} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "24px" }}>
            <p style={{ color: "#c00", fontWeight: "500" }}>
              Are you sure you want to delete this booking?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={deleteStyle}
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, delete"}
              </button>
              <button style={cancelStyle} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
}

const modalStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: "16px",
  padding: "24px",
  width: "90%",
  maxWidth: "420px",
  border: "0.5px solid var(--border)"
}

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "0.5px solid var(--border)",
  fontSize: "14px"
}

const labelStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontWeight: "500"
}

const errorStyle: React.CSSProperties = {
  background: "var(--accent-red-dim)",
  border: "0.5px solid var(--accent-red)",
  borderRadius: "8px",
  padding: "10px",
  marginTop: "16px",
  color: "var(--accent-red)"
}

const editStyle: React.CSSProperties = {
  background: "var(--accent-blue)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "15px",
  cursor: "pointer",
  flex: 1,
  fontWeight: "500"
}

const deleteStyle: React.CSSProperties = {
  background: "var(--accent-red-dim)",
  color: "var(--accent-red)",
  border: "0.5px solid var(--accent-red)",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "15px",
  cursor: "pointer",
  flex: 1
}

const cancelStyle: React.CSSProperties = {
  background: "transparent",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "15px",
  cursor: "pointer",
  color: "var(--text-secondary)"
}

export default BookingDetail
import React, { useState } from "react"
import type { Chapel } from "../types"
import api from "../api"

interface BookingModalProps {
    chapel: Chapel
    date: string
    onClose: () => void
    onBookingCreated: () => void
}

function BookingModal({ chapel, date, onClose, onBookingCreated: onBookingsCreated }: BookingModalProps) {
    const [familyName, setFamilyName] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [serviceType, setServiceType] = useState("Viewing")
    const [notes, setNotes] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!familyName || !startTime || !endTime) {
            setError("Please fill in all required fields")
            return
        }
        
        if (startTime >= endTime) {
            setError("End time must be after start time")
            return
        }

        setLoading(true)
        setError("")

        try {
            await api.post("/bookings", {
                chapel_id: chapel.chapel_id,
                created_by: "8a501639-3035-498c-a698-66805ead7290",
                family_name: familyName,
                date: date,
                start_time: startTime,
                end_time: endTime,
                service_type: serviceType,
                notes: notes || null
            })
            onBookingsCreated()
            onClose()
        } catch (err: any) {
            if (err.response?.status === 409) {
                setError("This chapel is already in use at this time.")
            } else {
                setError("Something went wrong, please try again.")
            }
        } finally {
            setLoading(false)
        }
    }
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>New Booking</h2>
        <p style={{ color: "#666", marginTop: "-10px" }}>
          {chapel.chapel_name} — {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric"
          })}
        </p>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <div style={fieldStyle}>
          <label>Family name *</label>
          <input
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Johnson"
          />
        </div>

        <div style={fieldStyle}>
          <label>Start time *</label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label>End time *</label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label>Service type *</label>
          <select
            value={serviceType}
            onChange={e => setServiceType(e.target.value)}
            style={inputStyle}
          >
            <option>Viewing</option>
            <option>Memorial</option>
            <option>Funeral</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, height: "80px" }}
            placeholder="Optional"
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={submitStyle}
          >
            {loading ? "Saving..." : "Save booking"}
          </button>
          <button onClick={onClose} style={cancelStyle}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
}

const modalStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    width: "90%",
    maxWidth: "420px",
    maxHeight: "90vh",
    overflowY: "auto"
}

const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px"
}

const inputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "16px"
}

const errorStyle: React.CSSProperties = {
    background: "#fee",
    border: "1px solid #fcc",
    borderRadius: "6px",
    padding: "10px",
    marginBottom: "16px",
    color: "#c00"
}

const submitStyle: React.CSSProperties = {
    background: "#1a73e8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    flex: 1
}

const cancelStyle: React.CSSProperties = {
    background: "#f1f1f1",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer"
}

export default BookingModal
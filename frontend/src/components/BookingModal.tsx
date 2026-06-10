import { useState } from "react"
import type { Chapel } from "../types"
import api from "../api"

interface BookingModalProps {
    chapel: Chapel
    date: string
    onClose: () => void
    onBookingsCreated: () => void
}

function BookingModal({ chapel, date, onClose, onBookingsCreated }: BookingModalProps) {
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
                created_by: "00000000-0000-0000-0000-000000000000",
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


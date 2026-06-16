import { useState } from "react"
import type { Booking, Chapel } from "../types"
import BookingModal from "./BookingModal"
import BookingDetail from "./BookingDetail"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import api from "../api"

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${minutes} ${ampm}`
}

interface WeeklyGridProps {
  chapels: Chapel[]
  bookings: Booking[]
  weekDates: string[]
  onBookingCreated: () => void
}

interface DraggableBookingProps {
  booking: Booking
  onClick: (e: React.MouseEvent) => void
}

function DraggableBooking({ booking, onClick }: DraggableBookingProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.booking_id,
    data: { booking }
  })

  const style: React.CSSProperties = {
  background: "#1e3f6e",
  borderRadius: "8px",
  padding: "8px 10px",
  marginBottom: "6px",
  cursor: "grab",
  opacity: isDragging ? 0.4 : 1,
  transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  userSelect: "none",
  border: "0.5px solid #2d5a9e",
  borderLeftWidth: "3px",
  borderLeftColor: "#60a5fa"
}

  return (
    <div className="booking-card"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
    >
      <div style={{ fontWeight: "500", fontSize: "13px", color: "#ffffff" }}>{booking.family_name}</div>
      <div style={{ fontSize: "11px", color: "#93c5fd", marginTop: "2px" }}>
        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
      </div>
      <div style={{ fontSize: "11px", color: "#60a5fa", marginTop: "1px" }}>{booking.service_type}</div>
    </div>
  )
}

interface DroppableCellProps {
  chapel: Chapel
  date: string
  children: React.ReactNode
  onClick: () => void
}

function DroppableCell({ chapel, date, children, onClick }: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${chapel.chapel_id}__${date}`,
    data: { chapel, date }
  })

  return (
    <td
      ref={setNodeRef}
      style={{
        ...cellStyle,
        cursor: "pointer",
        background: isOver ? "#1a3a5c" : undefined
      }}
      onClick={onClick}
    >
      {children}
    </td>
  )
}

function WeeklyGrid({ chapels, bookings, weekDates, onBookingCreated }: WeeklyGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ chapel: Chapel; date: string } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; chapel: Chapel } | null>(null)
  const [dragError, setDragError] = useState("")
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8
      }
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveBooking(null)

    if (!over) return

    const booking: Booking = active.data.current?.booking
    const { chapel, date } = over.data.current as { chapel: Chapel; date: string }

    if (booking.chapel_id === chapel.chapel_id && booking.date === date) return

    try {
      await api.put(`/bookings/${booking.booking_id}?updated_by=${booking.created_by}`, {
        chapel_id: chapel.chapel_id,
        family_name: booking.family_name,
        date: date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        service_type: booking.service_type,
        notes: booking.notes
      })
      setDragError("")
      onBookingCreated()
    } catch (err: any) {
      if (err.response?.status === 409) {
        setDragError(`Cannot move ${booking.family_name} — chapel already booked at that time`)
      } else {
        setDragError("Something went wrong moving the booking")
      }
      onBookingCreated()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={event => {
        setActiveBooking(event.active.data.current?.booking)
        document.body.style.overflow = "hidden"
      }}
      onDragEnd={event =>  {
        document.body.style.overflow = ""
        handleDragEnd(event)
      }}
      onDragCancel={() => {
        document.body.style.overflow = ""
        setActiveBooking(null)
      }}
    >
      {dragError && (
        <div style={errorStyle}>
          {dragError}
          <button
            onClick={() => setDragError("")}
            style={{ marginLeft: "12px", cursor: "pointer", background: "none", border: "none", color: "#c00", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
  <tr style={{ background: "var(--bg-secondary)" }}>
    <th style={{ 
      ...cellStyle, 
      color: "var(--text-secondary)", 
      fontSize: "12px",
      fontWeight: "500"
    }}>
      Chapel
    </th>
    {weekDates.map(date => {
      const isToday = date === new Date().toISOString().split("T")[0]
      return (
        <th key={date} style={{ 
          ...cellStyle,
          color: isToday ? "var(--accent-blue)" : "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: "500",
          borderBottom: isToday ? "2px solid var(--accent-blue)" : undefined
        }}>
          {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
          })}
          {isToday && <span style={{ fontSize: "10px", marginLeft: "4px" }}>✦</span>}
        </th>
      )
    })}
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
                    <DroppableCell
                      key={date}
                      chapel={chapel}
                      date={date}
                      onClick={() => setSelectedCell({ chapel, date })}
                    >
                      {cellBookings.length === 0 ? (
                        <span style={{ 
                          color: "var(--text-muted)",
                          fontSize: "18px",
                          display: "block",
                          textAlign: "center",
                          padding: "8px 0" 
                        }}>+</span>
                      ) : (
                        cellBookings.map(booking => (
                          <DraggableBooking
                            key={booking.booking_id}
                            booking={booking}
                            onClick={e => {
                              e.stopPropagation()
                              setSelectedBooking({ booking, chapel })
                            }}
                          />
                        ))
                      )}
                    </DroppableCell>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DragOverlay>
        {activeBooking && (
          <div style={{
            background: "var(--accent-blue-dim)",
            borderRadius: "8px",
            padding: "8px 10px",
            borderLeft: "3px solid var(--accent-blue)",
            minWidth: "120px"
          }}>
          <div style={{ fontWeight: "500", fontSize: "13px", color: "var(--text-primary)" }}>
            {activeBooking.family_name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--accent-blue)", marginTop: "2px" }}>
            {formatTime(activeBooking.start_time)} - {formatTime(activeBooking.end_time)}
          </div>
            </div>
        )}
        </DragOverlay>

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
    </DndContext>
  )
}

const cellStyle: React.CSSProperties = {
  border: "0.5px solid var(--border)",
  padding: "10px",
  verticalAlign: "top",
  minWidth: "130px",
  background: "var(--bg-secondary)"
}

const errorStyle: React.CSSProperties = {
  background: "var(--accent-red-dim)",
  border: "0.5px solid var(--accent-red)",
  borderRadius: "8px",
  padding: "10px 16px",
  marginBottom: "16px",
  color: "var(--accent-red)",
  display: "flex",
  alignItems: "center"
}

export default WeeklyGrid
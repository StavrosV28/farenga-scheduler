import { useState } from "react"
import type { Booking, Chapel } from "../types"
import BookingModal from "./BookingModal"
import BookingDetail from "./BookingDetail"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import api from "../api"

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
    background: "#e8f0fe",
    borderRadius: "6px",
    padding: "6px",
    marginBottom: "4px",
    cursor: "grab",
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
    >
      <div style={{ fontWeight: "bold" }}>{booking.family_name}</div>
      <div style={{ fontSize: "12px" }}>
        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
      </div>
      <div style={{ fontSize: "11px", color: "#666" }}>{booking.service_type}</div>
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
        background: isOver ? "#f0f7ff" : undefined
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
      onDragStart={event => setActiveBooking(event.active.data.current?.booking)}
      onDragEnd={handleDragEnd}
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
                    <DroppableCell
                      key={date}
                      chapel={chapel}
                      date={date}
                      onClick={() => setSelectedCell({ chapel, date })}
                    >
                      {cellBookings.length === 0 ? (
                        <span style={{ color: "#aaa" }}>Available</span>
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
            background: "#e8f0fe",
            borderRadius: "6px",
            padding: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "120px"
          }}>
            <div style={{ fontWeight: "bold" }}>{activeBooking.family_name}</div>
            <div style={{ fontSize: "12px" }}>
              {activeBooking.start_time.slice(0, 5)} - {activeBooking.end_time.slice(0, 5)}
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
  border: "1px solid #ddd",
  padding: "10px",
  verticalAlign: "top",
  minWidth: "130px"
}

const errorStyle: React.CSSProperties = {
  background: "#fee",
  border: "1px solid #fcc",
  borderRadius: "6px",
  padding: "10px 16px",
  marginBottom: "16px",
  color: "#c00",
  display: "flex",
  alignItems: "center"
}

export default WeeklyGrid
export type ServiceType = "Viewing" | "Memorial" | "Funeral"

export interface Chapel {
    chapel_id: string
    chapel_name: string
    capacity: number
    notes: string | null
}

export interface Booking {
    booking_id: string
    chapel_id: string
    created_by: string
    family_name: string
    date: string
    start_time: string
    end_time: string
    service_type: string
    notes: string | null
    created_at: string
}
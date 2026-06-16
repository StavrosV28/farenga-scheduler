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
    funeral_location: string
    internment: string
    notes: string | null
    created_at: string
}

export interface Contact {
    contact_id: string
    name: string
    role: string | null
    phone: string | null
    email: string | null
    company: string | null
    notes: string | null
    created_by: string
    created_at: string
}

export interface DailyBriefing {
    briefing_id: string
    briefing_date: string
    briefing_text: string
    created_by: string
    created_at: string
}
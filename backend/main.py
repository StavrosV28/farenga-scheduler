from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import date, timedelta
from pydantic import BaseModel
from fastapi import HTTPException

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BookingCreate(BaseModel):
    chapel_id: str
    family_name: str
    date: date
    start_time: str
    end_time: str
    service_type: str
    funeral_location: str | None = None
    funeral_date: str | None = None
    funeral_time: str | None = None
    internment: str | None = None
    notes: str | None = None
    created_by: str

class BookingUpdate(BaseModel):
    chapel_id: str
    family_name: str
    date: date
    start_time: str
    end_time: str
    service_type: str
    funeral_location: str | None = None
    funeral_date: str | None = None
    funeral_time: str | None = None
    internment: str | None = None
    notes: str | None = None

class BookingDelete(BaseModel):
    chapel_id: str
    family_name: str
    date: date
    start_time: str
    end_time: str
    service_type: str
    notes: str | None = None
    
class ContactCreate(BaseModel):
    name: str
    role: str | None = None
    phone: str | None = None
    email: str | None = None
    company: str | None = None
    notes: str | None = None
    created_by: str
    
class BriefingCreate(BaseModel):
    briefing_date: str
    briefing_text: str
    created_by: str

@app.get("/")
def root():
    return {"message": "Farenga Scheduler API is running"}

@app.post("/bookings")
def create_bookings(booking: BookingCreate):
    conflict = supabase.table("bookings") \
        .select("booking_id") \
        .eq("chapel_id", booking.chapel_id) \
        .eq("date", str(booking.date)) \
        .lt("start_time", booking.end_time) \
        .gt("end_time", booking.start_time) \
        .execute()
        
    if conflict.data:
        raise HTTPException(
        status_code=409,
        detail="This chapel is already booked during that time"
        )
    
    response = supabase.table("bookings").insert({
        "chapel_id": booking.chapel_id,
        "created_by": booking.created_by,
        "family_name": booking.family_name,
        "date": str(booking.date),
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "service_type": booking.service_type,
        "funeral_location": booking.funeral_location,
        "funeral_date": booking.funeral_date,
        "funeral_time": booking.funeral_time,
        "internment": booking.internment,
        "notes": booking.notes
    }).execute()
    
    return response.data[0]

@app.put("/bookings/{booking_id}")
def update_booking(booking_id: str, booking: BookingUpdate, updated_by: str):
    # read the old booking
    old = supabase.table("bookings") \
        .select("*") \
        .eq("booking_id", booking_id) \
        .execute()
    
    if not old.data:
        raise HTTPException(
            status_code = 404, 
            detail="Booking not found"
            )
    
    # conflict detection, excluding this booking itself
    conflict = supabase.table("bookings") \
        .select("booking_id") \
        .eq("chapel_id", booking.chapel_id) \
        .eq("date", str(booking.date)) \
        .lt("start_time", booking.end_time) \
        .gt("end_time", booking.start_time) \
        .neq("booking_id", booking_id) \
        .execute()
    
    if conflict.data:
        raise HTTPException(
            status_code=409,
            detail="This chapel is already booked for that time"
        )
    
    # write to audit log
    supabase.table("audit_log").insert({
        "booking_id": booking_id,
        "user_id": updated_by,
        "action": "Updated",
        "previous_values": old.data[0]
    }).execute()
    
    
    # apply the update
    response = supabase.table("bookings").update({
        "chapel_id": booking.chapel_id,
        "family_name": booking.family_name,
        "date": str(booking.date),
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "service_type": booking.service_type,
        "funeral_location": booking.funeral_location,
        "funeral_date": booking.funeral_date,
        "funeral_time": booking.funeral_time,
        "internment": booking.internment,
        "notes": booking.notes,
    }).eq("booking_id", booking_id).execute()
    
    return response.data[0]

@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: str, deleted_by: str):
    # read old booking
    old_booking = supabase.table("bookings") \
        .select("*") \
        .eq("booking_id", booking_id) \
        .execute()
        
    if not old_booking.data:
        raise HTTPException(
            status_code = 404,
            detail="Booking does not exist"
        )
    
    # write to audit log
    supabase.table("audit_log").insert({
        "booking_id": booking_id,
        "user_id": deleted_by,
        "action": "Deleted",
        "previous_values": old_booking.data[0]
    }).execute()
    
    # delete the booking
    supabase.table("bookings") \
        .delete() \
        .eq("booking_id", booking_id) \
        .execute()
    
    return {"message": "Booking deleted successfully"}


@app.get("/chapels")
def get_chapels():
    response = supabase.table("chapels") \
        .select("*") \
        .execute()
    
    return response.data

@app.get("/bookings/day")
def get_bookings_for_day(date: date):
    response = supabase.table("bookings") \
        .select("*, chapels(chapel_name)") \
        .eq("date", str(date)) \
        .order("start_time") \
        .execute()
    
    return response.data

@app.get("/contacts")
def get_contacts():
    response = supabase.table("contacts") \
        .select("*") \
        .order("name") \
        .execute()
    
    return response.data

@app.post("/contacts")
def create_contact(contact: ContactCreate):
    response = supabase.table("contacts").insert({
        "name": contact.name,
        "role": contact.role,
        "phone": contact.phone,
        "email": contact.email,
        "company": contact.company,
        "notes": contact.notes,
        "created_by": contact.created_by
    }).execute()
    
    return response.data[0]

@app.put("/contacts/{contact_id}")
def update_contact(contact_id: str, contact: ContactCreate):
    response = supabase.table("contacts") \
        .update({
              "name": contact.name,
            "role": contact.role,
            "phone": contact.phone,
            "email": contact.email,
            "company": contact.company,
            "notes": contact.notes
        }) \
        .eq("contact_id", contact_id) \
        .execute()
        
    return response.data[0]
        
@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: str):
    supabase.table("contacts") \
        .delete() \
        .eq("contact_id", contact_id) \
        .execute()
        
    return {"message": "Contact deleted successfully"}

@app.get("/briefings/{briefing_date}")
def get_briefing(briefing_date: date):
    response = supabase.table("daily_briefings") \
        .select("*") \
        .eq("briefing_date", str(briefing_date)) \
        .execute()
        
    if not response.data:
            return None
        
    return response.data[0]

@app.post("/briefings")
def create_briefing(briefing:BriefingCreate):
    response = supabase.table("daily_briefings").insert({
        "briefing_date": str(briefing.briefing_date),
        "briefing_text": briefing.briefing_text,
        "created_by": briefing.created_by
    }).execute()
    return response.data[0]

@app.put("/briefings/{briefing_date}")
def update_briefing(briefing_date: date, briefing: BriefingCreate):
    response = supabase.table("daily_briefings") \
        .update({
            "briefing_text": briefing.briefing_text
        }) \
        .eq("briefing_date", str(briefing_date)) \
        .execute()
    return response.data[0]

@app.get("/bookings/funerals")
def get_funeral_follows(funeral_date: date):
    response = supabase.table("bookings") \
        .select("*, chapels(chapel_name)") \
        .eq("funeral_date", str(funeral_date)) \
        .execute()
    return response.data

@app.get("/bookings/week")
def get_bookings_for_week(reference_date: date):
    start_of_week = reference_date - timedelta(days=(reference_date.weekday() + 1) % 7)
    end_of_week = start_of_week + timedelta(days=6)
        
    response = supabase.table("bookings") \
        .select("*") \
        .gte("date", str(start_of_week)) \
        .lte("date", str(end_of_week)) \
        .execute()

    return response.data
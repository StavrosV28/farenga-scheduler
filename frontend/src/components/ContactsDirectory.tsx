import { useEffect, useState } from "react"
import type { Contact } from "../types"
import api from "../api"
import { supabase } from "../supabase"

function ContactsDirectory() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  function fetchContacts() {
    setLoading(true)
    api.get("/contacts").then(res => {
      setContacts(res.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
        <button
          onClick={() => { setEditingContact(null); setShowForm(true) }}
          style={{
            background: "var(--accent-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer"
          }}
        >
          + Add contact
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No contacts found</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {filtered.map(contact => (
            <div
              key={contact.contact_id}
              className="booking-card"
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "12px",
                padding: "16px",
                border: "0.5px solid var(--border)",
                cursor: "pointer"
              }}
              onClick={() => setSelectedContact(contact)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--accent-blue-dim)",
                  border: "0.5px solid var(--accent-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "500",
                  color: "var(--accent-blue)",
                  flexShrink: 0
                }}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: "500", fontSize: "15px", color: "var(--text-primary)" }}>
                    {contact.name}
                  </div>
                  {contact.role && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {contact.role}
                    </div>
                  )}
                </div>
              </div>

              {contact.company && (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  {contact.company}
                </div>
              )}
              {contact.phone && (
                <div style={{ fontSize: "13px", color: "var(--accent-blue)" }}>
                  {contact.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={() => {
            setEditingContact(selectedContact)
            setSelectedContact(null)
            setShowForm(true)
          }}
          onDeleted={() => {
            setSelectedContact(null)
            fetchContacts()
          }}
        />
      )}

      {showForm && (
        <ContactForm
          existing={editingContact}
          onClose={() => { setShowForm(false); setEditingContact(null) }}
          onSaved={() => {
            setShowForm(false)
            setEditingContact(null)
            fetchContacts()
          }}
        />
      )}
    </div>
  )
}

interface ContactDetailProps {
  contact: Contact
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}

function ContactDetail({ contact, onClose, onEdit, onDeleted }: ContactDetailProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await api.delete(`/contacts/${contact.contact_id}`)
    onDeleted()
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="animate-fade-in-scale" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--accent-blue-dim)",
            border: "0.5px solid var(--accent-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: "500",
            color: "var(--accent-blue)"
          }}>
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: "500", color: "var(--text-primary)" }}>{contact.name}</h2>
            {contact.role && <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>{contact.role}</p>}
          </div>
        </div>

        {[
          { label: "Company", value: contact.company },
          { label: "Phone", value: contact.phone },
          { label: "Email", value: contact.email },
          { label: "Notes", value: contact.notes }
        ].map(({ label, value }) => value ? (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid var(--border)", fontSize: "14px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>{label}</span>
            <span style={{ color: label === "Phone" || label === "Email" ? "var(--accent-blue)" : "var(--text-primary)", textAlign: "right", maxWidth: "60%" }}>{value}</span>
          </div>
        ) : null)}

        {!confirming ? (
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button onClick={onEdit} style={editBtnStyle}>Edit</button>
            <button onClick={() => setConfirming(true)} style={deleteBtnStyle}>Delete</button>
            <button onClick={onClose} style={cancelBtnStyle}>Close</button>
          </div>
        ) : (
          <div style={{ marginTop: "24px" }}>
            <p style={{ color: "var(--accent-red)", fontWeight: "500", fontSize: "14px" }}>
              Are you sure you want to delete this contact?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleDelete} disabled={loading} style={deleteBtnStyle}>
                {loading ? "Deleting..." : "Yes, delete"}
              </button>
              <button onClick={() => setConfirming(false)} style={cancelBtnStyle}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ContactFormProps {
  existing: Contact | null
  onClose: () => void
  onSaved: () => void
}

function ContactForm({ existing, onClose, onSaved }: ContactFormProps) {
  const [name, setName] = useState(existing?.name ?? "")
  const [role, setRole] = useState(existing?.role ?? "")
  const [company, setCompany] = useState(existing?.company ?? "")
  const [phone, setPhone] = useState(existing?.phone ?? "")
  const [email, setEmail] = useState(existing?.email ?? "")
  const [notes, setNotes] = useState(existing?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!name) { setError("Name is required"); return }
    setLoading(true)
    setError("")

    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    try {
      if (existing) {
        await api.put(`/contacts/${existing.contact_id}`, {
          name, role: role || null, company: company || null,
          phone: phone || null, email: email || null,
          notes: notes || null, created_by: userId
        })
      } else {
        await api.post("/contacts", {
          name, role: role || null, company: company || null,
          phone: phone || null, email: email || null,
          notes: notes || null, created_by: userId
        })
      }
      onSaved()
    } catch {
      setError("Something went wrong, please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle}>
      <div className="animate-fade-in-scale" style={modalStyle}>
        <h2 style={{ marginTop: 0, fontWeight: "500", color: "var(--text-primary)" }}>
          {existing ? "Edit Contact" : "New Contact"}
        </h2>

        {error && (
          <div style={{ background: "var(--accent-red-dim)", border: "0.5px solid var(--accent-red)", borderRadius: "8px", padding: "10px", marginBottom: "16px", color: "var(--accent-red)", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {[
          { label: "Name *", value: name, set: setName, placeholder: "e.g. John Smith" },
          { label: "Role", value: role, set: setRole, placeholder: "e.g. Florist" },
          { label: "Company", value: company, set: setCompany, placeholder: "e.g. Smith Flowers" },
          { label: "Phone", value: phone, set: setPhone, placeholder: "e.g. 718-555-0100" },
          { label: "Email", value: email, set: setEmail, placeholder: "e.g. john@smithflowers.com" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              {label}
            </label>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} />
          </div>
        ))}

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional"
            style={{ height: "80px", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={loading} style={editBtnStyle}>
            {loading ? "Saving..." : existing ? "Save changes" : "Add contact"}
          </button>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.7)",
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
  maxHeight: "90vh",
  overflowY: "auto",
  border: "0.5px solid var(--border)"
}

const editBtnStyle: React.CSSProperties = {
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

const deleteBtnStyle: React.CSSProperties = {
  background: "var(--accent-red-dim)",
  color: "var(--accent-red)",
  border: "0.5px solid var(--accent-red)",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "15px",
  cursor: "pointer",
  flex: 1
}

const cancelBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "15px",
  cursor: "pointer",
  color: "var(--text-secondary)"
}

export default ContactsDirectory
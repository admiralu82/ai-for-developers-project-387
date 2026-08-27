const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const api = {
  // Event Types
  async getEventTypes() {
    const response = await fetch(`${API_BASE}/event-types`);
    if (!response.ok) throw new Error('Failed to fetch event types');
    return response.json();
  },

  async createEventType(data) {
    const response = await fetch(`${API_BASE}/event-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event type');
    }
    return response.json();
  },

  async deleteEventType(eventTypeId) {
    const response = await fetch(`${API_BASE}/event-types/${eventTypeId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete event type');
  },

  // Events
  async getEvents(date = null) {
    const url = date
      ? `${API_BASE}/events?date=${date}`
      : `${API_BASE}/events`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async createEvent(data) {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }
    return response.json();
  },

  async deleteEvent(eventId) {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete event');
  },

  // Available Slots
  async getAvailableSlots(date, eventTypeId) {
    const response = await fetch(
      `${API_BASE}/available-slots?date=${date}&eventTypeId=${eventTypeId}`
    );
    if (!response.ok) throw new Error('Failed to fetch available slots');
    return response.json();
  }
};

import type { FullConfig } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';

const defaultEventTypes = [
  { title: 'Консультация', durationMinutes: 60, color: '#C4612F' },
  { title: 'Короткая встреча', durationMinutes: 30, color: '#8B7355' },
  { title: 'Мастер-класс', durationMinutes: 120, color: '#A0826D' },
  { title: 'Собеседование', durationMinutes: 45, color: '#6B5744' },
];

type EventType = {
  eventTypeId: string;
  title: string;
  durationMinutes: number;
  color: string;
};

type Booking = { eventId: string };

function isSameAsDefaults(types: EventType[]) {
  if (types.length !== defaultEventTypes.length) return false;
  return defaultEventTypes.every((d) =>
    types.some(
      (t) =>
        t.title === d.title &&
        t.durationMinutes === d.durationMinutes &&
        t.color === d.color
    )
  );
}

export default async function globalSetup(config: FullConfig) {
  const events: Booking[] = await (await fetch(`${API_BASE}/events`)).json();
  for (const event of events) {
    await fetch(`${API_BASE}/events/${event.eventId}`, { method: 'DELETE' });
  }

  const types: EventType[] = await (
    await fetch(`${API_BASE}/event-types`)
  ).json();
  if (isSameAsDefaults(types)) return;

  for (const type of types) {
    await fetch(`${API_BASE}/event-types/${type.eventTypeId}`, {
      method: 'DELETE',
    });
  }
  for (const type of defaultEventTypes) {
    const response = await fetch(`${API_BASE}/event-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(type),
    });
    if (!response.ok) {
      throw new Error(`Failed to create default event type "${type.title}"`);
    }
  }
}

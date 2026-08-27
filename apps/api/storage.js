import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || __dirname;

const DB_FILE = join(DATA_DIR, 'db.json');
const EVENT_TYPES_FILE = join(DATA_DIR, 'event.json');

// Initialize storage files
async function ensureFile(path, defaultData) {
  if (!existsSync(path)) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

// Events storage
export async function getEvents() {
  await ensureFile(DB_FILE, []);
  const data = await readFile(DB_FILE, 'utf8');
  return JSON.parse(data);
}

export async function saveEvents(events) {
  await writeFile(DB_FILE, JSON.stringify(events, null, 2), 'utf8');
}

export async function addEvent(event) {
  const events = await getEvents();
  events.push(event);
  await saveEvents(events);
  return event;
}

export async function getEventById(eventId) {
  const events = await getEvents();
  return events.find(e => e.eventId === eventId);
}

export async function updateEvent(eventId, updatedEvent) {
  const events = await getEvents();
  const index = events.findIndex(e => e.eventId === eventId);
  if (index === -1) return null;
  events[index] = { ...updatedEvent, eventId };
  await saveEvents(events);
  return events[index];
}

export async function deleteEvent(eventId) {
  const events = await getEvents();
  const filtered = events.filter(e => e.eventId !== eventId);
  if (filtered.length === events.length) return false;
  await saveEvents(filtered);
  return true;
}

// Event types storage
export async function getEventTypes() {
  await ensureFile(EVENT_TYPES_FILE, []);
  const data = await readFile(EVENT_TYPES_FILE, 'utf8');
  return JSON.parse(data);
}

export async function saveEventTypes(eventTypes) {
  await writeFile(EVENT_TYPES_FILE, JSON.stringify(eventTypes, null, 2), 'utf8');
}

export async function addEventType(eventType) {
  const eventTypes = await getEventTypes();
  eventTypes.push(eventType);
  await saveEventTypes(eventTypes);
  return eventType;
}

export async function getEventTypeById(eventTypeId) {
  const eventTypes = await getEventTypes();
  return eventTypes.find(et => et.eventTypeId === eventTypeId);
}

export async function updateEventType(eventTypeId, updatedEventType) {
  const eventTypes = await getEventTypes();
  const index = eventTypes.findIndex(et => et.eventTypeId === eventTypeId);
  if (index === -1) return null;
  eventTypes[index] = { ...updatedEventType, eventTypeId };
  await saveEventTypes(eventTypes);
  return eventTypes[index];
}

export async function deleteEventType(eventTypeId) {
  const eventTypes = await getEventTypes();
  const filtered = eventTypes.filter(et => et.eventTypeId !== eventTypeId);
  if (filtered.length === eventTypes.length) return false;
  await saveEventTypes(filtered);
  return true;
}

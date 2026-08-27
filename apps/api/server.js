process.env.TZ = 'UTC';

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getEvents,
  addEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventTypes,
  addEventType,
  getEventTypeById,
  updateEventType,
  deleteEventType
} from './storage.js';
import { config, defaultEventTypes } from '../config.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize event types on startup
async function initializeEventTypes() {
  const eventTypes = await getEventTypes();
  if (eventTypes.length === 0) {
    for (const eventType of defaultEventTypes) {
      await addEventType(eventType);
    }
    console.log('Initialized default event types');
  }
}

// Utility functions
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function parseDate(dateString) {
  return new Date(dateString);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function isSameDayUTC(date1, date2) {
  return date1.getUTCFullYear() === date2.getUTCFullYear() &&
         date1.getUTCMonth() === date2.getUTCMonth() &&
         date1.getUTCDate() === date2.getUTCDate();
}

function hasTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

// GET /api/event-types
app.get('/api/event-types', async (req, res) => {
  try {
    const eventTypes = await getEventTypes();
    res.json(eventTypes);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch event types' });
  }
});

// POST /api/event-types
app.post('/api/event-types', async (req, res) => {
  try {
    const { title, durationMinutes, color } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.length < 5 || title.length > 100) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Title must be between 5 and 100 characters' 
      });
    }

    if (!durationMinutes || typeof durationMinutes !== 'number' || durationMinutes < 10 || durationMinutes > 120) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Duration must be between 10 and 120 minutes' 
      });
    }

    if (!color || typeof color !== 'string') {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Color is required' 
      });
    }

    const eventType = {
      eventTypeId: randomUUID(),
      title,
      durationMinutes,
      color
    };

    await addEventType(eventType);
    res.status(201).json(eventType);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create event type' });
  }
});

// GET /api/event-types/:eventId
app.get('/api/event-types/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventType = await getEventTypeById(eventId);

    if (!eventType) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Event type not found' 
      });
    }

    res.json(eventType);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch event type' });
  }
});

// PUT /api/event-types/:eventId
app.put('/api/event-types/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, durationMinutes, color } = req.body;

    // Validation
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Title is required' 
      });
    }

    if (!durationMinutes || typeof durationMinutes !== 'number' || durationMinutes < 10 || durationMinutes > 120) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Duration must be between 10 and 120 minutes' 
      });
    }

    if (!color || typeof color !== 'string') {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Color is required' 
      });
    }

    const updatedEventType = await updateEventType(eventId, { title, durationMinutes, color });

    if (!updatedEventType) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Event type not found' 
      });
    }

    res.json(updatedEventType);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update event type' });
  }
});

// DELETE /api/event-types/:eventId
app.delete('/api/event-types/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const deleted = await deleteEventType(eventId);

    if (!deleted) {
      return res.status(400).json({ 
        code: 'NOT_FOUND', 
        message: 'Event type not found' 
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to delete event type' });
  }
});

// GET /api/events
app.get('/api/events', async (req, res) => {
  try {
    let events = await getEvents();

    // Filter by date if provided
    if (req.query.date) {
      const filterDate = parseDate(req.query.date);
      if (!isValidDate(req.query.date)) {
        return res.status(400).json({ 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid date format' 
        });
      }
      events = events.filter(event => isSameDayUTC(parseDate(event.startTime), filterDate));
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch events' });
  }
});

// POST /api/events
app.post('/api/events', async (req, res) => {
  try {
    const { eventTypeId, startTime, comment } = req.body;

    // Validation
    if (!eventTypeId || typeof eventTypeId !== 'string') {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Event type ID is required' 
      });
    }

    if (!startTime || !isValidDate(startTime)) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Valid start time is required' 
      });
    }

    if (!comment || typeof comment !== 'string' || comment.length < 3) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Comment must be at least 3 characters' 
      });
    }

    // Check if event type exists
    const eventType = await getEventTypeById(eventTypeId);
    if (!eventType) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Event type not found' 
      });
    }

    const start = parseDate(startTime);
    const now = new Date();

    // Check if booking is within allowed time frame (UTC day boundary)
    const maxDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + config.maxBookingDaysAhead,
      23, 59, 59, 999
    ));

    if (start < now) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Cannot book in the past' 
      });
    }

    if (start > maxDate) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: `Cannot book more than ${config.maxBookingDaysAhead} days ahead` 
      });
    }

    // Check working hours (UTC)
    const hour = start.getUTCHours();
    if (hour < config.workingHours.start || hour >= config.workingHours.end) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: `Booking must be within working hours (${config.workingHours.start}:00 - ${config.workingHours.end}:00)` 
      });
    }

    const end = addMinutes(start, eventType.durationMinutes);

    // Check for overlaps
    const events = await getEvents();
    for (const existingEvent of events) {
      const existingStart = parseDate(existingEvent.startTime);
      const existingEventType = await getEventTypeById(existingEvent.eventTypeId);
      const existingEnd = addMinutes(existingStart, existingEventType.durationMinutes);

      if (hasTimeOverlap(start, end, existingStart, existingEnd)) {
        return res.status(409).json({ 
          code: 'TIME_CONFLICT', 
          message: 'Time slot is already booked' 
        });
      }
    }

    const event = {
      eventId: randomUUID(),
      eventTypeId,
      title: eventType.title,
      startTime: start.toISOString(),
      comment
    };

    await addEvent(event);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create event' });
  }
});

// GET /api/events/:eventId
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await getEventById(eventId);

    if (!event) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Event not found' 
      });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch event' });
  }
});

// PUT /api/events/:eventId
app.put('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { eventTypeId, title, startTime, comment } = req.body;

    // Validation
    if (!eventTypeId || typeof eventTypeId !== 'string') {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Event type ID is required' 
      });
    }

    if (!title || typeof title !== 'string' || title.length < 3) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Title must be at least 3 characters' 
      });
    }

    if (!startTime || !isValidDate(startTime)) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Valid start time is required' 
      });
    }

    if (!comment || typeof comment !== 'string' || comment.length < 3) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Comment must be at least 3 characters' 
      });
    }

    const normalizedStartTime = parseDate(startTime).toISOString();
    const updatedEvent = await updateEvent(eventId, { eventTypeId, title, startTime: normalizedStartTime, comment });

    if (!updatedEvent) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Event not found' 
      });
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update event' });
  }
});

// DELETE /api/events/:eventId
app.delete('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const deleted = await deleteEvent(eventId);

    if (!deleted) {
      return res.status(400).json({ 
        code: 'NOT_FOUND', 
        message: 'Event not found' 
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to delete event' });
  }
});

// GET /api/available-slots
app.get('/api/available-slots', async (req, res) => {
  try {
    const { date, eventTypeId } = req.query;

    // Validation
    if (!date || !isValidDate(date)) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Valid date is required' 
      });
    }

    if (!eventTypeId) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Event type ID is required' 
      });
    }

    const eventType = await getEventTypeById(eventTypeId);
    if (!eventType) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: 'Event type not found' 
      });
    }

    const targetDate = parseDate(date);
    const events = await getEvents();

    // Filter events for the target date (UTC)
    const dayEvents = events.filter(event => 
      isSameDayUTC(parseDate(event.startTime), targetDate)
    );

    // Generate all possible time slots
    const slots = [];
    const startHour = config.workingHours.start;
    const endHour = config.workingHours.end;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += config.timeSlotInterval) {
        const slotStart = new Date(Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          hour, minute, 0, 0
        ));
        const slotEnd = addMinutes(slotStart, eventType.durationMinutes);

        // Check if slot extends beyond working hours (UTC)
        if (slotEnd.getUTCHours() > endHour || 
            (slotEnd.getUTCHours() === endHour && slotEnd.getUTCMinutes() > 0)) {
          continue;
        }

        // Check for conflicts
        let available = true;
        for (const event of dayEvents) {
          const eventStart = parseDate(event.startTime);
          const eventEventType = await getEventTypeById(event.eventTypeId);
          const eventEnd = addMinutes(eventStart, eventEventType.durationMinutes);

          if (hasTimeOverlap(slotStart, slotEnd, eventStart, eventEnd)) {
            available = false;
            break;
          }
        }

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available
        });
      }
    }

    res.json(slots);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch available slots' });
  }
});

// Serve built frontend (production image) if it exists
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'web', 'dist');

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start server
initializeEventTypes().then(() => {
  app.listen(PORT, () => {
    console.log(`Calendar API server running on http://localhost:${PORT}`);
  });
});

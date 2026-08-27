import { test, expect } from '@playwright/test';
import {
  API_BASE,
  clearBookingsByComment,
  createBookingViaAPI,
  getEventTypeIdByTitle,
  isoDateDaysFromNow,
  projectBookingDate,
} from './helpers';

const CONSULTATION = 'Консультация';

const DEFAULT_EVENT_TYPES = [
  { title: 'Консультация', durationMinutes: 60, color: '#C4612F' },
  { title: 'Короткая встреча', durationMinutes: 30, color: '#8B7355' },
  { title: 'Мастер-класс', durationMinutes: 120, color: '#A0826D' },
  { title: 'Собеседование', durationMinutes: 45, color: '#6B5744' },
];

function toISODateTime(dateISO: string, timeHHMM: string): string {
  return new Date(`${dateISO}T${timeHHMM}:00Z`).toISOString();
}

test.describe('4.6 API-проверки (P0)', () => {
  test('API-01: список типов событий', async ({ request }) => {
    const response = await request.get(`${API_BASE}/event-types`);

    expect(response.status()).toBe(200);
    const types: {
      eventTypeId: string;
      title: string;
      durationMinutes: number;
      color: string;
    }[] = await response.json();
    expect(types).toHaveLength(DEFAULT_EVENT_TYPES.length);

    for (const type of types) {
      expect(typeof type.eventTypeId).toBe('string');
      expect(type.eventTypeId.length).toBeGreaterThan(0);
      expect(typeof type.title).toBe('string');
      expect(typeof type.durationMinutes).toBe('number');
      expect(typeof type.color).toBe('string');
    }

    for (const expected of DEFAULT_EVENT_TYPES) {
      expect(types).toContainEqual(expect.objectContaining(expected));
    }
  });

  test('API-02: создание бронирования', async ({ request }) => {
    const dateISO = projectBookingDate();
    const comment = 'Автотест API-02';
    await clearBookingsByComment(request, comment);

    const eventTypeId = await getEventTypeIdByTitle(request, CONSULTATION);
    const startTime = toISODateTime(dateISO, '09:00');

    const response = await request.post(`${API_BASE}/events`, {
      data: { eventTypeId, startTime, comment },
    });

    expect(response.status()).toBe(201);
    const event = await response.json();
    expect(typeof event.eventId).toBe('string');
    expect(event.eventId.length).toBeGreaterThan(0);
    expect(event.title).toBe(CONSULTATION);
    expect(event.startTime).toBe(startTime);
    expect(event.comment).toBe(comment);

    const check = await request.get(`${API_BASE}/events/${event.eventId}`);
    expect(check.status()).toBe(200);
    expect(await check.json()).toEqual(event);
  });

  test('API-03: валидация создания бронирования', async ({ request }) => {
    const dateISO = projectBookingDate();
    const eventTypeId = await getEventTypeIdByTitle(request, CONSULTATION);
    const validStartTime = toISODateTime(dateISO, '12:00');
    const validComment = 'Автотест API-03';

    const cases: {
      name: string;
      body: Record<string, unknown>;
      message?: string;
    }[] = [
      {
        name: 'нет eventTypeId',
        body: { startTime: validStartTime, comment: validComment },
      },
      {
        name: 'невалидный формат даты',
        body: {
          eventTypeId,
          startTime: 'invalid-date',
          comment: validComment,
        },
      },
      {
        name: 'комментарий короче 3 символов',
        body: { eventTypeId, startTime: validStartTime, comment: 'ab' },
      },
      {
        name: 'несуществующий тип события',
        body: {
          eventTypeId: 'no-such-event-type',
          startTime: validStartTime,
          comment: validComment,
        },
      },
      {
        name: 'дата в прошлом',
        body: {
          eventTypeId,
          startTime: toISODateTime(isoDateDaysFromNow(-1), '10:00'),
          comment: validComment,
        },
        message: 'Cannot book in the past',
      },
      {
        name: 'больше 14 дней вперёд',
        body: {
          eventTypeId,
          startTime: toISODateTime(isoDateDaysFromNow(15), '10:00'),
          comment: validComment,
        },
        message: 'Cannot book more than 14 days ahead',
      },
      {
        name: 'раньше 9:00',
        body: {
          eventTypeId,
          startTime: toISODateTime(dateISO, '08:00'),
          comment: validComment,
        },
        message: 'Booking must be within working hours',
      },
      {
        name: 'в 18:00 и позже',
        body: {
          eventTypeId,
          startTime: toISODateTime(dateISO, '18:00'),
          comment: validComment,
        },
        message: 'Booking must be within working hours',
      },
    ];

    for (const testCase of cases) {
      await test.step(testCase.name, async () => {
        const response = await request.post(`${API_BASE}/events`, {
          data: testCase.body,
        });
        expect(response.status()).toBe(400);
        const error = await response.json();
        expect(error.code).toBe('VALIDATION_ERROR');
        if (testCase.message) {
          expect(error.message).toContain(testCase.message);
        }
      });
    }

    const response = await request.get(`${API_BASE}/events?date=${dateISO}`);
    const events: { comment: string }[] = await response.json();
    expect(events.filter((event) => event.comment === validComment)).toHaveLength(0);
  });

  test('API-04: конфликт времени', async ({ request }) => {
    const dateISO = projectBookingDate();
    const comment = 'Автотест API-04';
    await clearBookingsByComment(request, comment);

    const eventTypeId = await getEventTypeIdByTitle(request, CONSULTATION);
    await createBookingViaAPI(request, {
      eventTypeId,
      dateISO,
      timeHHMM: '10:00',
      comment,
    });

    const conflict = await request.post(`${API_BASE}/events`, {
      data: {
        eventTypeId,
        startTime: toISODateTime(dateISO, '10:30'),
        comment,
      },
    });
    expect(conflict.status()).toBe(409);
    const error = await conflict.json();
    expect(error.code).toBe('TIME_CONFLICT');
    expect(error.message).toBe('Time slot is already booked');

    const boundary = await request.post(`${API_BASE}/events`, {
      data: {
        eventTypeId,
        startTime: toISODateTime(dateISO, '11:00'),
        comment,
      },
    });
    expect(boundary.status()).toBe(201);
  });
});

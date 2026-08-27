import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';

export const API_BASE = 'http://localhost:3000/api';

export function toISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoDateDaysFromNow(days: number): string {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days)
  );
  return toISODate(date);
}

const PROJECT_DATE_OFFSETS: Record<string, number> = {
  chromium: 1,
  firefox: 2,
  webkit: 3,
  api: 4,
};

export function projectBookingDate(): string {
  const projectName = test.info().project.name;
  return isoDateDaysFromNow(PROJECT_DATE_OFFSETS[projectName] ?? 1);
}

export function formatAppDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export async function clearBookingsByComment(
  request: APIRequestContext,
  comment: string
): Promise<void> {
  const response = await request.get(`${API_BASE}/events`);
  const events: { eventId: string; comment: string }[] = await response.json();
  for (const event of events) {
    if (event.comment === comment) {
      await request.delete(`${API_BASE}/events/${event.eventId}`);
    }
  }
}

export async function getEventTypeIdByTitle(
  request: APIRequestContext,
  title: string
): Promise<string> {
  const response = await request.get(`${API_BASE}/event-types`);
  const types: { eventTypeId: string; title: string }[] =
    await response.json();
  const type = types.find((t) => t.title === title);
  if (!type) {
    throw new Error(`Event type "${title}" not found`);
  }
  return type.eventTypeId;
}

export async function createBookingViaAPI(
  request: APIRequestContext,
  options: {
    eventTypeId: string;
    dateISO: string;
    timeHHMM: string;
    comment: string;
  }
): Promise<{ eventId: string }> {
  const startTime = new Date(
    `${options.dateISO}T${options.timeHHMM}:00Z`
  ).toISOString();
  const response = await request.post(`${API_BASE}/events`, {
    data: {
      eventTypeId: options.eventTypeId,
      startTime,
      comment: options.comment,
    },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to create booking: ${response.status()} ${await response.text()}`
    );
  }
  return response.json();
}

export async function setDateInput(
  locator: Locator,
  valueISO: string
): Promise<void> {
  await locator.evaluate((el, value) => {
    const input = el as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, valueISO);
}

export async function fillBookingForm(
  page: Page,
  options: {
    eventTypeTitle: string;
    dateISO: string;
    slotTime: string;
    comment: string;
  }
): Promise<void> {
  await page.goto('/');
  await page
    .getByRole('button', { name: new RegExp(options.eventTypeTitle) })
    .click();
  await setDateInput(page.locator('.date-input'), options.dateISO);
  await page
    .getByRole('button', { name: options.slotTime, exact: true })
    .click();
  await page.locator('.comment-input').fill(options.comment);
}

export async function submitBooking(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Забронировать' }).click();
  await expect(page.locator('.success-message')).toContainText(
    'Бронирование успешно создано'
  );
}

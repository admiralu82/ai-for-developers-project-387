import { test, expect } from './base';
import {
  API_BASE,
  clearBookingsByComment,
  createBookingViaAPI,
  getEventTypeIdByTitle,
  projectBookingDate,
  setDateInput,
} from './helpers';

const CONSULTATION = 'Консультация';

test.describe('4.3 Ограничения и негативные проверки бронирования (P0)', () => {
  test('SLOT-01: границы рабочих часов', async ({ page }) => {
    const dateISO = projectBookingDate();

    await page.goto('/');
    await page.getByRole('button', { name: new RegExp(CONSULTATION) }).click();
    await setDateInput(page.locator('.date-input'), dateISO);

    const expectedSlots: string[] = [];
    for (let hour = 9; hour <= 17; hour += 1) {
      const hh = String(hour).padStart(2, '0');
      expectedSlots.push(`${hh}:00`, `${hh}:30`);
    }
    expectedSlots.pop();

    const slots = page.locator('.slot-button');
    await expect(slots).toHaveCount(17);
    await expect(slots).toHaveText(expectedSlots);
    await expect(
      page.getByRole('button', { name: '08:30', exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: '17:30', exact: true })
    ).toHaveCount(0);
  });

  test('SLOT-02: занятый слот недоступен', async ({ page, request }) => {
    const dateISO = projectBookingDate();
    const comment = 'Автотест SLOT-02';
    await clearBookingsByComment(request, comment);

    const eventTypeId = await getEventTypeIdByTitle(request, CONSULTATION);
    await createBookingViaAPI(request, {
      eventTypeId,
      dateISO,
      timeHHMM: '13:00',
      comment,
    });

    await page.goto('/');
    await page.getByRole('button', { name: new RegExp(CONSULTATION) }).click();
    await setDateInput(page.locator('.date-input'), dateISO);

    const bookedSlot = page.getByRole('button', { name: '13:00', exact: true });
    await expect(bookedSlot).toBeDisabled();
    await expect(bookedSlot).toHaveClass(/unavailable/);
    await expect(page.locator('.slot-button.selected')).toHaveCount(0);

    await expect(
      page.getByRole('button', { name: '13:30', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: '14:00', exact: true })
    ).toBeEnabled();

    await expect(
      page.getByRole('heading', { name: '4. Ваши данные' })
    ).toBeHidden();
  });

  test('BOOK-05: конфликт времени при повторном бронировании', async ({
    page,
    request,
  }) => {
    const dateISO = projectBookingDate();
    const apiComment = 'Автотест BOOK-05 (API)';
    const uiComment = 'Автотест BOOK-05 (UI)';
    await clearBookingsByComment(request, apiComment);
    await clearBookingsByComment(request, uiComment);

    await page.goto('/');
    await page.getByRole('button', { name: new RegExp(CONSULTATION) }).click();
    await setDateInput(page.locator('.date-input'), dateISO);

    const slot = page.getByRole('button', { name: '15:00', exact: true });
    await expect(slot).toBeEnabled();

    const eventTypeId = await getEventTypeIdByTitle(request, CONSULTATION);
    await createBookingViaAPI(request, {
      eventTypeId,
      dateISO,
      timeHHMM: '15:00',
      comment: apiComment,
    });

    await slot.click();
    await page.locator('.comment-input').fill(uiComment);
    await page.getByRole('button', { name: 'Забронировать' }).click();

    await expect(page.locator('.error-message')).toContainText(
      'Time slot is already booked'
    );
    await expect(page.locator('.success-message')).toBeHidden();

    const response = await request.get(`${API_BASE}/events?date=${dateISO}`);
    const events: { comment: string }[] = await response.json();
    expect(events.filter((event) => event.comment === uiComment)).toHaveLength(
      0
    );
  });
});

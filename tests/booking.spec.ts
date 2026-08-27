import { test, expect } from './base';
import {
  API_BASE,
  clearBookingsByComment,
  fillBookingForm,
  formatAppDate,
  projectBookingDate,
  setDateInput,
  submitBooking,
} from './helpers';

test.describe('4.2 Бронирование (позитивные сценарии)', () => {
  test('BOOK-01: полный цикл бронирования', async ({ page, request }) => {
    const dateISO = projectBookingDate();
    const comment = 'Иван Тестов, +7 900 000-00-01';
    await clearBookingsByComment(request, comment);

    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: '2. Выберите дату' })
    ).toBeHidden();

    await page.getByRole('button', { name: /Консультация/ }).click();
    await expect(
      page.getByRole('heading', { name: '2. Выберите дату' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '3. Выберите время' })
    ).toBeHidden();

    await setDateInput(page.locator('.date-input'), dateISO);
    await expect(
      page.getByRole('heading', { name: '3. Выберите время' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '4. Ваши данные' })
    ).toBeHidden();

    await page.getByRole('button', { name: '09:00', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: '4. Ваши данные' })
    ).toBeVisible();

    const summary = page.locator('.booking-summary');
    await expect(summary).toContainText('Событие: Консультация');
    await expect(summary).toContainText(`Дата: ${formatAppDate(dateISO)}`);
    await expect(summary).toContainText('Время: 09:00 - 10:00');

    await page.locator('.comment-input').fill(comment);
    await page.getByRole('button', { name: 'Забронировать' }).click();

    await expect(page.locator('.success-message')).toContainText(
      'Бронирование успешно создано'
    );

    await expect(page.locator('.success-message')).toBeHidden({
      timeout: 15000,
    });
    await expect(
      page.getByRole('heading', { name: '2. Выберите дату' })
    ).toBeHidden();
    await expect(page.locator('.event-type-card.selected')).toHaveCount(0);
  });

  test('BOOK-02: бронирование видно в админ-панели', async ({
    page,
    request,
  }) => {
    const dateISO = projectBookingDate();
    const comment = 'Иван Тестов, +7 900 000-00-02';
    await clearBookingsByComment(request, comment);

    await fillBookingForm(page, {
      eventTypeTitle: 'Консультация',
      dateISO,
      slotTime: '11:00',
      comment,
    });
    await submitBooking(page);

    await page.goto('/admin');
    await setDateInput(page.locator('.date-input'), dateISO);

    const card = page.locator('.event-card', { hasText: comment });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Консультация');
    await expect(card.locator('.event-time')).toContainText('11:00');

    const cardCount = await page.locator('.event-card').count();
    await expect(page.locator('.stat-value')).toHaveText(String(cardCount));
  });

  test('BOOK-03: смена типа события перезагружает слоты', async ({ page }) => {
    const dateISO = projectBookingDate();

    await page.goto('/');
    await page.getByRole('button', { name: /Консультация/ }).click();
    await setDateInput(page.locator('.date-input'), dateISO);

    const slots = page.locator('.slot-button');
    await expect(slots).toHaveCount(17);

    await page.getByRole('button', { name: '10:00', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: '4. Ваши данные' })
    ).toBeVisible();

    await page.getByRole('button', { name: /Мастер-класс/ }).click();
    await expect(slots).toHaveCount(15);
    await expect(
      page.getByRole('button', { name: '16:00', exact: true })
    ).toBeVisible();
    await expect(page.locator('.slot-button.selected')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: '4. Ваши данные' })
    ).toBeHidden();
  });

  test('BOOK-04: бронирование слота в конце рабочего дня', async ({
    page,
    request,
  }) => {
    const dateISO = projectBookingDate();
    const comment = 'Иван Тестов, +7 900 000-00-04';
    await clearBookingsByComment(request, comment);

    await fillBookingForm(page, {
      eventTypeTitle: 'Короткая встреча',
      dateISO,
      slotTime: '17:30',
      comment,
    });
    await expect(page.locator('.booking-summary')).toContainText(
      'Время: 17:30 - 18:00'
    );
    await submitBooking(page);

    const response = await request.get(`${API_BASE}/events?date=${dateISO}`);
    const events: { title: string; comment: string }[] =
      await response.json();
    const created = events.filter((event) => event.comment === comment);
    expect(created).toHaveLength(1);
    expect(created[0].title).toBe('Короткая встреча');
  });
});

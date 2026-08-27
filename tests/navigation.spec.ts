import { test, expect } from './base';

const defaultEventTypes = [
  { title: 'Консультация', duration: '60 мин' },
  { title: 'Короткая встреча', duration: '30 мин' },
  { title: 'Мастер-класс', duration: '120 мин' },
  { title: 'Собеседование', duration: '45 мин' },
];

test.describe('4.1 Навигация и загрузка страниц', () => {
  test('NAV-01: открытие главной страницы', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Календарь бронирования');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Забронируйте время для встречи' })
    ).toBeVisible();
    await expect(
      page.getByText('Выберите тип события, дату и удобное время')
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '1. Выберите тип события' })
    ).toBeVisible();

    const cards = page.locator('.event-type-card');
    await expect(cards).toHaveCount(defaultEventTypes.length);

    for (const type of defaultEventTypes) {
      const card = page.getByRole('button', { name: new RegExp(type.title) });
      await expect(card).toBeVisible();
      await expect(card).toContainText(type.duration);
    }

    await expect(
      page.getByRole('link', { name: 'Панель администратора' })
    ).toBeVisible();
  });

  test('NAV-02: переход в админ-панель', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Панель администратора' }).click();

    await expect(page).toHaveURL('/admin');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Управление бронированиями' })
    ).toBeVisible();
  });

  test('NAV-03: переходы между админ-страницами и главной', async ({ page }) => {
    await page.goto('/admin');

    await page.getByRole('link', { name: 'Типы событий' }).click();
    await expect(page).toHaveURL('/admin/addevent');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Типы событий' })
    ).toBeVisible();

    await page.getByRole('link', { name: 'На главную' }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Забронируйте время для встречи' })
    ).toBeVisible();

    await page.goto('/admin/addevent');
    await page.getByRole('link', { name: 'Бронирования' }).click();
    await expect(page).toHaveURL('/admin');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Управление бронированиями' })
    ).toBeVisible();
  });
});

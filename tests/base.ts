import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page, context }, use) => {
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.abort()
    );
    await use(page);
  },
});

export { expect };

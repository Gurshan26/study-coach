import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixture = path.resolve(__dirname, '../fixtures/sample_lecture.pdf');

async function uploadDoc(page) {
  await page.goto('/upload');
  await page.locator('input[type="file"]').setInputFiles(fixture);
  await expect(page).toHaveURL(/\/quiz\?docId=/, { timeout: 120000 });
}

test('flashcard flip and review flow', async ({ page }) => {
  await uploadDoc(page);
  await page.goto('/flashcards');

  const card = page.getByRole('button', { name: 'Flashcard' });
  await expect(card).toBeVisible({ timeout: 30000 });
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Easy (5)' }).click();
  await expect(card).toBeVisible();

  await card.click();
  await page.getByRole('button', { name: 'Blackout (0)' }).click();

  for (let i = 0; i < 60; i += 1) {
    if (await page.getByText('Session Complete').isVisible()) {
      break;
    }
    await page.getByRole('button', { name: 'Good (3)' }).click();
    await page.waitForTimeout(150);
  }

  await expect(page.getByText('Session Complete')).toBeVisible({ timeout: 60000 });
  await page.goto('/dashboard');
  await expect(page.getByText('Study Streak')).toBeVisible();
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixture = path.resolve(__dirname, '../fixtures/sample_lecture.pdf');

test('upload flow completes and redirects to quiz', async ({ page }) => {
  await page.goto('/upload');
  await page.locator('input[type="file"]').setInputFiles(fixture);

  await expect(page.getByText('Parsing text')).toBeVisible();
  await expect(page.getByText('Extracting topics')).toBeVisible();
  await expect(page.getByText('Generating questions')).toBeVisible();
  await expect(page.getByText('Creating flashcards')).toBeVisible();

  await expect(page).toHaveURL(/\/quiz\?docId=/, { timeout: 120000 });

  await page.goto('/dashboard');
  await expect(page.getByText('sample_lecture.pdf').first()).toBeVisible({ timeout: 30000 });
});

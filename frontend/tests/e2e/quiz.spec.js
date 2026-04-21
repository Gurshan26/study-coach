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

test('quiz answers influence weak topics', async ({ page }) => {
  await uploadDoc(page);

  for (let i = 0; i < 80; i += 1) {
    if (await page.getByText('Quiz Complete').isVisible()) {
      break;
    }

    const before = await page.getByText(/Question \d+\/\d+/).first().textContent();
    const buttons = page.getByRole('button', { name: /Answer option/i });
    const count = await buttons.count();
    if (!count) {
      break;
    }
    await buttons.nth(i % 2).click();
    await page.waitForTimeout(250);

    if (await page.getByText('Quiz Complete').isVisible()) {
      break;
    }

    await page.waitForFunction(
      (previousLabel) => {
        const el = [...document.querySelectorAll('p')].find((node) =>
          /Question \d+\/\d+/.test(node.textContent || '')
        );
        return (el?.textContent || '') !== previousLabel;
      },
      before,
      { timeout: 3000 }
    );
  }

  await expect(page.getByText('Quiz Complete')).toBeVisible({ timeout: 30000 });

  await page.goto('/weak-topics');
  await expect(page.getByText(/Weakness:/).first()).toBeVisible({ timeout: 30000 });
});

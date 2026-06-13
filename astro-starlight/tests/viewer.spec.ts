import { test, expect } from '@playwright/test';

test('Vyasa Viewer can load catalog and view Bhagavad Gita (Vyasa)', async ({ page }) => {
  // Go to the viewer demo page
  await page.goto('/vyasa-docs/demos/viewer');

  // Verify catalog header is visible
  await expect(page.locator('.catalog-header h2')).toContainText('Project Vyasa Examples');

  // Wait for the catalog items to load and click on "Bhagavad Gita (Vyasa)"
  const bgCard = page.locator('.catalog-card', { hasText: 'Bhagavad Gita (Vyasa)' });
  await expect(bgCard).toBeVisible();
  
  // Click the card to view package
  await bgCard.click();

  // It should now render the workspace controls and an iframe
  await expect(page.locator('button', { hasText: '← Catalog' })).toBeVisible();
  
  const viewerFrame = page.frameLocator('iframe');

  // Let's verify the first verse rendered in the mula stream
  // We know the URN is urn:vyasa:bg:1:1
  const firstVerseWrapper = viewerFrame.locator('#urn\\:vyasa\\:bg\\:1\\:1');
  await expect(firstVerseWrapper).toBeVisible();
  
  // Inside the wrapper, there should be a .mula div containing specific text
  const mulaText = firstVerseWrapper.locator('.mula');
  await expect(mulaText).toBeVisible();
  await expect(mulaText).toContainText('धर्मक्षेत्रे');
});

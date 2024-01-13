import { test, expect } from '@playwright/test';

const TEXT = 'Text is going to be here';

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5174/');
});

test('text typing is handled', async ({ page }) => {
	const p = page.getByRole('textbox');
	await p.fill(TEXT);
	await expect(p).toContainText(TEXT);
});

test('new paragraph is created on ENTER', async ({ page }) => {
	const p1 = page.getByRole('textbox');
	await p1.fill('Y');
	await p1.press('Enter');
	const p2 = page.locator('*:focus');
	await p2.press('X');
	await expect(p2).toContainText('X');
	expect(await page.getByRole('textbox').count()).toBe(2);
});

test('new paragraph is not created when current one is empty', async ({ page }) => {
	const p = page.getByRole('textbox');
	await p.press('Enter');
	expect(await page.getByRole('textbox').count()).toBe(1);
});

[
	{ type: 'ul', starters: ['* ', '- '] },
	{ type: 'ol', starters: ['1. ', '1) ', '9. ', '9) '] },
].forEach(({ type, starters }) => {
	starters.forEach((starter) => {
		test(`paragraph becomes a 'ul li' item when user starts typing with "${starter}"`, async ({ page }) => {
			const p = page.getByRole('textbox');
			await p.pressSequentially(`${starter}${TEXT}`);
			const li = page.locator(`${type} li *:focus`);
			await expect(li).toContainText(TEXT);
		});
	});
});

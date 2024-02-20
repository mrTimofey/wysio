import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

const TEXT = 'Text is going to be here';

function repeat(times: number, fn: () => Promise<void>) {
	let promise = Promise.resolve();
	for (let i = 0; i < times; i += 1) {
		promise = promise.then(fn);
	}
	return promise;
}

async function createDocumentWithLevels(page: Page) {
	page.getByRole('textbox').focus();
	const input = page.locator('*:focus');

	await repeat(3, async () => {
		await input.fill(TEXT);
		await input.press('Enter');
	});

	await input.pressSequentially(`* ${TEXT}`);

	await repeat(2, async () => {
		await input.press('Enter');
		await input.fill(TEXT);
	});

	await repeat(2, async () => {
		await input.press('Enter');
		await input.press('Tab');

		await repeat(3, async () => {
			await input.press('Enter');
			await input.fill(TEXT);
		});
	});

	await input.press('Enter');

	await repeat(2, async () => {
		await input.press('Shift+Tab');
		await input.fill(TEXT);
		await input.press('Enter');
	});
}

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
		test(`paragraph becomes a '${type} li' item when user starts typing with "${starter}"`, async ({ page }) => {
			const p = page.getByRole('textbox');
			await p.pressSequentially(`${starter}${TEXT}`);
			const li = page.locator(`${type} li *:focus`);
			await expect(li).toContainText(TEXT);
		});
	});
});

test('paragraph is created when ENTER is pressed on empty list item', async ({ page }) => {
	const p = page.getByRole('textbox');
	await p.pressSequentially('* ');
	const li = page.locator('li *:focus');
	await li.press('Enter');
	const pAgain = page.locator('p *:focus');
	await pAgain.fill(TEXT);
	await expect(pAgain).toContainText(TEXT);
});

test.skip('test smth', async ({ page }) => {
	await createDocumentWithLevels(page);
	expect(true).toBe(true);
});

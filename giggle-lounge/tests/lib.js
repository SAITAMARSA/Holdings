/* Shared helpers for the browser tests: each "player" is its own browser context (own storage), phone-sized. */
const { chromium } = require('playwright');
const BASE = process.env.GL_URL || 'http://127.0.0.1:8099/';
async function launch() { return chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}); }
async function player(browser, name, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 412, height: 860 }, hasTouch: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|fonts\.g|404/.test(m.text())) page.errs.push('console: ' + m.text()); });
  page.name = name;
  return page;
}
async function setName(page, name) { await page.goto(BASE); await page.waitForSelector('.hero'); await page.fill('input[aria-label="Your name"]', name); }
async function createRoom(page) { await page.click('text=Start a room'); await page.waitForSelector('.code-big'); return (await page.textContent('.code-big')).trim(); }
async function joinRoom(page, code) { await page.fill('input[aria-label="Room code"]', code); await page.click('button:has-text("Join")'); await page.waitForSelector('.code-big'); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = { launch, player, setName, createRoom, joinRoom, sleep, BASE };

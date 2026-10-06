import { expect, test } from "@playwright/test";
import { completeSets, onboard, returningUser, seed, stored, USER_KEY } from "./helpers";

test.describe("onboarding", () => {
  test("beginner path saves partial progress, supports back, and uses plain language", async ({ page }) => {
    await page.goto("/welcome");
    await page.getByRole("button", { name: "Let's get started" }).click();
    await page.getByLabel("Your preferred name").fill("Sam");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: /I'm new to fitness/ }).click();

    // Refresh mid-way: we resume at the same question.
    await page.reload();
    await expect(page.getByRole("heading", { name: /What would you most like from training/ })).toBeVisible();

    // Back keeps the previous answer.
    await page.getByRole("button", { name: "Back to previous question" }).click();
    await expect(page.getByRole("button", { name: /I'm new to fitness/ })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /I'm new to fitness/ }).click();
    await page.getByRole("button", { name: /steady habit/ }).click();
    await page.getByRole("button", { name: /At home/ }).click();
    await page.getByRole("radio", { name: /^3/ }).click();
    await page.getByRole("radio", { name: /^30/ }).click();
    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.getByRole("radio", { name: /Mint/ }).click();
    await page.getByLabel(/Nickname/).fill("Mika");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Skipped")).toBeVisible();
    await page.getByRole("button", { name: "Build my plan" }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole("heading", { name: /Sam/ })).toBeVisible();
    await expect(page.getByText("MIKA", { exact: false }).first()).toBeVisible();
    await page.getByRole("button", { name: "Show exercises" }).click();
    await expect(page.locator("#today-exercises")).toContainText("rounds of");
    await expect(page.getByRole("button", { name: /Start workout/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Adjust today/ })).toBeVisible();
  });

  test("experienced path shows sets × reps, and detail level is editable separately", async ({ page }) => {
    await onboard(page, { experienced: true, skipLimitations: true });
    await page.getByRole("button", { name: "Show exercises" }).click();
    await expect(page.locator("#today-exercises")).toContainText("×");

    await page.goto("/settings");
    await page.getByRole("button", { name: "Simple", exact: true }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("button", { name: "I already train" })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/today");
    await page.getByRole("button", { name: "Show exercises" }).click();
    await expect(page.locator("#today-exercises")).toContainText("rounds of");
  });
});

test.describe("adjust today", () => {
  test("cancel changes nothing; today-only accept is previewed, explained and undoable", async ({ page }) => {
    await onboard(page);
    await page.getByRole("link", { name: /Adjust today/ }).click();
    await page.getByRole("button", { name: /I have less time/ }).click();
    await page.getByRole("radio", { name: "15 min" }).click();
    await page.getByRole("button", { name: /shorter version/ }).click();
    await expect(page.getByRole("heading", { name: "Here's the proposed change" })).toBeVisible();
    await expect(page.getByText("What's preserved")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose an option above" })).toBeDisabled();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText("Adjusted today")).toHaveCount(0);
    expect((await stored(page)).revisions).toHaveLength(0);

    await page.getByRole("link", { name: /Adjust today/ }).click();
    await page.getByRole("button", { name: /I have less time/ }).click();
    await page.getByRole("radio", { name: "15 min" }).click();
    await page.getByRole("button", { name: /shorter version/ }).click();
    await page.getByRole("radio", { name: /Just today/ }).check();
    await page.getByRole("button", { name: "Accept change" }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText("Adjusted today")).toBeVisible();

    await page.getByRole("button", { name: "What changed today?" }).click();
    await expect(page.getByText("Just for today.")).toBeVisible();
    await page.getByRole("button", { name: /Undo/ }).click();
    await expect(page.getByText("Adjusted today")).toHaveCount(0);
    const data = await stored(page);
    expect(data.revisions).toHaveLength(1); // history kept
    expect(data.overrides).toHaveLength(0);
    expect(data.profile!.sessionMinutes).toBe(30);
  });

  test("a lasting change updates future plans and is remembered (and visible) in coach memory", async ({ page }) => {
    await onboard(page);
    await page.getByRole("link", { name: /Adjust today/ }).click();
    await page.getByRole("button", { name: /I have less time/ }).click();
    await page.getByRole("radio", { name: "15 min" }).click();
    await page.getByRole("button", { name: /shorter version/ }).click();
    await page.getByRole("radio", { name: /Plan 15-minute sessions from now on/ }).check();
    await page.getByRole("button", { name: "Accept change" }).click();
    await expect(page).toHaveURL(/\/today$/);
    const data = await stored(page);
    expect(data.profile!.sessionMinutes).toBe(15);
    expect(data.plan!.version).toBe(2);
    expect(data.planHistory).toHaveLength(1);

    await page.goto("/coach/memory");
    await expect(page.getByText("Prefers sessions of about 15 minutes")).toBeVisible();
    await expect(page.getByText("From a lasting change you chose")).toBeVisible();
  });

  test("rest-day handling: making today a rest day reduces the weekly goal without counting as missed", async ({ page }) => {
    await onboard(page);
    const before = await page.getByText(/of \d+ planned sessions/).textContent();
    const plannedBefore = Number(before!.match(/of (\d+)/)![1]);
    await page.getByRole("link", { name: /Adjust today/ }).click();
    await page.getByRole("button", { name: /My schedule changed/ }).click();
    await page.getByRole("button", { name: /Make today a rest day/ }).click();
    await page.getByRole("button", { name: "Preview change" }).click();
    await page.getByRole("button", { name: "Accept change" }).click();
    await expect(page.getByRole("heading", { name: "Rest day" })).toBeVisible();
    await expect(page.getByText(/nothing counts as missed/)).toBeVisible();
    const plannedAfter = plannedBefore - 1;
    await expect(
      page.getByText(plannedAfter ? `0 of ${plannedAfter} planned sessions` : "No training days planned this week."),
    ).toBeVisible();
    await page.getByRole("link", { name: "Twin", exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole("progressbar", { name: new RegExp(`You: 0 of ${plannedAfter}`) })).toBeVisible();
  });
});

test.describe("workouts and rewards", () => {
  test("partial session survives refresh, is recorded accurately, and rewards are idempotent", async ({ page }) => {
    await onboard(page);
    await page.getByRole("button", { name: /Start workout/ }).click();
    await expect(page).toHaveURL(/\/workout$/);
    await completeSets(page, 2);

    await page.reload();
    await expect(page.getByText(/· 2\/\d+ sets/)).toBeVisible();

    // Navigating away keeps the session.
    await page.getByRole("button", { name: "Leave workout" }).click();
    await page.getByRole("button", { name: "Leave for now" }).click();
    await page.getByRole("link", { name: /Resume workout/ }).click();

    await page.getByRole("button", { name: "Finish early" }).click();
    await expect(page.getByText(/You completed 2 of \d+ sets/)).toBeVisible();
    await page.getByRole("radio", { name: "Too hard" }).click();
    await page.getByRole("button", { name: "Save workout" }).click();
    await expect(page).toHaveURL(/\/workout\/summary/);
    await expect(page.getByRole("heading", { name: "Every set counts!" })).toBeVisible();
    await expect(page.getByText(/Partly finished .*\(2\/\d+ sets\)/)).toBeVisible();

    let data = await stored(page);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].status).toBe("partial");
    expect(data.sessions[0].completedSets).toBe(2);
    expect(data.rewards.reduce((n, r) => n + r.points, 0)).toBe(15);

    // Finishing the full session later the same day tops up to the full value — once.
    await page.getByRole("link", { name: "Back to Today" }).click();
    await page.getByRole("button", { name: /Start again/ }).click();
    await expect(page.getByRole("button", { name: /^Complete set 1$/ })).toBeVisible();
    while ((await page.getByRole("button", { name: /^Complete set \d+$/ }).count()) > 0) {
      await completeSets(page, 1);
    }
    await expect(page.getByRole("heading", { name: /Workout complete/ })).toBeVisible();
    await page.getByRole("button", { name: "Save workout" }).click();
    await expect(page.getByText("Finished the session (top-up)")).toBeVisible();
    data = await stored(page);
    const sessionPoints = (d: typeof data) =>
      d.rewards.filter((r) => r.kind !== "weekly-goal").reduce((n, r) => n + r.points, 0);
    expect(sessionPoints(data)).toBe(20);
    expect(new Set(data.rewards.map((r) => r.key)).size).toBe(data.rewards.length);
    await page.goto("/today");
    await expect(page.getByText(/Done for today/)).toBeVisible();
    await page.goto("/workout");
    await expect(page.getByText("You've already finished today's workout")).toBeVisible();
    expect(sessionPoints(await stored(page))).toBe(20);

    await page.goto("/progress");
    await expect(page.getByText("Partly", { exact: true })).toBeVisible();
    await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  });

  test("pause freezes the rest timer and blocks set completion", async ({ page }) => {
    await onboard(page);
    await page.getByRole("button", { name: /Start workout/ }).click();
    await page.getByRole("button", { name: /^Complete set 1$/ }).click();
    await expect(page.getByRole("timer")).toBeVisible();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const t1 = await page.getByRole("timer").textContent();
    await page.waitForTimeout(1500);
    expect(await page.getByRole("timer").textContent()).toBe(t1);
    await expect(page.getByRole("button", { name: /^Complete set 2$/ })).toBeDisabled();
    await page.getByRole("button", { name: "Resume" }).first().click();
    await expect(page.getByRole("button", { name: /^Complete set 2$/ })).toBeEnabled();
  });

  test("return after a break: welcome-back check-in, eased session, comeback recognition, fresh baseline", async ({ page }) => {
    await seed(page, returningUser());
    await page.goto("/today");
    await expect(page.getByText(/You're back! I missed training with you, Riley/)).toBeVisible();
    await expect(page.getByText("Welcome back! Want an easier first session today?")).toBeVisible();
    await page.getByRole("button", { name: "Show me an easier session" }).click();
    await expect(page).toHaveURL(/\/adjust\?reason=returning/);
    await page.getByRole("button", { name: "2–4 weeks" }).click();
    await expect(page.getByRole("heading", { name: /Welcome back — an easier first session/ })).toBeVisible();
    await page.getByRole("checkbox", { name: /fresh progress baseline/ }).check();
    await page.getByRole("radio", { name: /Ease me back in this week/ }).check();
    await page.getByRole("button", { name: "Accept change" }).click();
    await expect(page.getByText("Adjusted today")).toBeVisible();

    await page.getByRole("button", { name: /Start workout/ }).click();
    await expect(page.getByRole("button", { name: /^Complete set 1$/ })).toBeVisible();
    while ((await page.getByRole("button", { name: /^Complete set \d+$/ }).count()) > 0) {
      await completeSets(page, 1);
    }
    await page.getByRole("button", { name: "Save workout" }).click();
    await expect(page.getByText(/Welcome back! Bo is so happy/)).toBeVisible();
    await expect(page.getByText("Welcome back!", { exact: true })).toBeVisible(); // reward row
    const data = await stored(page);
    expect(data.rewards.some((r) => r.kind === "comeback")).toBe(true);
    expect(data.ramp).not.toBeNull();
    expect(data.baselines).toHaveLength(1);

    await page.goto("/progress");
    await expect(page.getByText("Comeback", { exact: true })).toBeVisible();
    await expect(page.getByText(/before your baseline \(kept\)/).first()).toBeAttached();
  });
});

test.describe("coach", () => {
  test("memory is proposed, confirmed, editable and deletable", async ({ page }) => {
    await onboard(page);
    await page.goto("/coach");
    await page.getByLabel("Message your coach").fill("Remember that I prefer morning workouts");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(/Want me to remember/)).toBeVisible();
    await expect(page.getByText("Demo response").first()).toBeVisible();
    expect((await stored(page)).memory).toHaveLength(0); // not saved until confirmed
    await page.getByRole("button", { name: "Save to coach memory" }).click();
    await expect(page.getByText("Saved to memory")).toBeVisible();

    await page.getByRole("link", { name: /What I know/ }).click();
    await expect(page.getByText("I prefer morning workouts")).toBeVisible();
    await page.getByRole("button", { name: /Edit “I prefer morning workouts”/ }).click();
    await page.getByRole("textbox", { name: "Note" }).fill("Prefers training before work");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Prefers training before work")).toBeVisible();
    await page.getByRole("button", { name: /Delete “Prefers training before work”/ }).click();
    await expect(page.getByText("Nothing remembered yet")).toBeVisible();
  });

  test("pain interrupts with safety guidance and leads to a rest day with competition paused", async ({ page }) => {
    await onboard(page);
    await page.goto("/twin");
    await page.getByRole("radio", { name: /Friendly race/ }).click();
    await page.goto("/coach");
    await page.getByLabel("Message your coach").fill("my knee hurts when I squat");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Safety", { exact: true })).toBeVisible();
    await expect(page.getByText(/not something to push through/)).toBeVisible();
    await page.getByRole("link", { name: "Rest today" }).click();
    await page.getByRole("button", { name: /I feel pain or discomfort/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Your safety comes first")).toBeVisible();
    await page.getByRole("button", { name: "Accept change" }).click();
    await expect(page.getByRole("heading", { name: "Rest day" })).toBeVisible();
    await expect(page.getByText(/No racing today/)).toBeVisible();
  });

  test("quick actions return labelled demo replies with preview-only actions", async ({ page }) => {
    await onboard(page);
    await page.goto("/coach");
    await page.getByRole("button", { name: "Explain today's workout" }).click();
    await expect(page.getByText("Demo response")).toBeVisible();
    await page.getByRole("button", { name: "Help with meals" }).click();
    await page.getByRole("link", { name: "Set meal preferences" }).click();
    await expect(page).toHaveURL(/\/meals\/preferences$/);
  });
});

test.describe("progress, explore, meals", () => {
  test("new users see useful empty states, not invented progress", async ({ page }) => {
    await onboard(page);
    await page.goto("/progress");
    await expect(page.getByText("Your first review appears after your first workout")).toBeVisible();
    await expect(page.getByText("No sessions yet")).toBeVisible();
    await expect(page.getByText("Nothing to compare yet")).toBeVisible();
    await expect(page.getByText("No feedback yet")).toBeVisible();
    const data = await stored(page);
    expect(data.sessions).toEqual([]);
    expect(data.rewards).toEqual([]);
  });

  test("explore filters and saves sample listings without requesting location", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { geoCalls: number }).geoCalls = 0;
      const geo = navigator.geolocation;
      if (geo) {
        geo.getCurrentPosition = () => void ((window as unknown as { geoCalls: number }).geoCalls += 1);
        geo.watchPosition = () => ((window as unknown as { geoCalls: number }).geoCalls += 1);
      }
    });
    await onboard(page);
    await page.goto("/explore");
    await expect(page.getByText("Sample listings", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Events", exact: true }).click();
    await expect(page.getByText("3 sample listings")).toBeVisible();
    await page.getByRole("button", { name: "Save Hiking meetup" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Saved (1)" }).click();
    await expect(page.getByText("1 sample listing")).toBeVisible();
    await page.getByRole("button", { name: /Find options near me/ }).click();
    await expect(page.getByText("Local search isn't connected yet")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { geoCalls: number }).geoCalls)).toBe(0);
  });

  test("meal preferences filter suggestions, substitute safely and build a shopping list", async ({ page }) => {
    await onboard(page);
    await page.goto("/today");
    await expect(page.getByText(/Not yet tailored/)).toBeVisible();
    await page.goto("/meals/preferences");
    await page.getByRole("radio", { name: "Vegan" }).click();
    await page.getByRole("button", { name: "Soy", exact: true }).click();
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page).toHaveURL(/\/meals$/);
    await expect(page.getByText("Chicken thighs → Chickpeas (tinned)")).toBeVisible();
    await page.getByRole("button", { name: "Add Chickpea & spinach curry to this week" }).click();
    await expect(page.getByRole("region", { name: "Shopping list" })).toContainText("Chickpeas (tinned)");
    await expect(page.getByText("Estimated total")).toBeVisible();
    await page.goto("/today");
    await expect(page.getByText(/Not yet tailored/)).toHaveCount(0);
  });
});

test.describe("data, accessibility and layout", () => {
  test("demo data is separate from real data", async ({ page }) => {
    await page.goto("/welcome");
    await page.getByRole("button", { name: "Explore the demo first" }).click();
    await expect(page.getByText("Demo mode — sample data")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Jordan/ })).toBeVisible();
    expect(await page.evaluate((k) => window.localStorage.getItem(k), USER_KEY)).toBeNull();
    await page.getByRole("button", { name: "Exit demo" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await onboard(page, { name: "Real" });
    const data = await stored(page);
    expect(data.mode).toBe("user");
    expect(data.sessions).toEqual([]);
  });

  test("export downloads JSON and reset clears this browser's data", async ({ page }) => {
    await onboard(page);
    await page.goto("/settings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Export my data/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^infit-user-export-.*\.json$/);
    await page.getByRole("button", { name: /Reset everything/ }).click();
    await page.getByRole("button", { name: "Delete my data" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("unreadable stored data recovers gracefully with an explanation", async ({ page }) => {
    await page.addInitScript((key) => {
      if (!window.sessionStorage.getItem("seeded")) {
        window.localStorage.setItem(key, "{not json");
        window.sessionStorage.setItem("seeded", "1");
      }
    }, USER_KEY);
    await page.goto("/");
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByText(/couldn't be read/)).toBeVisible();
    expect(await page.evaluate((k) => window.localStorage.getItem(`${k}:corrupt-backup`), USER_KEY)).not.toBeNull();
  });

  test("keyboard-only onboarding with visible focus", async ({ page }) => {
    await page.goto("/welcome");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.getByRole("button", { name: "Let's get started" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Your preferred name")).toBeFocused();
    await page.keyboard.type("Kai");
    await page.keyboard.press("Enter");
    // Focus moves to the new question; Tab reaches the first option.
    await expect(page.getByRole("heading", { name: /Which sounds more like you/ })).toBeFocused();
    await page.keyboard.press("Tab");
    const option = page.getByRole("button", { name: /I'm new to fitness/ });
    await expect(option).toBeFocused();
    const outline = await option.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: /What would you most like/ })).toBeVisible();
  });

  test("reduced motion: OS preference and in-app setting both stop animation", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/welcome");
    const anim = await page.locator("svg g[class*='animate-bob']").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    await ctx.close();

    const ctx2 = await browser.newContext({ reducedMotion: "no-preference" });
    const page2 = await ctx2.newPage();
    await onboard(page2);
    await page2.goto("/settings");
    await page2.getByRole("checkbox", { name: /Reduce motion/ }).check();
    await expect(page2.locator("html")).toHaveClass(/reduce-motion/);
    await page2.getByRole("link", { name: "Today", exact: true }).filter({ visible: true }).first().click();
    const duration = await page2
      .locator("svg g[class*='animate-bob']")
      .first()
      .evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
    await ctx2.close();
  });

  test("navigation adapts to mobile and desktop", async ({ page }, testInfo) => {
    await onboard(page);
    const navs = page.getByRole("navigation", { name: "Main" });
    if (testInfo.project.name === "desktop") {
      await expect(navs.first()).toBeVisible(); // sidebar
      await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();
    } else {
      await expect(navs.last()).toBeVisible(); // bottom tab bar
    }
    for (const name of ["Twin", "Coach", "Progress", "Explore", "Today"]) {
      await page.getByRole("link", { name, exact: true }).filter({ visible: true }).first().click();
      await expect(page.getByRole("link", { name, exact: true }).filter({ visible: true }).first()).toHaveAttribute("aria-current", "page");
    }
    // No horizontal overflow on any main screen.
    for (const path of ["/today", "/twin", "/coach", "/progress", "/explore", "/meals", "/settings", "/adjust"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });
});

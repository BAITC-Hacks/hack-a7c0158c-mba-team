import { test, expect, type APIRequestContext } from "@playwright/test";

async function login(request: APIRequestContext) {
  const registration = await request.post("/api/auth/request", { data: {
    mode: "register", method: "email", identifier: `demo-${crypto.randomUUID()}@example.com`, password: "DemoPassword123!",
  } });
  expect(registration.status()).toBe(200);
  const result = await registration.json();
  expect(result.devCode).toMatch(/^\d{6}$/);
  const verification = await request.post("/api/auth/verify", { data: { token: result.verificationToken, code: result.devCode } });
  expect(verification.status()).toBe(200);
}

test("clarify requires login, validates input, uses fallback and limits requests", async ({ request }) => {
  const input = { description: "Нужно улучшить обработку заявок магазина.", industry: "Торговля" };
  expect((await request.post("/api/clarify", { data: input })).status()).toBe(401);
  await login(request);
  for (const data of [null, [], { description: "мало" }, { description: "x".repeat(5001) }]) {
    expect((await request.post("/api/clarify", { data: JSON.stringify(data), headers: { "Content-Type": "application/json" } })).status()).toBe(400);
  }
  expect((await request.post("/api/clarify", { data: { description: "x".repeat(25000) } })).status()).toBe(413);
  for (let i = 0; i < 5; i++) {
    const response = await request.post("/api/clarify", { data: input });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.mode).toBe("fallback");
    expect(result.questions).toHaveLength(3);
    expect(result.suggestedFields.dataMaterials).toBe("");
  }
  const limited = await request.post("/api/clarify", { data: input, headers: { "x-forwarded-for": "203.0.113.99" } });
  expect(limited.status()).toBe(429);
  expect(limited.headers()["retry-after"]).toBe("60");
});

test("registration → creation → live rating → catalog → proposal → selection", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/business/new");
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByRole("button", { name: "Регистрация", exact: true }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(`browser-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Пароль", { exact: true }).fill("DemoPassword123!");
  await page.getByRole("button", { name: "Зарегистрироваться", exact: true }).click();
  const codeText = await page.locator(".task-notice").innerText();
  await page.getByLabel("Код подтверждения", { exact: true }).fill(codeText.match(/\d{6}/)![0]);
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await expect(page.getByText("Аккаунт создан.", { exact: true })).toBeVisible();
  await page.goto("/business/new");
  await page.getByLabel("Кратко опишите потребность или проблему").fill("Нужно ускорить обработку заявок магазина.");
  await page.getByRole("combobox", { name: "Тема или отрасль" }).selectOption("Розничная торговля");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText("Демо-режим", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Сформировать карточку" }).click();
  const preview = page.getByRole("complementary", { name: "Предпросмотр готовности" });
  await expect(preview.getByRole("heading")).toHaveText("Готовность: 10/100 · Черновик");
  const title = `Заявки магазина ${Date.now()}`;
  await page.getByLabel("Название задачи", { exact: true }).fill(title);
  const fields = {
    "Контекст": "Операторы вручную сортируют входящие обращения.",
    "Пользователи": "Операторы магазина.",
    "Данные и материалы": "Обезличенные примеры заявок за месяц.",
    "Ожидаемый результат": "Прототип классификации обращений.",
    "Критерии успеха": "Проверить точность на отложенной выборке.",
    "Ограничения": "Срок 3 недели, без персональных данных.",
    "Контакт со стороны бизнеса": "Руководитель поддержки.",
    "Формат взаимодействия": "Еженедельная встреча.",
  };
  for (const [label, value] of Object.entries(fields)) await page.getByRole("textbox", { name: label, exact: true }).fill(value);
  await expect(preview.getByRole("heading")).toHaveText("Готовность: 100/100 · Приоритетная");
  await page.getByRole("textbox", { name: "Данные и материалы", exact: true }).fill("");
  await expect(preview.getByRole("heading")).toHaveText("Готовность: 80/100 · Готовая");
  await expect(preview.getByText('Заполните поле «Данные и материалы» (+20 баллов).')).toBeVisible();
  await page.getByRole("textbox", { name: "Данные и материалы", exact: true }).fill(fields["Данные и материалы"]);
  await preview.screenshot({ path: "test-results/readiness-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await preview.screenshot({ path: "test-results/readiness-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Подтвердить и опубликовать" }).click();
  await expect(page.getByRole("heading", { name: "Задача опубликована" })).toBeVisible();
  const responsesPath = (await page.getByRole("link", { name: "Посмотреть отклики" }).getAttribute("href"))!;
  await page.getByRole("link", { name: "Перейти в каталог" }).click();
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title }) });
  await expect(card.getByText("100/100")).toBeVisible();
  const delivery = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Понятнее показывать статус доставки" }) });
  await expect(delivery.getByText("70/100")).toBeVisible();
  await card.getByRole("link", { name: "Откликнуться" }).click();
  await page.getByLabel("Название команды", { exact: true }).fill("Команда проверки");
  await page.getByLabel("Идея решения", { exact: true }).fill("Классификатор заявок по темам.");
  await page.getByLabel("План работы", { exact: true }).fill("Разметить примеры и проверить прототип.");
  await page.getByLabel("Предполагаемый срок", { exact: true }).fill("3 недели");
  await page.getByRole("button", { name: "Отправить отклик", exact: true }).click();
  await page.getByRole("link", { name: "Проверить статус" }).click();
  await expect(page.getByRole("heading", { name: "Отклик рассматривается" })).toBeVisible();
  await expect(page).toHaveURL(/\/responses\/[^/]+$/);
  const statusUrl = page.url();
  const business = await context.newPage();
  await business.goto(responsesPath);
  await business.getByRole("button", { name: "Выбрать команду" }).click();
  await expect(page.getByRole("heading", { name: "Ваше предложение выбрано" })).toBeVisible();
  await page.goto(statusUrl);
  await expect(page.getByRole("heading", { name: "Ваше предложение выбрано" })).toBeVisible();
  expect(errors).toEqual([]);
});

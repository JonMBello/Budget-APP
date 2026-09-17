import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3003";
const credentials = {
  email: "notifications@example.test",
  password: "integration-only-password",
};

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("PWA, Web Push and Reminders (FE-09)", () => {
  test.describe.configure({ mode: "serial" });

  const testEndpoint = "https://push.example.test/v1/subscription-device-1";

  test("verifies Web App Manifest, Service Worker and notification settings page", async ({
    request,
  }) => {
    // 1. Service Worker file is served
    const swRes = await request.get("/app/sw.js");
    expect(swRes.status()).toBe(200);
    const swText = await swRes.text();
    expect(swText).toContain("CACHE_NAME");
    expect(swText).toContain("budget-reminder");

    // 2. Notification settings page loads for authenticated user
    await login(request);
    const pageRes = await request.get("/app/settings/notifications");
    expect(pageRes.status()).toBe(200);
    const pageHtml = await pageRes.text();
    expect(pageHtml).toContain("PWA y Notificaciones");
  });

  test("retrieves VAPID public key and registers device push subscription", async ({
    request,
  }) => {
    await login(request);

    // 1. Get public key (browsers do not send Origin header on same-origin GET)
    const keyRes = await request.get("/app/bff/notifications/web-push/public-key");
    expect(keyRes.status()).toBe(200);
    const keyData = await keyRes.json();
    expect(typeof keyData.publicKey).toBe("string");
    expect(keyData.publicKey.length).toBeGreaterThan(10);

    // 2. Subscribe device
    const subRes = await request.post("/app/bff/notifications/web-push/subscribe", {
      headers: { Origin: origin },
      data: {
        endpoint: testEndpoint,
        keys: {
          p256dh: "BNcR1234567890abcdef",
          auth: "authsecret1234567890",
        },
        userAgent: "Playwright Test Runner",
      },
    });
    expect([200, 201]).toContain(subRes.status());
  });

  test("sends test notifications across channels with detailed breakdown", async ({
    request,
  }) => {
    await login(request);

    // 1. Push channel test
    const pushTestRes = await request.post("/app/bff/notifications/test", {
      headers: { Origin: origin },
      data: {
        channel: "WEB_PUSH",
        title: "Aviso de prueba push",
        message: "Verificando entrega push",
      },
    });
    expect(pushTestRes.status()).toBe(200);
    const pushData = await pushTestRes.json();
    expect(pushData.success).toBe(true);
    expect(pushData.channel).toBe("WEB_PUSH");
    expect(pushData.pushResult.sent).toBe(true);
    expect(pushData.pushResult.recipientCount).toBeGreaterThanOrEqual(1);
    expect(pushData.emailResult.sent).toBe(false);

    // 2. Email channel test
    const emailTestRes = await request.post("/app/bff/notifications/test", {
      headers: { Origin: origin },
      data: {
        channel: "EMAIL",
        title: "Aviso de prueba email",
      },
    });
    expect(emailTestRes.status()).toBe(200);
    const emailData = await emailTestRes.json();
    expect(emailData.success).toBe(true);
    expect(emailData.channel).toBe("EMAIL");
    expect(emailData.emailResult.sent).toBe(true);
    expect(emailData.emailResult.recipientEmail).toBe("notifications@example.test");
    expect(emailData.pushResult.sent).toBe(false);

    // 3. ALL channels test
    const allTestRes = await request.post("/app/bff/notifications/test", {
      headers: { Origin: origin },
      data: {
        channel: "ALL",
      },
    });
    expect(allTestRes.status()).toBe(200);
    const allData = await allTestRes.json();
    expect(allData.success).toBe(true);
    expect(allData.pushResult.sent).toBe(true);
    expect(allData.emailResult.sent).toBe(true);
  });

  test("unsubscribes device from web push notifications", async ({ request }) => {
    await login(request);

    const unsubRes = await request.delete(
      "/app/bff/notifications/web-push/unsubscribe",
      {
        headers: { Origin: origin },
        data: {
          endpoint: testEndpoint,
        },
      },
    );
    expect(unsubRes.status()).toBe(200);
    const unsubData = await unsubRes.json();
    expect(unsubData.success).toBe(true);

    // Verifies recipient count drops back to 0
    const pushCheckRes = await request.post("/app/bff/notifications/test", {
      headers: { Origin: origin },
      data: { channel: "WEB_PUSH" },
    });
    expect(pushCheckRes.status()).toBe(200);
    const checkData = await pushCheckRes.json();
    expect(checkData.pushResult.recipientCount).toBe(0);
  });

  test("executes manual reminder evaluation diagnostics", async ({ request }) => {
    await login(request);

    const triggerRes = await request.post(
      "/app/bff/notifications/trigger-reminders",
      {
        headers: { Origin: origin },
      },
    );
    expect(triggerRes.status()).toBe(200);
    const triggerData = await triggerRes.json();
    expect(triggerData.success).toBe(true);
    expect(typeof triggerData.remindersProcessed).toBe("number");
    expect(triggerData.timestamp).toBeDefined();
  });
});

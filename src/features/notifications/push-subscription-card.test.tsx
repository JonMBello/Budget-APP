import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PushSubscriptionCard } from "./push-subscription-card";
import { urlBase64ToUint8Array } from "./use-push-subscription";

describe("urlBase64ToUint8Array", () => {
  it("converts a base64url string to Uint8Array", () => {
    const raw = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Skv6";
    const arr = urlBase64ToUint8Array(raw);
    expect(arr).toBeInstanceOf(Uint8Array);
    expect(arr.length).toBeGreaterThan(0);
  });
});

describe("PushSubscriptionCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders unsupported banner in test jsdom environment without serviceWorker/PushManager", () => {
    render(<PushSubscriptionCard />);

    expect(
      screen.getByRole("heading", { name: /notificaciones web push en este dispositivo/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("push-status-badge")).toHaveTextContent(/inactivo/i);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /no soporta la api de notificaciones web push/i,
    );
  });
});

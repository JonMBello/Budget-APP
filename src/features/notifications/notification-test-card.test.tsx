import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationTestCard } from "./notification-test-card";

describe("NotificationTestCard", () => {
  const userEmail = "testuser@example.test";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with user email and does NOT trigger test on mount", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<NotificationTestCard userEmail={userEmail} />);

    expect(screen.getByText(userEmail)).toBeInTheDocument();
    expect(
      screen.getByText(/canales configurados por el servidor/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar notificación de prueba/i })).toBeInTheDocument();

    // Verification: never called on mount
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends test request and renders pushResult and emailResult", async () => {
    const mockResult = {
      success: true,
      channel: "ALL",
      pushResult: {
        sent: true,
        recipientCount: 2,
      },
      emailResult: {
        sent: true,
        recipientEmail: userEmail,
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    } as Response);

    render(<NotificationTestCard userEmail={userEmail} />);

    const sendBtn = screen.getByTestId("send-test-btn");
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByTestId("notification-test-results")).toBeInTheDocument();
    });

    expect(screen.getByTestId("push-result-box")).toBeInTheDocument();
    expect(screen.getByText(/dispositivos destinatarios: 2/i)).toBeInTheDocument();

    expect(screen.getByTestId("email-result-box")).toBeInTheDocument();
    expect(screen.getByText(`Destinatario: ${userEmail}`)).toBeInTheDocument();
  });

  it("handles failure when test endpoint returns error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Servicio SMTP no disponible" }),
    } as Response);

    render(<NotificationTestCard userEmail={userEmail} />);

    fireEvent.click(screen.getByTestId("send-test-btn"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByText(/servicio smtp no disponible/i)).toBeInTheDocument();
  });
});

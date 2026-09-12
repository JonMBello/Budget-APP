import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TriggerRemindersCard } from "./trigger-reminders-card";

describe("TriggerRemindersCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders explanation of server schedule and does NOT trigger on mount", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<TriggerRemindersCard />);

    expect(
      screen.getByRole("heading", { name: /evaluación de recordatorios/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/08:00/i)).toBeInTheDocument();
    expect(screen.getByText(/0 a 3 días/i)).toBeInTheDocument();

    const triggerBtn = screen.getByTestId("trigger-reminders-btn");
    expect(triggerBtn).toBeInTheDocument();

    // Critical requirement: never triggers on mount
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("triggers evaluation on user action and displays processed count", async () => {
    const mockResult = {
      success: true,
      remindersProcessed: 4,
      timestamp: "2026-09-06T08:00:00.000Z",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    } as Response);

    render(<TriggerRemindersCard />);

    const triggerBtn = screen.getByTestId("trigger-reminders-btn");
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByTestId("trigger-reminders-result")).toBeInTheDocument();
    });

    expect(screen.getByText(/recordatorios procesados: 4/i)).toBeInTheDocument();
  });

  it("handles failure when trigger reminders returns error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Error interno al evaluar obligaciones" }),
    } as Response);

    render(<TriggerRemindersCard />);

    fireEvent.click(screen.getByTestId("trigger-reminders-btn"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/error interno al evaluar obligaciones/i),
    ).toBeInTheDocument();
  });
});

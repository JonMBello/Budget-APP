import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PwaInstallGuide } from "./pwa-install-guide";

describe("PwaInstallGuide", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders PWA installation guide with platform tabs", () => {
    render(<PwaInstallGuide />);

    expect(
      screen.getByRole("heading", { name: /instalación como app/i }),
    ).toBeInTheDocument();

    const iosTab = screen.getByRole("tab", { name: /iphone \/ ipad/i });
    const macTab = screen.getByRole("tab", { name: /mac \(safari \/ dock\)/i });
    const otherTab = screen.getByRole("tab", { name: /android \/ chrome/i });

    expect(iosTab).toBeInTheDocument();
    expect(macTab).toBeInTheDocument();
    expect(otherTab).toBeInTheDocument();
  });

  it("switches tabs and displays platform-specific instructions", () => {
    render(<PwaInstallGuide />);

    const macTab = screen.getByRole("tab", { name: /mac \(safari \/ dock\)/i });
    fireEvent.click(macTab);

    expect(screen.getByTestId("guide-mac")).toBeInTheDocument();
    expect(screen.getAllByText(/añadir al dock/i).length).toBeGreaterThan(0);

    const otherTab = screen.getByRole("tab", { name: /android \/ chrome/i });
    fireEvent.click(otherTab);

    expect(screen.getByTestId("guide-other")).toBeInTheDocument();
    expect(screen.getByText(/instalar budget/i)).toBeInTheDocument();
  });

  it("shows installed badge when running in standalone mode", async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<PwaInstallGuide />);

    await waitFor(() => {
      expect(screen.getByTestId("pwa-installed-badge")).toBeInTheDocument();
    });
    expect(screen.getByText(/ya estás usando budget en modo pantalla completa/i)).toBeInTheDocument();
  });
});

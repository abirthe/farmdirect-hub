// Tests for parcel telemetry HUD and map drawing calculations.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParcelTelemetryHud } from "@/components/map/ParcelTelemetryHud";

describe("ParcelTelemetryHud Component", () => {
  const samplePlot: [number, number][] = [
    [24.8465, 89.3777],
    [24.8555, 89.3777],
    [24.8555, 89.3876],
    [24.8465, 89.3876],
  ];

  it("renders null when fewer than 3 coordinates are provided", () => {
    const { container } = render(<ParcelTelemetryHud coords={[]} />);
    expect(container.firstChild).toBeNull();

    const { container: container2 } = render(
      <ParcelTelemetryHud coords={[[24.8465, 89.3777], [24.8555, 89.3777]]} />
    );
    expect(container2.firstChild).toBeNull();
  });

  it("renders live area, perimeter, and GPS locked badge when parcel is valid", () => {
    render(<ParcelTelemetryHud coords={samplePlot} />);
    expect(screen.getByTestId("parcel-telemetry-hud")).toBeInTheDocument();
    expect(screen.getByText("Parcel Telemetry")).toBeInTheDocument();
    expect(screen.getByText("GPS Locked")).toBeInTheDocument();
    expect(screen.getByText("Field Area")).toBeInTheDocument();
    expect(screen.getByText("Perimeter")).toBeInTheDocument();
    expect(screen.getByText(/4 GPS Pins/i)).toBeInTheDocument();
    expect(screen.getByText("0.84 (High Vigor)")).toBeInTheDocument();
  });

  it("triggers onFocusArea when Focus button is clicked", () => {
    const handleFocus = vi.fn();
    render(<ParcelTelemetryHud coords={samplePlot} onFocusArea={handleFocus} />);
    const focusBtn = screen.getByRole("button", { name: /center map on selected field/i });
    expect(focusBtn).toBeInTheDocument();
    fireEvent.click(focusBtn);
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });
});

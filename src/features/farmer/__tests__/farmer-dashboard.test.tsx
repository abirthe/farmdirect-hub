// Tests for Farmer Dashboard and extracted telemetry presentation modules.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FarmerKpiCards } from "../components/FarmerKpiCards";
import { FarmerYieldChart } from "../components/FarmerYieldChart";
import { FarmerFieldAlerts } from "../components/FarmerFieldAlerts";
import { FarmerFarmCardsList } from "../components/FarmerFarmCardsList";
import type { DisplayFarm } from "../types";

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
    currency: "USD",
  }),
}));

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: "500px", height: "300px" }}>{children}</div>
    ),
  };
});

const mockFarms: DisplayFarm[] = [
  {
    id: "f-001",
    name: "Green Valley Parcel A",
    crop: "Active Cultivation",
    area: "12.5 ha",
    ndvi: 0.88,
    yield: "Telemetry Active",
    status: "Ready",
    daysLeft: 5,
    health: 88,
  },
];

const wrap = (ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Farmer Feature Module", () => {
  it("renders FarmerKpiCards correctly", () => {
    wrap(<FarmerKpiCards />);
    expect(screen.getByText("Total Area Mapped")).toBeInTheDocument();
    expect(screen.getByText("20.2 ha")).toBeInTheDocument();
    expect(screen.getByText("Avg NDVI Score")).toBeInTheDocument();
  });

  it("renders FarmerFieldAlerts properly", () => {
    wrap(<FarmerFieldAlerts />);
    expect(screen.getByText("Field alerts")).toBeInTheDocument();
    expect(screen.getByText("Dry-window alert in 6 days. Schedule irrigation.")).toBeInTheDocument();
  });

  it("renders FarmerYieldChart properly", () => {
    wrap(<FarmerYieldChart />);
    expect(screen.getByText("Maize yield forecast vs. actual")).toBeInTheDocument();
  });

  it("renders empty state in FarmerFarmCardsList when no farms exist", () => {
    wrap(<FarmerFarmCardsList farms={[]} loading={false} />);
    expect(screen.getByTestId("farms-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No registered farms yet")).toBeInTheDocument();
  });

  it("renders loading state in FarmerFarmCardsList when loading is true", () => {
    wrap(<FarmerFarmCardsList farms={[]} loading={true} />);
    expect(screen.getByTestId("farms-loading")).toBeInTheDocument();
    expect(screen.getByText(/Loading your registered farms/i)).toBeInTheDocument();
  });

  it("renders farm card grid in FarmerFarmCardsList when farms exist", () => {
    wrap(<FarmerFarmCardsList farms={mockFarms} loading={false} />);
    expect(screen.getByTestId("farms-grid")).toBeInTheDocument();
    expect(screen.getByText("Green Valley Parcel A")).toBeInTheDocument();
    expect(screen.getByText("Field health (NDVI)")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
  });
});

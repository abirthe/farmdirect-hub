// Comprehensive test suite for AuthContext role derivation and ProtectedRoute enforcement.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { deriveRole, type UserRole, type UserProfile } from "@/lib/authUtils";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import type { Session, User } from "@supabase/supabase-js";

// Mock useAuth
const mockAuthState: {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isFarmer: boolean;
  isBuyer: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
} = {
  session: null,
  user: null,
  profile: null,
  role: "farmer",
  isAdmin: false,
  isFarmer: true,
  isBuyer: false,
  loading: false,
  refreshProfile: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("@/contexts/AuthContext", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/contexts/AuthContext");
  return {
    ...actual,
    useAuth: () => mockAuthState,
  };
});

describe("Auth Role Derivation (deriveRole)", () => {
  it("designates md.abirsharif68@gmail.com as admin regardless of metadata", () => {
    const user = {
      email: "md.abirsharif68@gmail.com",
      user_metadata: { role: "farmer" },
    } as unknown as User;

    expect(deriveRole(user, "FARMER")).toBe("admin");
  });

  it("designates uppercase ADMIN from database as admin", () => {
    const user = {
      email: "staff@agrodirect.farm",
      user_metadata: {},
    } as unknown as User;

    expect(deriveRole(user, "ADMIN")).toBe("admin");
  });

  it("designates metadata role admin as admin", () => {
    const user = {
      email: "admin@agrodirect.farm",
      user_metadata: { role: "admin" },
    } as unknown as User;

    expect(deriveRole(user, null)).toBe("admin");
  });

  it("designates BUYER from database or metadata as buyer", () => {
    const user1 = {
      email: "buyer@agrocorp.com",
      user_metadata: {},
    } as unknown as User;
    expect(deriveRole(user1, "BUYER")).toBe("buyer");

    const user2 = {
      email: "buyer2@agrocorp.com",
      user_metadata: { role: "buyer" },
    } as unknown as User;
    expect(deriveRole(user2, null)).toBe("buyer");
  });

  it("defaults unknown or unassigned roles to farmer", () => {
    const user = {
      email: "farmer@agrodirect.farm",
      user_metadata: {},
    } as unknown as User;

    expect(deriveRole(user, null)).toBe("farmer");
    expect(deriveRole(null)).toBe("farmer");
  });
});

describe("ProtectedRoute Route Guard", () => {
  const renderWithRouter = (initialRoute: string, element: React.ReactNode) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/farmer" element={element} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("shows loading spinner when authentication is resolving", () => {
    mockAuthState.loading = true;
    mockAuthState.session = null;
    renderWithRouter("/farmer", <ProtectedRoute role="farmer" />);
    expect(screen.getByTestId("auth-loading")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login", () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;
    mockAuthState.user = null;
    renderWithRouter("/farmer", <ProtectedRoute role="farmer" />);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("allows authenticated farmer to access farmer route", () => {
    mockAuthState.loading = false;
    mockAuthState.session = { user: { id: "u-1" } } as unknown as Session;
    mockAuthState.user = { id: "u-1" } as unknown as User;
    mockAuthState.role = "farmer";
    mockAuthState.isAdmin = false;

    render(
      <MemoryRouter initialEntries={["/farmer"]}>
        <Routes>
          <Route element={<ProtectedRoute role="farmer" />}>
            <Route path="/farmer" element={<div>Farmer Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Farmer Dashboard Content")).toBeInTheDocument();
  });

  it("allows superuser platform admin to access farmer route", () => {
    mockAuthState.loading = false;
    mockAuthState.session = { user: { id: "admin-1" } } as unknown as Session;
    mockAuthState.user = { id: "admin-1" } as unknown as User;
    mockAuthState.role = "admin";
    mockAuthState.isAdmin = true;

    render(
      <MemoryRouter initialEntries={["/farmer"]}>
        <Routes>
          <Route element={<ProtectedRoute role="farmer" />}>
            <Route path="/farmer" element={<div>Farmer Admin Inspected View</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Farmer Admin Inspected View")).toBeInTheDocument();
  });

  it("redirects non-admin buyer away from farmer route to home", () => {
    mockAuthState.loading = false;
    mockAuthState.session = { user: { id: "buyer-1" } } as unknown as Session;
    mockAuthState.user = { id: "buyer-1" } as unknown as User;
    mockAuthState.role = "buyer";
    mockAuthState.isAdmin = false;

    render(
      <MemoryRouter initialEntries={["/farmer"]}>
        <Routes>
          <Route path="/" element={<div>Home Landing Page</div>} />
          <Route element={<ProtectedRoute role="farmer" />}>
            <Route path="/farmer" element={<div>Farmer Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Home Landing Page")).toBeInTheDocument();
  });
});

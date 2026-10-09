import { describe, it, expect } from "vitest";
import { supabase } from "@/lib/supabaseClient";

describe("supabase client initialization", () => {
  it("initializes client successfully without throwing invalid URL errors", () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.getSession).toBe("function");
    expect(typeof supabase.from).toBe("function");
  });
});

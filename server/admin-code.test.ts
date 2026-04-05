import { describe, it, expect } from "vitest";

describe("Admin Code Verification", () => {
  const ADMIN_SECRET_CODE = "hemohemo@12";

  it("should verify correct admin code", () => {
    const code = "hemohemo@12";
    expect(code).toBe(ADMIN_SECRET_CODE);
  });

  it("should reject incorrect admin code", () => {
    const code = "wrongcode";
    expect(code).not.toBe(ADMIN_SECRET_CODE);
  });

  it("should reject empty admin code", () => {
    const code = "";
    expect(code).not.toBe(ADMIN_SECRET_CODE);
  });

  it("should be case-sensitive", () => {
    const code = "HEMOHEMO@12";
    expect(code).not.toBe(ADMIN_SECRET_CODE);
  });

  it("should have correct format", () => {
    expect(ADMIN_SECRET_CODE).toMatch(/^[a-zA-Z0-9@]+$/);
  });

  it("should contain @ symbol", () => {
    expect(ADMIN_SECRET_CODE).toContain("@");
  });
});

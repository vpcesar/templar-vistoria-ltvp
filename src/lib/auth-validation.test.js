import { describe, expect, test } from "bun:test";
import { passwordProblem } from "./auth-validation";

describe("account passwords", () => {
  test("rejects fewer than eight characters", () => {
    expect(passwordProblem("1234567", "1234567")).not.toBeNull();
    expect(passwordProblem("12345678", "12345678")).toBeNull();
  });
  test("requires matching confirmation", () => {
    expect(passwordProblem("12345678", "abcdefgh")).not.toBeNull();
  });
});
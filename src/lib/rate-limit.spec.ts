import { describe, test, expect } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  test("allows requests under the limit", () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

    expect(limiter.check("key-a", 100).allowed).toBe(true);
    expect(limiter.check("key-a", 200).allowed).toBe(true);
    expect(limiter.check("key-a", 300).allowed).toBe(true);
  });

  test("blocks requests over the limit", () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    expect(limiter.check("key-a", 100).allowed).toBe(true);
    expect(limiter.check("key-a", 200).allowed).toBe(true);
    expect(limiter.check("key-a", 300).allowed).toBe(false);
    expect(limiter.check("key-a", 400).allowed).toBe(false);
  });

  test("resets after window expires", () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    expect(limiter.check("key-a", 100).allowed).toBe(true);
    expect(limiter.check("key-a", 200).allowed).toBe(true);
    expect(limiter.check("key-a", 300).allowed).toBe(false);

    expect(limiter.check("key-a", 1201).allowed).toBe(true);
  });

  test("tracks keys independently", () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

    expect(limiter.check("key-a", 100).allowed).toBe(true);
    expect(limiter.check("key-a", 200).allowed).toBe(false);

    expect(limiter.check("key-b", 200).allowed).toBe(true);
    expect(limiter.check("key-b", 300).allowed).toBe(false);
  });

  test("cleans up expired entries", () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 500 });

    limiter.check("expired-key", 100);
    limiter.check("active-key", 700);

    expect(limiter.check("expired-key", 700).allowed).toBe(true);
  });

  test("sliding window allows new requests as old ones expire", () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    expect(limiter.check("key-a", 0).allowed).toBe(true);
    expect(limiter.check("key-a", 600).allowed).toBe(true);
    expect(limiter.check("key-a", 800).allowed).toBe(false);

    expect(limiter.check("key-a", 1001).allowed).toBe(true);
    expect(limiter.check("key-a", 1002).allowed).toBe(false);
  });
});

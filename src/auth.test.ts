import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT, hashPassword, checkPasswordHash } from "./auth.js";


describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
});


describe("JWT Authentication", () => {
  const userID = "user-123";
  const secret = "my-secret";

  it("should create and validate a JWT", () => {
    const token = makeJWT(userID, 3600, secret);

    const result = validateJWT(token, secret);

    expect(result).toBe(userID);
  });

  it("should reject an expired JWT", () => {
    const token = makeJWT(userID, -1, secret);

    expect(() => {
      validateJWT(token, secret);
    }).toThrow();
  });

  it("should reject a JWT signed with the wrong secret", () => {
    const token = makeJWT(userID, 3600, secret);

    expect(() => {
      validateJWT(token, "wrong-secret");
    }).toThrow();
  });
});


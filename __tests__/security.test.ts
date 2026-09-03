import { validateUserId, validateUpiId, validateTonAddress, validateTelegramChannel, sanitizeString, detectSuspiciousPatterns } from "@/lib/security";

describe("Security Module", () => {
  describe("validateUserId", () => {
    it("accepts valid numeric Telegram IDs", () => {
      expect(validateUserId("987654321").valid).toBe(true);
      expect(validateUserId("12345678").valid).toBe(true);
    });

    it("rejects demo/browser users", () => {
      expect(validateUserId("demo_123456").valid).toBe(false);
      expect(validateUserId("browser_123").valid).toBe(false);
    });

    it("rejects empty or short IDs", () => {
      expect(validateUserId("").valid).toBe(false);
      expect(validateUserId("ab").valid).toBe(false);
    });

    it("rejects non-string inputs", () => {
      expect(validateUserId(null).valid).toBe(false);
      expect(validateUserId(undefined).valid).toBe(false);
      expect(validateUserId(123).valid).toBe(false);
    });
  });

  describe("validateUpiId", () => {
    it("accepts valid UPI IDs", () => {
      expect(validateUpiId("user@okhdfcbank")).toBe(true);
      expect(validateUpiId("9876543210@paytm")).toBe(true);
      expect(validateUpiId("name@ybl")).toBe(true);
    });

    it("rejects invalid UPI IDs", () => {
      expect(validateUpiId("")).toBe(false);
      expect(validateUpiId("invalid")).toBe(false);
      expect(validateUpiId("@bank")).toBe(false);
    });
  });

  describe("validateTonAddress", () => {
    it("accepts valid TON addresses", () => {
      expect(validateTonAddress("EQDa4Vfvy2qPkW_x09yJ6V19nQW-29eL13098abcdef")).toBe(true);
      expect(validateTonAddress("UQDa4Vfvy2qPkW_x09yJ6V19nQW-29eL13098abcdef")).toBe(true);
    });

    it("rejects invalid TON addresses", () => {
      expect(validateTonAddress("")).toBe(false);
      expect(validateTonAddress("invalid")).toBe(false);
    });
  });

  describe("validateTelegramChannel", () => {
    it("accepts valid channel usernames", () => {
      expect(validateTelegramChannel("@cryptotraders").valid).toBe(true);
      expect(validateTelegramChannel("https://t.me/cryptotraders").valid).toBe(true);
    });

    it("formats channel with @ prefix", () => {
      expect(validateTelegramChannel("cryptotraders").formatted).toBe("@cryptotraders");
    });

    it("rejects invalid channels", () => {
      expect(validateTelegramChannel("").valid).toBe(false);
      expect(validateTelegramChannel("ab").valid).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("removes HTML tags", () => {
      expect(sanitizeString("<script>alert('xss')</script>")).toBe("alert('xss')");
    });

    it("trims and limits length", () => {
      expect(sanitizeString("  hello  ", 5)).toBe("hello");
    });

    it("handles null/undefined", () => {
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString(undefined)).toBe("");
    });
  });

  describe("detectSuspiciousPatterns", () => {
    it("detects prototype pollution", () => {
      expect(detectSuspiciousPatterns({ __proto__: { polluted: true } }).isSuspicious).toBe(true);
    });

    it("detects XSS patterns", () => {
      expect(detectSuspiciousPatterns("<script>alert(1)</script>").isSuspicious).toBe(true);
    });

    it("detects path traversal", () => {
      expect(detectSuspiciousPatterns("../../etc/passwd").isSuspicious).toBe(true);
    });

    it("allows clean input", () => {
      expect(detectSuspiciousPatterns("hello world").isSuspicious).toBe(false);
    });
  });
});

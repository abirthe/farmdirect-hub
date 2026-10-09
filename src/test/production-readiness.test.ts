import { describe, it, expect } from "vitest";
import { formatSmsMessage, sendSmsNotification } from "@/services/smsNotificationService";

describe("Production Readiness Suite", () => {
  describe("SMS Notification Formatting & Dispatch", () => {
    it("formats ESCROW_LOCKED notification for farmer pickup", () => {
      const msg = formatSmsMessage("ESCROW_LOCKED", {
        crop: "Yellow Maize",
        quantity: 12,
        date: "March 20",
        orderId: "#ORD-9912",
      });

      expect(msg).toContain("[AgroDirect]");
      expect(msg).toContain("Yellow Maize");
      expect(msg).toContain("12 tons");
      expect(msg).toContain("March 20");
    });

    it("formats CARRIER_DISPATCHED notification with driver and vehicle plate", () => {
      const msg = formatSmsMessage("CARRIER_DISPATCHED", {
        plate: "DHAKA-METRO-11",
        driver: "Kamal Hossain",
        tracking: "AGRO-3PL-8821",
      });

      expect(msg).toContain("DHAKA-METRO-11");
      expect(msg).toContain("Kamal Hossain");
      expect(msg).toContain("AGRO-3PL-8821");
    });

    it("dispatches SMS successfully in simulated/dev mode without errors", async () => {
      const result = await sendSmsNotification({
        recipientPhone: "+8801712345678",
        event: "PAYMENT_RELEASED",
        variables: { amount: "45,000" },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^SMS-[A-Z0-9]+$/);
      expect(result.deliveredText).toContain("45,000");
      expect(["PRODUCTION_API", "SIMULATED_DISPATCH"]).toContain(result.mode);
    });
  });
});

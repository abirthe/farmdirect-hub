// Thin page: farmer sees the offer form, buyer sees open offers (server RPCs enforce the real roles).
import { useAuth } from "@/contexts/AuthContext";
import { BuyerForwardBoard } from "@/features/forward/components/BuyerForwardBoard";
import { FarmerForwardPanel } from "@/features/forward/components/FarmerForwardPanel";

export default function ForwardContractsPage() {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;

  return (
    <main className="container max-w-3xl space-y-6 py-24">
      <title>Forward Contracts | AgroDirect</title>
      <meta name="description" content="Pre-sell part of your harvest at a locked price, or secure supply ahead of harvest." />
      <header>
        <h1 className="text-gradient-primary text-3xl font-black">Forward Contracts</h1>
        <p className="text-muted-foreground">
          {effectiveRole === "farmer" ? "Lock in a price for part of your expected harvest." : "Secure supply at a fixed price ahead of harvest."}
        </p>
      </header>
      {user && effectiveRole === "farmer" && <FarmerForwardPanel userId={user.id} />}
      {user && effectiveRole === "buyer" && <BuyerForwardBoard userId={user.id} />}
      {user && effectiveRole !== "farmer" && effectiveRole !== "buyer" && (
        <p className="text-sm text-muted-foreground">Forward contracts are available to farmers and buyers.</p>
      )}
    </main>
  );
}

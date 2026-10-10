// Thin RFQ page: picks the buyer or farmer view from the signed-in role (server RLS/RPCs enforce the real rules).
import { useAuth } from "@/contexts/AuthContext";
import { BuyerRfqPanel } from "@/features/rfq/components/BuyerRfqPanel";
import { FarmerRfqBoard } from "@/features/rfq/components/FarmerRfqBoard";

export default function RfqPage() {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;

  return (
    <main className="container max-w-3xl space-y-6 py-24">
      <title>Requests for Quotes | AgroDirect</title>
      <meta name="description" content="Post crop requests and bid on them directly, with no middlemen." />
      <header>
        <h1 className="text-gradient-primary text-3xl font-black">Requests for Quotes</h1>
        <p className="text-muted-foreground">
          {role === "buyer" ? "Post what you need and pick the best bid." : "Bid on open buyer requests."}
        </p>
      </header>
      {user && role === "buyer" && <BuyerRfqPanel userId={user.id} />}
      {user && role === "farmer" && <FarmerRfqBoard userId={user.id} />}
      {user && role !== "buyer" && role !== "farmer" && (
        <p className="text-sm text-muted-foreground">RFQs are available to buyers and farmers.</p>
      )}
    </main>
  );
}

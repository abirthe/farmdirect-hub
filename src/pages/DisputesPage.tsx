// Thin page for buyers and farmers to manage their disputes.
import { MyDisputesPanel } from "@/features/disputes/components/MyDisputesPanel";

export default function DisputesPage() {
  return (
    <main className="container max-w-3xl space-y-6 py-24">
      <title>Disputes | AgroDirect</title>
      <meta name="description" content="Open and track order disputes. Funds stay in escrow until an admin resolves the case." />
      <header>
        <h1 className="text-gradient-primary text-3xl font-black">Disputes</h1>
        <p className="text-muted-foreground">Funds stay on hold until an admin resolves the case.</p>
      </header>
      <MyDisputesPanel />
    </main>
  );
}

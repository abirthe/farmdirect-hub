// Public batch verification page for consumers and retail buyers.
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QrCode, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePublicTrace } from "@/features/traceability/hooks";
import { TraceCertificate } from "@/features/traceability/components/TraceCertificate";

export default function TraceabilityPage() {
  const { orderId: paramId } = useParams<{ orderId: string }>();
  const [searchId, setSearchId] = useState(paramId || "");
  const [activeId, setActiveId] = useState(paramId || "00000000-0000-4000-8000-000000000001");

  const { data, isLoading, isError, error } = usePublicTrace(activeId);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) setActiveId(searchId.trim());
  };

  return (
    <main className="container max-w-2xl min-h-screen py-24 space-y-6" data-testid="traceability-page">
      <title>Batch Traceability & Provenance | AgroDirect</title>
      <meta name="description" content="Verify origin farm, satellite NDVI health, and harvest timeline of your produce." />

      <div className="flex items-center justify-between">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
          <QrCode className="h-3.5 w-3.5" /> AgroDirect QR Trace
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Agricultural Traceability</h1>
        <p className="text-sm text-muted-foreground">
          Real-time verification of origin farm, harvest timeline, and environmental footprint.
        </p>
      </header>

      {/* Direct Batch Search Bar */}
      <form onSubmit={onSearch} className="flex gap-2" aria-label="Search batch by ID">
        <Input
          aria-label="Order or Batch ID"
          placeholder="Paste Batch or Order UUID…"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="font-mono text-xs"
        />
        <Button type="submit" size="sm" className="gap-1.5 shrink-0">
          <Search className="h-3.5 w-3.5" /> Verify
        </Button>
      </form>

      {isLoading && (
        <div data-testid="trace-loading" className="rounded-xl border p-8 text-center text-sm text-muted-foreground animate-pulse">
          Decrypting cryptographic batch telemetry…
        </div>
      )}

      {isError && (
        <div role="alert" data-testid="trace-error" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive space-y-2">
          <p className="font-bold">Provenance Verification Failed</p>
          <p className="text-xs">{(error as Error).message}</p>
        </div>
      )}

      {data && <TraceCertificate trace={data} />}
    </main>
  );
}

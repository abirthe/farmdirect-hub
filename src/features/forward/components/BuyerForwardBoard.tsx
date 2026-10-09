// Buyer view: browse open forward offers, accept one, and see contracts already secured.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAcceptContract, useContracts } from "../hooks";
import { contractValue, isPastDelivery } from "../schemas";

export function BuyerForwardBoard({ userId }: { userId: string }) {
  const { toast } = useToast();
  const contracts = useContracts();
  const accept = useAcceptContract();
  const all = contracts.data ?? [];
  const open = all.filter((c) => c.status === "OFFERED" && !isPastDelivery(c));
  const secured = all.filter((c) => c.status === "ACCEPTED" && c.buyer_id === userId);

  return (
    <section aria-label="Forward contract offers" data-testid="buyer-forward" className="space-y-6">
      {contracts.isLoading && <p className="text-sm text-muted-foreground">Loading offers…</p>}
      {contracts.isError && <p role="alert" className="text-sm text-destructive">{(contracts.error as Error).message}</p>}
      {contracts.isSuccess && open.length === 0 && <p data-testid="buyer-forward-empty" className="text-sm text-muted-foreground">No open forward offers right now.</p>}
      {open.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span>{c.qty_tons} t @ {c.price_per_ton}/t = {contractValue(c)} · delivery {c.delivery_date}</span>
            <Button size="sm" disabled={accept.isPending}
              onClick={() => accept.mutate(c.id, {
                onSuccess: () => toast({ title: "Contract accepted" }),
                onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
              })}>
              Accept
            </Button>
          </CardContent>
        </Card>
      ))}
      {secured.length > 0 && <h2 className="text-lg font-bold">Secured contracts</h2>}
      {secured.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
            <span>{c.qty_tons} t @ {c.price_per_ton}/t · delivery {c.delivery_date}</span>
            <Badge variant="secondary">ACCEPTED</Badge>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" title={`Current: ${currency}`}>
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Choose currency</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrency("BDT")} className="cursor-pointer">
          <span className="w-4 font-bold text-center mr-2">৳</span> BDT (Taka)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency("USD")} className="cursor-pointer">
          <span className="w-4 font-bold text-center mr-2">$</span> USD (Dollar)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency("EUR")} className="cursor-pointer">
          <span className="w-4 font-bold text-center mr-2">€</span> EUR (Euro)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

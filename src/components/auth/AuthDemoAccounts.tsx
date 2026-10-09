import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AuthDemoAccountsProps {
  onMockLogin?: (role: "farmer" | "buyer" | "admin") => void;
}

export function AuthDemoAccounts({ onMockLogin }: AuthDemoAccountsProps) {
  const navigate = useNavigate();

  return (
    <div className="pt-6 mt-6 border-t border-border/60">
      <div className="text-center space-y-3 mb-4">
        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
          Local network testing
        </span>
        <p className="text-xs text-muted-foreground">
          Are you rate-limited by Supabase? Use a 1-click test account.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-10 border-primary/20 hover:bg-primary/10 text-primary"
          onClick={() => {
            onMockLogin?.("farmer");
            navigate("/farmer");
          }}
        >
          🌾 Farmer
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-10 border-primary/20 hover:bg-primary/10 text-primary"
          onClick={() => {
            onMockLogin?.("buyer");
            navigate("/buyer");
          }}
        >
          🏢 Buyer
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-2 rounded-xl h-10 border-destructive/20 hover:bg-destructive/10 text-destructive"
          onClick={() => {
            onMockLogin?.("admin");
            navigate("/admin");
          }}
        >
          🛡️ System Admin
        </Button>
      </div>
    </div>
  );
}

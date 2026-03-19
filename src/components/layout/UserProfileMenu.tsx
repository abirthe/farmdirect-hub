import { LogOut, Settings, Wallet, UserCircle2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function UserProfileMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 hover:border-primary transition-colors">
           <div className="h-full w-full flex items-center justify-center font-bold text-primary">
             {user?.user_metadata?.full_name?.charAt(0) || "F"}
           </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[240px] p-2 rounded-2xl border-border/60 shadow-xl glass-panel">
        <div className="flex items-center gap-3 px-3 py-3 border-b border-border/60 mb-1">
          <div className="h-10 w-10 flex items-center justify-center rounded-full overflow-hidden shrink-0 ring-2 ring-primary bg-primary/20 text-primary font-bold">
            {user?.user_metadata?.full_name?.charAt(0) || "F"}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-foreground truncate max-w-[150px]">
               {user?.user_metadata?.full_name || "New Farmer"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
               {user?.user_metadata?.role || "Verified Tier"}
            </p>
          </div>
        </div>
        
        <div className="p-1 space-y-1">
          {user?.user_metadata?.role === "admin" ? (
            <Button asChild variant="ghost" className="w-full justify-start text-sm hover:bg-muted/50 rounded-xl h-10 text-destructive hover:text-destructive">
              <Link to="/admin"><UserCircle2 className="h-4 w-4 mr-2" /> Platform Settings</Link>
            </Button>
          ) : user?.user_metadata?.role === "buyer" ? (
            <Button asChild variant="ghost" className="w-full justify-start text-sm hover:bg-muted/50 rounded-xl h-10 text-primary hover:text-primary">
              <Link to="/buyer"><UserCircle2 className="h-4 w-4 mr-2" /> Buyer Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="w-full justify-start text-sm hover:bg-muted/50 rounded-xl h-10">
                <Link to="/farmer"><UserCircle2 className="h-4 w-4 mr-2" /> My Profile</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-sm hover:bg-muted/50 rounded-xl h-10 text-primary hover:text-primary">
                <Link to="/farmer/yield/BOG-1200"><Sprout className="h-4 w-4 mr-2" /> Ag-Intelligence</Link>
              </Button>
            </>
          )}
          <Button asChild variant="ghost" className="w-full justify-start text-sm hover:bg-muted/50 rounded-xl h-10 text-blue-500 hover:text-blue-500">
            <Link to="/escrow/demo"><Wallet className="h-4 w-4 mr-2" /> Wallet & Escrow Tracker</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start text-sm hover:bg-muted/50 rounded-xl h-10">
            <Link to="/settings"><Settings className="h-4 w-4 mr-2" /> Account Settings</Link>
          </Button>
        </div>
        <div className="pt-1 mt-1 border-t border-border/60">
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full justify-start text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-10"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error captured by GlobalErrorBoundary:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-6 shadow-xl space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Agricultural Ledger Interruption</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected system exception occurred while rendering this interface. Your data and cryptographic ledger records remain securely preserved.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-left font-mono text-[11px] text-muted-foreground break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl gap-1.5 text-xs"
                onClick={this.handleHome}
              >
                <Home className="h-3.5 w-3.5" />
                Return Home
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl gap-1.5 text-xs bg-primary"
                onClick={this.handleReload}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Screen
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

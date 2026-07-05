import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logError } from "@/lib/analytics";

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logError(error, { componentStack: info.componentStack, type: "react_boundary" });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Our team has been notified.
          </p>
          {this.state.message && (
            <p className="text-xs text-muted-foreground font-mono break-words">{this.state.message}</p>
          )}
          <Button onClick={() => { window.location.href = "/"; }}>Go to Home</Button>
        </div>
      </div>
    );
  }
}

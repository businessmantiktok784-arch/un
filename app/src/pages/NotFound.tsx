import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home, Search, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>

        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4" /> Browse Documents
            </Button>
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Go back to previous page
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold font-display gradient-text">404</h1>
        <p className="text-xl text-muted-foreground">Oops! This page doesn&apos;t exist.</p>
        <p className="text-sm text-muted-foreground">
          The route <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> was not found.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild className="rounded-full gap-2">
            <Link to="/">
              <Home size={18} /> Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full gap-2">
            <Link to="/wardrobe">
              <Shirt size={18} /> Open Wardrobe
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

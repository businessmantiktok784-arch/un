import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";

export default function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    track("page_view", { search: location.search });
  }, [location.pathname, location.search]);
  return null;
}

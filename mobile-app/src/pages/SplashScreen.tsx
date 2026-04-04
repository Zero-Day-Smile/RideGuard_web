import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScooterLoader from "@/components/ScooterLoader";
import { getCurrentUser } from "@/lib/session";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      const user = getCurrentUser();
      navigate(user?.role === "rider" ? "/home" : "/auth", { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!show) return null;
  return <ScooterLoader />;
};

export default SplashScreen;

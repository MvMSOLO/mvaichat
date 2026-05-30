import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function ResetPassword() {
  const navigate = useNavigate();
  useEffect(() => {
    // Clerk handles password reset via its built-in flow
    navigate("/auth", { replace: true });
  }, [navigate]);
  return null;
}

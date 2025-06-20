import { useEffect } from "react";
import { logout } from "./user_service";
import api from "../utils/api";

const tokenName = ".otc"

const useTokenCheck = () => {


  useEffect(() => {
    const checkTokenExpiration =async () => {
      const token = localStorage.getItem(tokenName); 
      if (!token) {
        return;
      }

      try {
          const response = await api.get("/Account/check-login")
        if (response.status !== 200) {
          logout();
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    };


    const interval = setInterval(checkTokenExpiration, 1 * 60 * 1000);

    return () => clearInterval(interval); 
  }, []);

  return null;
};

export default useTokenCheck;

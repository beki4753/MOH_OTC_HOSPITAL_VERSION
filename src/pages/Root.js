import { Outlet } from "react-router-dom";
import Topbar from "./global/Topbar";
import Sidebar from "./global/Sidebar";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { useState, useEffect } from "react";
import { ColorModeContext, useMode,tokens } from "../theme";
import Login from "./login";
import { getSession } from "../services/user_service";
import tsedeyLogo from "../assets/logo.png";

function RootLayout() {
  const token = getSession();
  const [theme, colorMode] = useMode();
  const colors = tokens(theme.palette.mode)

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {token ? (
            <>
              <Box display="flex" alignContent="flex-start">
                <Sidebar
                  isCollapsed={isCollapsed}
                  setIsCollapsed={setIsCollapsed}
                />

                <Box
                  component="main"
                  style={{
                    flexGrow: 1, // Allows content to stretch
                    transition: "margin-left 0.3s ease",
                    marginLeft: isCollapsed ? "80px" : "270px",
                    width: `calc(100% - ${isCollapsed ? 80 : 270}px)`, // Ensure proper stretching
                  }}
                >
                  <Topbar setIsCollapsed={setIsCollapsed} />
                  <Outlet />
                  <footer
                    style={{
                      //backgroundColor: theme.palette.mode === 'light'? "#f5f5f5":"#124536",
                      backgroundColor: colors.primary[400],
                      padding: "20px 40px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #ddd",
                      marginTop: "40px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <img
                        src={tsedeyLogo}
                        alt="Tsedey Bank Logo"
                        style={{ height: "60px", width: "auto" }}
                      />
                      <span style={{ fontSize: "14px", color: colors.grey[100]}}>
                        © {new Date().getFullYear()} Tsedey Bank. All rights
                        reserved.
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.grey[100] }}>
                      Powered by Tsedey Bank
                    </div>
                  </footer>
                </Box>
              </Box>
            </>
          ) : (
            <Login />
          )}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
}

export default RootLayout;

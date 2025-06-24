import {
  Box,
  IconButton,
  useTheme,
  Divider,
  MenuItem,
  Menu,
  Avatar,
  ListItemIcon,
  Tooltip,
  InputBase,
  Button,
} from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate, Form, useRouteLoaderData } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Logout from "@mui/icons-material/Logout";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { getTokenValue } from "../../services/user_service";
import AMHRLogo from "../../assets/Amhara-region.png";

import FileDownloadIcon from "@mui/icons-material/FileDownload";

const tokenvalue = getTokenValue();

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const session = useRouteLoaderData("root");
  const navigate = useNavigate();

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleProfile = () => navigate("/profile");

  const handleDownloadCollectorsFile = () => {
    try {
      const link = document.createElement("a");
      link.href = `${window.location.origin}/assets/files/Register Collectors.xlsx`;
      link.download = "Register Collectors.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
  // Register Credit Users
  const handleDownloadCreditUserFile = () => {
    try {
      const link = document.createElement("a");
      link.href = `${window.location.origin}/assets/files/Register Credit Users.xlsx`;
      link.download = "Register Credit Users.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Upload Services
  const handleDownloadUploadServicesFile = () => {
    try {
      const link = document.createElement("a");
      link.href = `${window.location.origin}/assets/files/Services.xlsx`;
      link.download = "Services.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleHelp = () => {
    try {
      const pdf = `${window.location.origin}/assets/files/Moh Documentation.pdf`;
      window.open(pdf, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return session ? (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
        sx={{
          height: { xs: 35, sm: 40, md: 42 },
          width: { xs: 120, sm: 160, md: 222 },
        }}
      >
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>
      {/*<Box
        component="img"
        src={AMHRLogo}
        alt="Amhara Region Logo"
        sx={{
          height: { xs: 50, sm: 55, md: 90 },
          width: { xs: 120, sm: 160, md: 222 },
          objectFit: "contain",
          maxWidth: "100%",
        }}
      />*/}

      {/* ICONS */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <IconButton>
          <NotificationsOutlinedIcon />
          {/* <LanguageToggle onClick={handleToggleLanguage}/> */}
        </IconButton>
        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton>

        {/* User Avatar */}
        <Box
          sx={{ display: "flex", alignItems: "center", textAlign: "center" }}
        >
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {tokenvalue.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          sx={{
            "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          }}
        >
          <MenuItem onClick={() => handleProfile()}>
            <ListItemIcon>
              <Avatar />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleDownloadCollectorsFile()}>
            <ListItemIcon>
              <FileDownloadIcon />
            </ListItemIcon>
            Get Register Collectors File
          </MenuItem>
          <MenuItem onClick={() => handleDownloadCreditUserFile()}>
            <ListItemIcon>
              <FileDownloadIcon />
            </ListItemIcon>
            Get Register Credit User File
          </MenuItem>
          <MenuItem onClick={() => handleDownloadUploadServicesFile()}>
            <ListItemIcon>
              <FileDownloadIcon />
            </ListItemIcon>
            Service Upload
          </MenuItem>
          <MenuItem onClick={() => handleHelp()}>
            <ListItemIcon>
              <HelpOutlineIcon />
            </ListItemIcon>
            Help
          </MenuItem>
          <Divider />
          <Form action="/logout" method="post">
            <MenuItem>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <Button variant="contained" type="submit" color="secondary">
                Logout
              </Button>
            </MenuItem>
          </Form>
        </Menu>
      </Box>
    </Box>
  ) : (
    <Box display="flex">
      <IconButton onClick={colorMode.toggleColorMode}>
        {theme.palette.mode === "dark" ? (
          <DarkModeOutlinedIcon />
        ) : (
          <LightModeOutlinedIcon />
        )}
      </IconButton>
      <IconButton>
        <NotificationsOutlinedIcon />
      </IconButton>
    </Box>
  );
};

export default Topbar;

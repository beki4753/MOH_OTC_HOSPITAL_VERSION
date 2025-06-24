import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { getTokenValue } from "../../services/user_service";
import StorageIcon from "@mui/icons-material/Storage";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import CarCrashIcon from "@mui/icons-material/CarCrash";
import BiotechIcon from "@mui/icons-material/Biotech";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import { LibraryBooksTwoTone } from "@mui/icons-material";
import BusinessIcon from "@mui/icons-material/Business";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { CreditCard } from "@mui/icons-material";
import MOHLogo from "../../assets/logo_bg.png";
import ScienceIcon from "@mui/icons-material/Science";
import LocalHotelIcon from "@mui/icons-material/LocalHotel";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const tokenvalue = getTokenValue();

// Departement,UserType
const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const role = Object.entries(tokenvalue).some(
    ([key, value]) => value.length > 0
  )
    ? tokenvalue["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    : "";

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selected, setSelected] = useState(() => {
    const storedCurrentPage = localStorage.getItem("currentNav");
    try {
      return storedCurrentPage ? JSON.parse(storedCurrentPage) : "Dashboard";
    } catch (error) {
      return "Dashboard";
    }
  });

  useEffect(() => {
    if (selected) {
      localStorage.setItem("currentNav", JSON.stringify(selected));
    }
  }, [selected]);

  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: "5",
        height: "100vh",
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ ml: 2, mr: 2, mt: 1, mb: 1 }}
              >
                <Box
                  component="img"
                  src={MOHLogo}
                  alt="Tsedey Logo"
                  sx={{
                    height: { xs: 40, sm: 50, md: 55 },
                    width: { xs: 100, sm: 130, md: 150 },
                    objectFit: "contain",
                  }}
                />
                <Tooltip title="Collapse menu" arrow>
                  <IconButton
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label="Collapse sidebar"
                    size="large"
                    edge="end"
                  >
                    <MenuOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={`../../assets/profile.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box
                textAlign="center"
                sx={{ fontSize: "20px", textTransform: "capitalize" }}
              >
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{
                    m: "10px 0 0 0",
                    fontSize: "inherit",
                    transform: "-moz-initial",
                  }}
                >
                  {tokenvalue?.name}
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  {tokenvalue?.UserType?.toUpperCase()}
                </Typography>
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            {!["MLT", "RADIOLOGY", "WARD"].includes(
              tokenvalue?.UserType?.toUpperCase()
            ) && (
              <Item
                title="Dashboard"
                to="/"
                icon={<HomeOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            )}

            {role?.toUpperCase() === "ADMIN" && (
              <>
                {!isCollapsed && (
                  <Typography
                    variant="h6"
                    color={colors.grey[300]}
                    sx={{ m: "15px 0 5px 20px" }}
                  >
                    User Management
                  </Typography>
                )}

                <Item
                  title="User Management"
                  to="/UserManagment"
                  icon={<PersonOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Role Management"
                  to="/RoleManagment"
                  icon={<BadgeOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              </>
            )}

            {!isCollapsed &&
              (role?.toUpperCase() === "ADMIN" ||
                (role?.toUpperCase() === "USER" &&
                  tokenvalue?.UserType?.toUpperCase() === "CASHIER")) && (
                <Typography
                  variant="h6"
                  color={colors.grey[300]}
                  sx={{
                    m: "15px 0 5px 20px",
                    whiteSpace: isCollapsed ? "nowrap" : "normal",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordBreak: "break-word",
                  }}
                >
                  Payment Management
                </Typography>
              )}

            {role?.toUpperCase() === "ADMIN" && (
              <>
                <Item
                  title="Payment Channels"
                  to="/payment-channel"
                  icon={<AccountBalanceWalletOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Payment Type Limit"
                  to="/payment-limit"
                  icon={<MonetizationOnOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Payment Types"
                  to="/payment-type"
                  icon={<CategoryOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                {!isCollapsed && (
                  <Typography
                    variant="h6"
                    color={colors.grey[300]}
                    sx={{ m: "15px 0 5px 20px" }}
                  >
                    Bankers Management
                  </Typography>
                )}

                <Item
                  title="Bankers Manager"
                  to="/BankerManagment"
                  icon={<BusinessIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                {!isCollapsed && (
                  <Typography
                    variant="h6"
                    color={colors.grey[300]}
                    sx={{ m: "15px 0 5px 20px" }}
                  >
                    Credit Users Management
                  </Typography>
                )}

                <Item
                  title="Credit Users"
                  to="/credit-users"
                  icon={<CreditCard />}
                  selected={selected}
                  setSelected={setSelected}
                />
              </>
            )}

            {role?.toUpperCase() === "USER" &&
              tokenvalue?.UserType === "MLT" && (
                <>
                  {!isCollapsed && (
                    <Typography
                      variant="h6"
                      color={colors.grey[300]}
                      sx={{ m: "15px 0 5px 20px" }}
                    >
                      Treatment Entry Manager
                    </Typography>
                  )}

                  <Item
                    title="Treatment Entry"
                    to="/treatment-entry"
                    icon={<BiotechIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </>
              )}
            {role?.toUpperCase() === "USER" &&
              tokenvalue?.UserType?.toUpperCase() === "RADIOLOGY" && (
                <>
                  {!isCollapsed && (
                    <Typography
                      variant="h6"
                      color={colors.grey[300]}
                      sx={{ m: "15px 0 5px 20px" }}
                    >
                      Radiology Entry Manager
                    </Typography>
                  )}

                  <Item
                    title="Radiology Entry"
                    to="/radiology-entry"
                    icon={<ScienceIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </>
              )}
            {role?.toUpperCase() === "USER" &&
              tokenvalue?.UserType?.toUpperCase() === "WARD" && (
                <>
                  {!isCollapsed && (
                    <Typography
                      variant="h6"
                      color={colors.grey[300]}
                      sx={{ m: "15px 0 5px 20px" }}
                    >
                      Ward Entry Manager
                    </Typography>
                  )}

                  <Item
                    title="Ward Entry"
                    to="/nurse-page"
                    icon={<LocalHotelIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </>
              )}

            {role?.toUpperCase() === "USER" &&
              (tokenvalue?.UserType?.toUpperCase() === "CASHIER" ||
                tokenvalue?.UserType?.toUpperCase() === "SUPERVISOR") && (
                <>
                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" && (
                    <Item
                      title="Payments"
                      to="/payment-entry"
                      icon={<CreditCardOutlinedIcon />}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  )}
                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" &&
                    !isCollapsed && (
                      <Typography
                        variant="h6"
                        color={colors.grey[300]}
                        sx={{ m: "15px 0 5px 20px" }}
                      >
                        Money Refund
                      </Typography>
                    )}
                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" && (
                    <Item
                      title="Refund Money"
                      to="/money-refund"
                      icon={<CurrencyExchangeIcon />}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  )}

                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" &&
                    !isCollapsed && (
                      <Typography
                        variant="h6"
                        color={colors.grey[300]}
                        sx={{ m: "15px 0 5px 20px" }}
                      >
                        Money Submission
                      </Typography>
                    )}

                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" && (
                    <Item
                      title="Submit Money"
                      to="/money-submission"
                      icon={<StorageIcon />}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  )}

                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" &&
                    !isCollapsed && (
                      <Typography
                        variant="h6"
                        color={colors.grey[300]}
                        sx={{ m: "15px 0 5px 20px" }}
                      >
                        Patient Registration
                      </Typography>
                    )}

                  {tokenvalue?.UserType?.toUpperCase() === "CASHIER" && (
                    <>
                      <Item
                        title="CBHI Registration"
                        to="/patien-reg-cbhi"
                        icon={<VaccinesIcon />}
                        selected={selected}
                        setSelected={setSelected}
                      />
                      <Item
                        title="Traffic Accident Registration"
                        to="/patien-reg-tar"
                        icon={<CarCrashIcon />}
                        selected={selected}
                        setSelected={setSelected}
                      />
                    </>
                  )}
                  {!isCollapsed && (
                    <Typography
                      variant="h6"
                      color={colors.grey[300]}
                      sx={{ m: "15px 0 5px 20px" }}
                    >
                      Report
                    </Typography>
                  )}

                  <Item
                    title="Reports"
                    to="/reports"
                    icon={<BarChartOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                  <Item
                    title="Reports New"
                    to="/reports-new"
                    icon={<BarChartOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                  <Item
                    title="Collection Reports"
                    to="/collection-reports"
                    icon={<LibraryBooksTwoTone />}
                    selected={selected}
                    setSelected={setSelected}
                  />

                  <Item
                    title="Find Patient"
                    to="/find-patient"
                    icon={<ManageSearchIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </>
              )}
            {role?.toUpperCase() === "USER" &&
              tokenvalue?.UserType?.toUpperCase() === "SUPERVISOR" &&
              tokenvalue?.Departement?.toUpperCase() === "TSEDEY BANK" && (
                <>
                  {!isCollapsed && (
                    <Typography
                      variant="h6"
                      color={colors.grey[300]}
                      sx={{ m: "15px 0 5px 20px" }}
                    >
                      Cash Managmet
                    </Typography>
                  )}

                  <Item
                    title="Cash Managmet"
                    to="/cash-managment"
                    icon={<CreditCardOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </>
              )}
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;

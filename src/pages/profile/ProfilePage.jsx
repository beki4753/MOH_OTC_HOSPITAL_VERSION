import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Avatar,
  Box,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import { styled } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../utils/api";
import { getTokenValue, logout } from "../../services/user_service";
const tokenvalue = getTokenValue();

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  maxWidth: 500,
  margin: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.2)",
  borderRadius: "12px",
}));

const ProfilePage = () => {
  const username = tokenvalue?.name;
  const role =
    tokenvalue["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const [userData, setUserData] = useState({ username: "", phone: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    const fetchAdminInfo = async (username) => {
      try {
        let apiPath = "";

        if (role.toLowerCase() === "admin") {
          apiPath = "/Admin/admin-info";
        } else if (role.toLowerCase() === "user") {
          apiPath = "/User/user-info";
        } else {
          return;
        }

        const response = await api.post(apiPath, username, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          setUserData({
            username: response?.data?.userName,
            phone: response?.data?.phoneNumber,
          });
        }
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchAdminInfo(username);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
    if (e.target.name === "username") {
      validateUsername(e.target.value);
    }
    if (e.target.name === "phone") {
      validatePhoneNumber(e.target.value);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
    validatePassword(name, value);
  };

  const validatePassword = (name, value) => {
    const passwordValidationErrors = [];
    if (value.length < 6) {
      passwordValidationErrors.push("Passwords must be at least 6 characters.");
    }
    if (!/[^\w\s]/.test(value)) {
      passwordValidationErrors.push(
        "Passwords must have at least one non-alphanumeric character."
      );
    }
    if (!/[a-z]/.test(value)) {
      passwordValidationErrors.push(
        "Passwords must have at least one lowercase ('a'-'z')."
      );
    }
    if (!/[A-Z]/.test(value)) {
      passwordValidationErrors.push(
        "Passwords must have at least one uppercase ('A'-'Z')."
      );
    }

    setError((prevError) => ({
      ...prevError,
      [name]: passwordValidationErrors.join(", "),
    }));
  };

  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    if (!usernameError && !phoneError) {
      try {
        setLoading(true);

        let apiPath = "";

        if (role.toLowerCase() === "admin") {
          apiPath = "/Admin/admin-info";
        } else if (role.toLowerCase() === "user") {
          apiPath = "/User/user-info";
        } else {
          return;
        }
        const response = await api.put(apiPath, {
          username: username,
          phoneNumber: userData.phone,
          departement: tokenvalue?.Departement,
          userType: tokenvalue?.UserType,
        });
        toast.success(response?.data?.message);
      } catch (error) {
        console.error(error.message);
        toast.error("Failed to update phone number.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError({
        ...error,
        confirmPassword: "New Password and Confirm Password do not match.",
      });
      return;
    }

    try {
      setLoading2(true);
      if (error.currentPassword || error.newPassword || error.confirmPassword) {
        toast.error("Please fix the errors before submitting.");
        return;
      }

      setError({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      let apiPath = "";

      if (role.toLowerCase() === "admin") {
        apiPath = "/Admin/change-admin-password";
      } else if (role.toLowerCase() === "user") {
        apiPath = "/User/change-password";
      } else {
        return;
      }

      const response = await api.put(apiPath, {
        username: username,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.confirmPassword,
      }); //&& (role.toLowerCase() === 'admin'&& response?.data?.message?.charAt(0) === "A")
      if (response.status === 200) {
        const message = response?.data?.message;

        if (role?.toLowerCase() === "admin") {
          if (message?.charAt(0) === "A") {
            toast.success(message);
          }
        } else if (role?.toLowerCase() === "user") {
          toast.success(message);
        }

        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          const release = async () => {
            logout();
          };
          release();
        }, 2000);
      }
    } catch (error) {
      console.error(error.message);
      toast.error(
        error?.response?.data?.message || "Pease Check The Curent Password"
      );
    } finally {
      setLoading2(false);
    }
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[A-Za-z][A-Za-z0-9]{1,}$/;
    if (!usernameRegex.test(username)) {
      setUsernameError(
        "Username must start with a letter, be at least 3 characters long, and contain no spaces."
      );
    } else {
      setUsernameError("");
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(?:\+251|09|07)\d+$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError(
        "Phone number must start with +251, 09, or 07 and contain only numbers."
      );
    } else {
      if (phone.startsWith("+251") && phone.length !== 13) {
        setPhoneError("Phone number starting with +251 must have 13 digits.");
      } else if (
        (phone.startsWith("09") || phone.startsWith("07")) &&
        phone.length !== 10
      ) {
        setPhoneError(
          "Phone number starting with 09 or 07 must have 10 digits."
        );
      } else {
        setPhoneError("");
      }
    }
  };

  return (
    <Container>
      <Box mt={7}>
        <StyledPaper>
          <Avatar
            sx={{ bgcolor: "primary.main", width: 70, height: 70, mb: 2 }}
          >
            <PersonIcon sx={{ fontSize: 35 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Profile Settings
          </Typography>

          {/* Update Phone Number */}
          <form onSubmit={handlePhoneUpdate} style={{ width: "100%" }}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={userData.username}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              error={!!usernameError}
              helperText={usernameError}
              InputProps={{
                startAdornment: <AccountCircleIcon sx={{ mr: 1 }} />,
              }}
              disabled
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              required
              error={!!phoneError}
              helperText={phoneError}
              InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1 }} /> }}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              sx={{ mt: 2, py: 1.2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Update"
              )}
            </Button>
          </form>

          {/* Update Password */}
          <form
            onSubmit={handlePasswordUpdate}
            style={{ width: "100%", marginTop: 25 }}
          >
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              required
              margin="normal"
              error={!!error.currentPassword}
              helperText={error.currentPassword}
              variant="outlined"
              InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
              margin="normal"
              error={!!error.newPassword}
              helperText={error.newPassword}
              variant="outlined"
              InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              margin="normal"
              required
              error={!!error.confirmPassword}
              helperText={error.confirmPassword}
              variant="outlined"
              InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              sx={{ mt: 2, py: 1.2 }}
            >
              {loading2 ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </StyledPaper>
      </Box>
      <ToastContainer />
    </Container>
  );
};

export default ProfilePage;

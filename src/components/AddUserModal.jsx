import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Backdrop,
  Grid,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  userData,
  onEdit,
  resetUserData,
  role,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
    phone: "",
    role: "",
    department: "",
    usertype: "",
    hospital: "DB Referral Hospital",
  });

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [confPassError, setConfPassError] = useState("");

  const theme = useTheme();

  const departments = ["Card", "Pharmacy", "Hospital", "Tsedey Bank"];
  const hospitals = ["DB Referral Hospital"];
  const usertypes = [
    "Cashier",
    "Supervisor",
    "Admin",
    "MLT",
    "Radiology",
    "Ward",
  ];
  // (MLT) stand for Medical Laboratory Technician
  const handleClose = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmpassword: "",
      phone: "",
      role: "",
      department: "",
      usertype: "",
      hospital: "DB Referral Hospital",
    });
    setConfPassError("");
    setEmailError("");
    setUsernameError("");
    setPhoneError("");
    resetUserData();
    onClose();
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData?.username || "",
        email: userData?.email || "",
        password: "",
        confirmpassword: "",
        phone: userData?.phoneNumber || "",
        role: userData?.role || "",
        department: userData?.departement || "",
        usertype: userData?.userType || "",
        hospital: userData?.hospital || "DB Referral Hospital",
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "email") validateEmail(e.target.value);
    if (e.target.name === "phone") validatePhoneNumber(e.target.value);
    if (e.target.name === "username") validateUsername(e.target.value);
    if (e.target.name === "confirmpassword") setConfPassError("");
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[A-Za-z][A-Za-z0-9]{3,}$/;
    setUsernameError(
      usernameRegex.test(username)
        ? ""
        : "Username must start with a letter and be at least 4 characters."
    );
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setEmailError(emailRegex.test(email) ? "" : "Invalid email format.");
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(?:\+251|09|07)\d+$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError("Start with +251, 09, or 07 and use only digits.");
    } else if (phone.startsWith("+251") && phone.length !== 13) {
      setPhoneError("+251 numbers must be 13 digits.");
    } else if (
      (phone.startsWith("09") || phone.startsWith("07")) &&
      phone.length !== 10
    ) {
      setPhoneError("09 or 07 numbers must be 10 digits.");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usernameError && !emailError && !phoneError) {
      if (formData.password !== formData.confirmpassword) {
        setConfPassError("Passwords do not match.");
        return;
      }
      if (
        formData.department === "Tsedey Bank" &&
        formData.usertype === "Cashier"
      ) {
        toast.error(`Bank can't have Cashier user type.`);
        return;
      }

      userData ? onEdit(formData) : onSubmit(formData);
    } else {
      alert("Please fix the errors before submitting.");
    }
  };

  useEffect(() => {
    if (!isOpen) handleClose();
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose();
        }
      }}
      disableEscapeKeyDown
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Box
        sx={modalStyle}
        bgcolor={
          theme.palette.mode === "light"
            ? theme.palette.background.paper
            : theme.palette.background.default
        }
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">
            {userData ? "Edit User" : "Add New User"}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={!!userData}
                error={!!usernameError}
                helperText={usernameError}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!userData}
                error={!!emailError}
                helperText={emailError}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={!!phoneError}
                helperText={phoneError}
                disabled={!!userData}
                required
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="User Type"
                name="usertype"
                value={formData.usertype}
                onChange={handleChange}
                disabled={!!userData}
                required
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              >
                {usertypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={!!userData}
                required
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              >
                {departments.map((dep) => (
                  <MenuItem key={dep} value={dep}>
                    {dep}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Hospital Name"
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                disabled={!!userData}
                required
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              >
                {hospitals.map((hosp) => (
                  <MenuItem key={hosp} value={hosp}>
                    {hosp}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={!!userData}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmpassword"
                type="password"
                value={formData.confirmpassword}
                onChange={handleChange}
                required
                disabled={!!userData}
                error={!!confPassError}
                helperText={confPassError}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Role"
                name="role"
                value={userData ? formData.role : "User"}
                onChange={handleChange}
                required
                disabled={!userData}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                    "&.Mui-focused": {
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              >
                {role.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              onClick={handleClose}
              variant="outlined"
              color="error"
              sx={{ mr: 2 }}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
            >
              {userData ? "Save Changes" : "Add User"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

// Responsive Modal Style
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500, md: 600 },
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default AddUserModal;

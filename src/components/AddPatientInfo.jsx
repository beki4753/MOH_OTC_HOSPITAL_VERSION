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
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddPatientInfo = ({
  isOpen,
  onClose,
  onSubmit,
  userData,
  resetUserData,
  adding,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    address: "",
    age: "",
    phone: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [fnameError, setFnameError] = useState("");
  const [addrError, setAddrError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phoneError || fnameError || addrError) {
      toast.error("Please fix The Errors First");
      return;
    }
    onSubmit(formData);
  };
  const isNumber = (value) => !isNaN(parseFloat(value)) && isFinite(value);

  
  useEffect(() => {
    if (userData !== undefined) {
      setFormData({
        fullName: userData?.patientName,
        gender: genders.includes(userData?.patientGender)
          ? userData?.patientGender
          : "",
        address: userData?.patientAddress,
        age: isNumber(userData?.patientAge) ? userData?.patientAge : "",
        phone:
          userData?.patientPhoneNumber === null
            ? ""
            : userData?.patientPhoneNumber,
      });
    }
  }, [userData]);

  const handleClose = () => {
    setFormData({
      fullName: "",
      gender: "",
      address: "",
      age: "",
      phone: "",
    });
    setPhoneError("");
    setFnameError("");
    setAddrError("");
    onClose();
    resetUserData();
  };

  const handleChange = (e) => {
    if (e.target.name === "age" && e.target.value < 0) {
      setFormData({ ...formData, [e.target.name]: Math.abs(e.target.value) });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    if (e.target.name === "phone") {
      validatePhoneNumber(e.target.value);
    }
    if (e.target.name === "fullName") {
      validateFullname(e.target.value);
    }
    if (e.target.name === "address") {
      validateAddres(e.target.value);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

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

  const validateFullname = (fullName) => {
    const regex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/;
    if (!regex.test(fullName)) {
      setFnameError(
        "Please Insert Valid Full Name eg. Alice Johnson or Alice Johnson Doe"
      );
    } else {
      setFnameError("");
    }
  };
  const validateAddres = (address) => {
    const regex = /^[a-zA-Z0-9\s,.'#-]+$/;
    if (!regex.test(address)) {
      setAddrError(
        "Please Insert Valid address eg. 123 Main St or 456 Elm Street, Apt 7 or 789-B Oak Ave"
      );
    } else {
      setAddrError("");
    }
  };
  const genders = ["Male", "Female"];

  return (
    <Modal
      open={isOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose(); // Reset and close the modal
        }
      }}
      disableEscapeKeyDown
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Box sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add Patient Information</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={!!userData}
                  error={!!fnameError}
                  helperText={fnameError}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  name="gender"
                  type="text"
                  value={formData.gender}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                  required
                  //   error={!!emailError}
                  //   helperText={emailError}
                >
                  {genders.map((gend, index) => (
                    <MenuItem key={index} value={gend}>
                      {gend}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
              error={!!phoneError}
              helperText={phoneError}
              required
              disabled={!!userData}
            />
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  margin="normal"
                  required
                  error={!!addrError}
                  helperText={addrError}
                  disabled={!!userData}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={!!userData}
                  inputProps={{
                    min: 1, // Prevents negative values
                    step: "any", // Allows decimal values
                  }}
                />
              </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button onClick={handleClose} color="secondary" sx={{ mr: 2 }}>
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!!userData}
              >
                {adding ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Add Patient Info"
                )}
                
              </Button>
            </Box>
          </form>
        </Grid>
      </Box>
    </Modal>
  );
};

// Modal Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default AddPatientInfo;

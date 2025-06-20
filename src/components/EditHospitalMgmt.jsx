import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Backdrop,
  Grid,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

const ways = ["SMS", "EMAIL"];

const EditHospitalMgmt = ({
  isOpen,
  onClose,
  onSubmit,
  userData,
  resetUserData,
  adding,
}) => {
  const [phoneError, setPhoneError] = useState("");
  const [phoneError2, setPhoneError2] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailError2, setEmailError2] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameError2, setNameError2] = useState("");
  const [formData, setFormData] = useState({
    hospital: "",
    director: "",
    directorEmail: "",
    directorPhone: "",
    district: "",
    districtEmail: "",
    districtPhone: "",
    contactMethode: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.director.length <= 0 ||
      nameError.length > 0 ||
      formData.directorEmail.length <= 0 ||
      emailError.length > 0 ||
      formData.directorPhone.length <= 0 ||
      phoneError.length > 0 ||
      formData.district.length <= 0 ||
      nameError2.length > 0 ||
      formData.districtEmail.length <= 0 ||
      emailError2.length > 0 ||
      formData.districtPhone.length <= 0 ||
      phoneError2.length > 0 ||
      formData.contactMethode.length <= 0
    ) {
      toast.error("Please first fix The Error!!");
      return;
    }
    onSubmit(formData);
  };

  useEffect(() => {
    if (userData !== undefined) {
      setFormData({
        hospital: userData?.hospital || "",
        director: userData?.director || "",
        directorEmail: userData?.directorEmail || "",
        directorPhone: userData?.directorPhone || "",
        district: userData?.district || "",
        districtEmail: userData?.districtEmail || "",
        districtPhone: userData?.districtPhone || "",
        contactMethode: userData?.contactMethode || "",
      });
    }
  }, [userData]);

  const handleClose = () => {
    setFormData({
      hospital: "",
      director: "",
      directorEmail: "",
      directorPhone: "",
      district: "",
      districtEmail: "",
      districtPhone: "",
      contactMethode: "",
    });
    onClose();
    resetUserData();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (name === "districtPhone" || name === "directorPhone") {
      validatePhoneNumber(value, name);
    }
    if (name === "districtEmail" || name === "directorEmail") {
      validateEmail(value, name);
    }

    if (name === "director" || name === "district") {
      validateName(value, name);
    }
  };

  const validatePhoneNumber = (phone, name) => {
    const phoneRegex = /^(?:\+251|09|07)\d+$/;
    if (!phoneRegex.test(phone)) {
      if (name === "directorPhone") {
        setPhoneError(
          "Phone number must start with +251, 09, or 07 and contain only numbers."
        );
      } else {
        setPhoneError2(
          "Phone number must start with +251, 09, or 07 and contain only numbers."
        );
      }
    } else {
      if (phone.startsWith("+251") && phone.length !== 13) {
        if (name === "directorPhone") {
          setPhoneError("Phone number starting with +251 must have 13 digits.");
        } else {
          setPhoneError2(
            "Phone number starting with +251 must have 13 digits."
          );
        }
      } else if (
        (phone.startsWith("09") || phone.startsWith("07")) &&
        phone.length !== 10
      ) {
        if (name === "directorPhone") {
          setPhoneError(
            "Phone number starting with 09 or 07 must have 10 digits."
          );
        } else {
          setPhoneError2(
            "Phone number starting with 09 or 07 must have 10 digits."
          );
        }
      } else {
        if (name === "directorPhone") {
          setPhoneError("");
        } else {
          setPhoneError2("");
        }
      }
    }
  };

  const validateEmail = (email, name) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (name === "directorEmail") {
        setEmailError("Please keep the email format.");
      } else {
        setEmailError2("Please keep the email format.");
      }
    } else {
      if (name === "directorEmail") {
        setEmailError("");
      } else {
        setEmailError2("");
      }
    }
  };

  const validateName = (value, name) => {
    const nameRegx = /^[a-zA-Z\u1200-\u137F]+(?:\s[a-zA-Z\u1200-\u137F]+)*$/;

    if (!nameRegx.test(value)) {
      if (name === "director") {
        setNameError("Please Insert Valid Name.");
      } else {
        setNameError2("Please Insert Valid Name.");
      }
    } else {
      if (name === "director") {
        setNameError("");
      } else {
        setNameError2("");
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

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
          <Typography variant="h6">
            Update District - Director - Hospital Mapping
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  label="Hospital Name"
                  name="hospital"
                  type="text"
                  value={formData.hospital}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Director"
                  name="director"
                  type="text"
                  value={formData.director}
                  onChange={handleChange}
                  margin="normal"
                  error={!!nameError}
                  helperText={nameError}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  label="Director Email"
                  name="directorEmail"
                  type="email"
                  value={formData.directorEmail}
                  onChange={handleChange}
                  margin="normal"
                  error={!!emailError}
                  helperText={emailError}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Director Mobile"
                  name="directorPhone"
                  type="text"
                  value={formData.directorPhone}
                  onChange={handleChange}
                  margin="normal"
                  error={!!phoneError}
                  helperText={phoneError}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="District"
                  name="district"
                  type="text"
                  value={formData.district}
                  onChange={handleChange}
                  margin="normal"
                  error={!!nameError2}
                  helperText={nameError2}
                />
              </Grid>

              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="District Email"
                  name="districtEmail"
                  type="test"
                  value={formData.districtEmail}
                  onChange={handleChange}
                  margin="normal"
                  error={!!emailError2}
                  helperText={emailError2}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="District Mobile"
                  name="districtPhone"
                  type="test"
                  value={formData.districtPhone}
                  onChange={handleChange}
                  margin="normal"
                  error={!!phoneError2}
                  helperText={phoneError2}
                  //disabled={!!userData}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Contact Methode"
                  name="contactMethode"
                  type="test"
                  value={formData.contactMethode}
                  onChange={handleChange}
                  margin="normal"
                  //disabled={!!userData}
                >
                  {ways.map((way) => (
                    <MenuItem key={way} value={way}>
                      {way}
                    </MenuItem>
                  ))}
                </TextField>
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
                //disabled={!!userData}
              >
                {adding ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Update"
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

export default EditHospitalMgmt;

import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SmartModal = ({ open, onClose, username, onSubmit, clearUserData }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!open) {
      handleClose();
    }
  }, [open]);

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

    setValidationError((prevError) => ({
      ...prevError,
      [name]: passwordValidationErrors.join(", "),
    }));
  };

  const handleClose = () => {
    setConfirmPassword("");
    setPassword("");
    setError("");
    clearUserData();
    onClose(); // Close the modal
  };

  const handleSubmit = () => {
    if (password === confirmPassword) {
      if (validationError.newPassword || validationError.confirmPassword) {
        toast.error("Please fix the errors before submitting.");
        return;
      }
      onSubmit(username, password, confirmPassword);
      setError("");
      setValidationError({
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setError("Passwords do not match!");
    }
  };

  return (
    <>
    
    <Modal
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose(); // Reset and close the modal
        }
      }}
    >
      <Box sx={modalStyle}>
        {/* Close Button */}
        <IconButton sx={closeButtonStyle} onClick={onClose}>
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" gutterBottom>
          Set Password for <strong>{username}</strong>
        </Typography>

        {/* Display Username */}
        <TextField
          label="Username"
          fullWidth
          value={username}
          disabled
          sx={{ marginBottom: 2 }}
        />

        {/* Password Fields */}
        <TextField
          label="Password"
          type="password"
          name="newPassword"
          fullWidth
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            validatePassword(e.target.name, e.target.value);
          }}
          error={!!validationError.newPassword}
          helperText={validationError.newPassword}
          sx={{ marginBottom: 2 }}
        />
        <TextField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          fullWidth
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            validatePassword(e.target.name, e.target.value);
          }}
          error={!!validationError.confirmPassword}
          helperText={validationError.confirmPassword}
          sx={{ marginBottom: 2 }}
        />

        {/* Error Message */}
        {error && (
          <Typography color="error" variant="body2" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </Box>
      </Box>
      
    </Modal>
    
    </>
  );
};

// Modal Styling
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  backgroundColor: "white",
  padding: 4,
  borderRadius: 2,
  boxShadow: 24,
};

// Close Button Styling
const closeButtonStyle = {
  position: "absolute",
  top: 10,
  right: 10,
};

export default SmartModal;

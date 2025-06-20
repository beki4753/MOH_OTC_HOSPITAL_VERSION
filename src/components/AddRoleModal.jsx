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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const AddRoleModal = ({
  isOpen,
  onClose,
  onSubmit,
  updateData,
  onEdit,
  resetData,
}) => {
  const [formData, setFormData] = useState({
    role: "",
    description: "",
  });

  const [roleErro, setRoleError] = useState("");

  const handleClose = () => {
    setFormData({
      role: "",
      description: "",
    });
    resetData();
    onClose(); // Close the modal
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "role") {
      validateRole(e.target.value);
    }
  };


  useEffect(() => {
    if (updateData !== undefined) {
      setFormData({
        role: updateData?.name,
        description: updateData?.description,
      });
    }
  }, [updateData]);

  const validateRole = (role) => {
    const usernameRegex = /^[A-Za-z][A-Za-z0-9]{1,}$/;
    if (!usernameRegex.test(role)) {
      setRoleError(
        "Username must start with a letter, be at least 3 characters long, and contain no spaces."
      );
    } else {
      setRoleError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roleErro) {
      if (updateData) {
        onEdit(formData);
      } else {
        onSubmit(formData);
      }
      onClose();
    } else {
      alert("Please fix the errors before submitting.");
    }
  };

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
      <Box sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{updateData ? "Edit Role" : "Add New Role"}</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
            required
            error={!!roleErro}
            helperText={roleErro}
          />
          <TextField
            fullWidth
            label="description"
            name="description"
            type="text"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button onClick={handleClose} color="secondary" sx={{ mr: 2 }}>
              Close
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {updateData ? "Save Changes" : "Add Role"}
            </Button>
          </Box>
        </form>
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
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default AddRoleModal;

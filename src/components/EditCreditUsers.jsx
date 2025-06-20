import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
} from "@mui/material";

const EditCreditUsers = ({
  open,
  onClose,
  creditUserData,
  onSave,
  isloading,
}) => {
  const [editedData, setEditedData] = useState(() =>
    creditUserData !== undefined ? { ...creditUserData } : {}
  );

  useEffect(() => {
    setEditedData(creditUserData);
  }, [creditUserData]);

  const handleChange = (e) => {
    setEditedData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    onSave({ editedData: editedData, message: "Edit" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose(); // Reset and close the modal
        }
      }}
      maxWidth="sm"
      disableEnforceFocus
      fullWidth
    >
      <DialogTitle>Edit Credit Usesr</DialogTitle>
      <DialogContent dividers>
        <TextField
          margin="dense"
          label="Employee ID"
          name="employeeID"
          fullWidth
          value={editedData?.employeeID || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Name"
          name="employeeName"
          fullWidth
          value={editedData?.employeeName || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Phone"
          name="employeePhone"
          fullWidth
          value={editedData?.employeePhone || ""}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Email"
          name="employeeEmail"
          fullWidth
          value={editedData?.employeeEmail || ""}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isloading ? <CircularProgress size={24} color="inherit" /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCreditUsers;

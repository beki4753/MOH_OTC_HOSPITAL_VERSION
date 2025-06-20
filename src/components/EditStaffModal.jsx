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
  useTheme,
} from "@mui/material";

const contactMethods = ["EMAIL", "SMS"];

const EditStaffModal = ({ open, onClose, staffData, onSave, isloading }) => {
  const [editedData, setEditedData] = useState(() =>
    staffData !== undefined ? { ...staffData } : {}
  );

  const theme = useTheme();

  useEffect(() => {
    setEditedData(staffData);
  }, [staffData]);

  const handleChange = (e) => {
    setEditedData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    onSave(editedData);
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
      <DialogTitle>Edit Staff</DialogTitle>
      <DialogContent dividers>
        <TextField
          margin="dense"
          label="Employee ID"
          name="employeeID"
          fullWidth
          value={editedData?.employeeID || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <TextField
          margin="dense"
          label="Name"
          name="employeeName"
          fullWidth
          value={editedData?.employeeName || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <TextField
          margin="dense"
          label="Phone"
          name="employeePhone"
          fullWidth
          value={editedData?.employeePhone || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <TextField
          margin="dense"
          label="Email"
          name="employeeEmail"
          fullWidth
          value={editedData?.employeeEmail || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <TextField
          margin="dense"
          label="Assigned As"
          name="assignedAs"
          fullWidth
          value={editedData?.assignedAs || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <TextField
          margin="dense"
          label="Assigned By"
          name="assignedBy"
          fullWidth
          value={editedData?.assignedBy || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <TextField
          select
          margin="dense"
          label="Contact Method"
          name="contactMethod"
          fullWidth
          value={editedData?.contactMethod || ""}
          onChange={handleChange}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
          {contactMethods.map((method) => (
            <MenuItem key={method} value={method}>
              {method}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
        >
          {isloading ? <CircularProgress size={24} color="inherit" /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStaffModal;

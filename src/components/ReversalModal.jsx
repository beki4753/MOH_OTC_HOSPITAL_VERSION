import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import { renderETDateAtCell } from "./PatientSearch";
import { formatAccounting } from "../pages/hospitalpayment/HospitalPayment";
function ReversalModal({ open, onClose, receipt, onConfirm, loading, theme }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const letterNumberCheck = (value) => {
    const comp = /^[a-zA-Z0-9\u1200-\u137F\s]+$/;

    return !comp.test(value) && value.length > 0;
  };

  const handleSubmit = () => {
    try {
      if (!reason.trim()) {
        setError("Reversal reason is required.");
        return;
      }

      if (reason.length < 10) {
        setError("Please describe it using more than 10 characters.");
        return;
      }

      if (letterNumberCheck(reason)) {
        setError("Please insert letters or numbers only.");
        return;
      }

      const payload = {
        paymentRefNo: receipt?.referenceNo,
        paymentType: receipt?.paymentType || "-",
        cardNumber: receipt?.patientCardNumber || "-",
        amount: [
          {
            amount: -receipt?.paymentAmount || 0,
            purpose: receipt?.paymentReason || "-",
          },
        ],
        description: reason || "-",
        channel: receipt?.paymentChannel || "-",
        organization: receipt?.patientWorkingPlace || "-",
        paymentVerifingID: receipt?.paymentVerifingID || "-",
        patientWorkID: receipt?.patientWorkID || "-",
        reverse: true,
      };

      onConfirm(payload);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  const handleChange = (e) => {
    try {
      setReason(e.target.value);
    } catch (error) {
      console.error("This is handle change error: ", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose();
        }
      }}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
    >
      <DialogTitle>Reversal Request</DialogTitle>
      <DialogContent>
        <Box
          mb={3}
          p={2}
          borderRadius={2}
          sx={{ boxShadow: "inset 0px 0px 3px 2px #0000008a" }}
          bgcolor={theme.palette.mode === "light" && "#f9f9f9"}
        >
          <Typography variant="h6" gutterBottom>
            📄 Receipt Summary
          </Typography>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Receipt No:</Typography>
            <Typography fontWeight={600}>{receipt?.referenceNo}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Patient Name:</Typography>
            <Typography fontWeight={600}>{receipt?.patientName}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Payment Reason:</Typography>
            <Typography fontWeight={500}>{receipt?.paymentReason}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Amount Paid:</Typography>
            <Typography fontWeight={700} color="green">
              {formatAccounting(receipt?.paymentAmount)}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" py={0.5}>
            <Typography color="text.secondary">Date:</Typography>
            <Typography fontStyle="italic" fontWeight={500}>
              {renderETDateAtCell(receipt?.registeredOn)}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box mt={5}>
          <TextField
            label="Reason for Reversal"
            multiline
            fullWidth
            rows={3}
            required
            //value={reason}
            onChange={(e) => handleChange(e)}
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
        </Box>

        {error && (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleSubmit()}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Confirm Reversal"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReversalModal;

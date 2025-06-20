import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DataGrid } from "@mui/x-data-grid";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";

export default function PatientTransactionsModal({ open, onClose, rows }) {
  const theme = useTheme();

  // Get shared patient card number and name from the first row
  const sharedCardNumber = rows?.[0]?.patientCardNumber || "";
  const sharedPatientName = rows?.[0]?.patientFName || "";

  const columns = [
    {
      field: "catagory",
      headerName: "Category",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "service",
      headerName: "Services",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        return formatAccounting2(params?.row?.amount);
      },
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose(); // Reset and close the modal
        }
      }}
      maxWidth="md"
      fullWidth
      scroll="paper"
      disableEnforceFocus // to remove focus warning
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Payment Detail
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ height: { xs: "60vh", sm: "70vh", md: "60vh" } }}
      >
        {/* Display Shared Info */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[700],
            borderRadius: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1">
            <strong>Card Number:</strong> {sharedCardNumber}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Patient Name:</strong> {sharedPatientName}
          </Typography>
        </Box>

        {/* Transactions Table */}
        <DataGrid
          rows={rows || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          autoHeight
          disableSelectionOnClick
          sx={{
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: theme.palette.action.hover,
            },
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: theme.palette.action.selected,
            },
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose()} variant="contained" color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PatientTransactionsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      patientCardNumber: PropTypes.string.isRequired,
      patientFName: PropTypes.string.isRequired,
      catagory: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
    })
  ).isRequired,
};

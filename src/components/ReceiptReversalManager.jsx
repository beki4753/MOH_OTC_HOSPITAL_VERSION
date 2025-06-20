import React, { useState } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ReversalModal from "./ReversalModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import { renderETDateAtCell } from "./PatientSearch";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";

const ReceiptReversalManager = () => {
  const [searchRef, setSearchRef] = useState("");
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reversalLoad, setReversalLoad] = useState(false);

  const theme = useTheme();

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const response = await api.put("/Payment/payment-by-refno", {
        paymentId: searchRef,
      });
      const modData =
        response?.data?.length > 0
          ? response?.data?.map(({ rowId, ...rest }) => ({
              id: rowId,
              ...rest,
            }))
          : [];

      if (modData?.length <= 0) {
        toast.info("Data not found.");
        return;
      }

      setFilteredReceipts(modData);
    } catch (error) {
      console.error("This is search error: ", error);
      toast.error(error?.response?.data?.msg || "Unable to search.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (receipt) => {
    setSelectedReceipt(receipt);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedReceipt(null);
    setReversalLoad(false);
  };

  const handleReversal = async (data) => {
    try {
      setReversalLoad(true);

      const response = await api.post("/Payment/add-payment", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response?.data?.refNo?.length > 0) {
        toast.success("Transaction Reversed Successfully.");
        setModalOpen(false);
        setFilteredReceipts([]);
        setSearchRef("");
      }
    } catch (error) {
      console.error("This is reversal handler error: ", error);
      toast.error(
        error?.response?.data?.msg || "Something went wrong! Unable to reverse."
      );
    } finally {
      setReversalLoad(false);
    }
  };

  const columns = [
    { field: "referenceNo", headerName: "Receipt No", flex: 1 },
    { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
    { field: "patientName", headerName: "Patient", flex: 1 },
    {
      field: "paymentAmount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        return formatAccounting2(params?.row?.paymentAmount);
      },
    },
    { field: "paymentType", headerName: "Type", flex: 1 },
    { field: "paymentReason", headerName: "Reason", flex: 1 },
    {
      field: "registeredOn",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.registeredOn);
      },
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="warning"
          onClick={() => handleOpenModal(params.row)}
        >
          Reverse
        </Button>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Receipt Reversal
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Search by Reference"
          variant="outlined"
          size="small"
          value={searchRef}
          onChange={(e) => setSearchRef(e.target.value)}
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
        <Button
          variant="contained"
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
          disabled={isLoading}
          onClick={handleSearch}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Search"
          )}
        </Button>
      </Box>

      <DataGrid
        rows={filteredReceipts}
        columns={columns}
        loading={isLoading}
        autoHeight
        disableSelectionOnClick
      />

      <ReversalModal
        open={modalOpen}
        onClose={handleModalClose}
        receipt={selectedReceipt}
        onConfirm={handleReversal}
        loading={reversalLoad}
        theme={theme}
      />
      <ToastContainer />
    </Box>
  );
};

export default ReceiptReversalManager;

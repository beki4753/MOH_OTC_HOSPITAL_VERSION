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
import LockIcon from "@mui/icons-material/Lock";
import { renderETDateAtCell } from "./PatientSearch";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";

const ReceiptReversalManager = () => {
  const [searchRef, setSearchRef] = useState("");
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reversalLoad, setReversalLoad] = useState(false);
  const [errorM, setErrorM] = useState("");
  const [isCalcul, setIsCalcul] = useState(false);

  const theme = useTheme();

  const ReceiptRegex = /^[a-zA-Z0-9-]+$/;

  const validateReceipt = (value) => {
    if (!ReceiptRegex.test(value) && value?.length > 0) {
      setErrorM("Please Insert Valid Receipt Number.");
    } else {
      setErrorM("");
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      if (searchRef?.length <= 0) {
        toast.error("Please Insert Reference Number First.");
        return;
      }

      if (!!errorM) {
        toast.error("Please Insert (VALID) Reference Number.");
        return;
      }
      setFilteredReceipts([]);
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

  const handleOpenModal = async () => {
    try {
      setIsCalcul(true);
      if (filteredReceipts?.length <= 0) {
        toast.error("No Data.");
        return;
      }
      const result = await filteredReceipts.reduce((acc, curr) => {
        for (const key in curr) {
          if (key === "paymentAmount") {
            acc.paymentAmount = (acc.paymentAmount || 0) + curr.paymentAmount;
          } else if (key === "paymentReason") {
            acc.paymentReason = acc.paymentReason
              ? acc.paymentReason + ", " + curr.paymentReason
              : curr.paymentReason;
          } else {
            acc[key] = acc[key] || curr[key];
          }
        }
        return acc;
      }, {});
      setSelectedReceipt(result);
      setIsCalcul(false);
      setModalOpen(true);
      return;
    } catch (error) {
      console.error("This is handle Open Modal handler Error: ", error);
    } finally {
      setIsCalcul(false);
    }
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
      if (response?.status === 200) {
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
      field: "Status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) =>
        params?.row?.isReversed && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: 0,
              marginTop: "0",
              color: "red",
              gap: "3px",
            }}
          >
            <LockIcon color="error" fontSize="small" />
            <span>Reversed</span>
          </p>
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
          onChange={(e) => {
            setSearchRef(e.target.value);
            validateReceipt(e.target.value);
          }}
          error={!!errorM}
          helperText={errorM}
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
          onClick={() => handleSearch()}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Search"
          )}
        </Button>
      </Box>
      <Box justifySelf={"flex-end"} sx={{ margin: "10px" }}>
        {isCalcul ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleOpenModal()}
            disabled={
              isCalcul ||
              filteredReceipts?.some((item) => item.isReversed === true)
            }
          >
            Reverse
          </Button>
        )}
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

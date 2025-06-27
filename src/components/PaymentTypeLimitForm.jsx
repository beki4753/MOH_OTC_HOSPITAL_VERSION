import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  IconButton,
  useTheme,
} from "@mui/material";
import api from "../utils/api";
import { normalizeText } from "../utils/normalizer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataGrid } from "@mui/x-data-grid";
import { CircularProgress } from "@mui/material";
import { DeleteIcon, EditIcon } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

const initialState = {
  type: "",
  amount: "",
  time: "",
};

export const isEmpty = (val) =>
  val === null ||
  val === undefined ||
  (typeof val === "string" && val.trim() === "") ||
  (typeof val === "number" && isNaN(val));

const PaymentTypeLimitForm = () => {
  const [form, setForm] = useState(initialState);
  const [formError, setFormError] = useState(initialState);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [fullPaymentTypes, setFullPaymentTypes] = useState([]);
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState({});
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const theme = useTheme();

  // Fetch and map limits
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const res = await api.get("/Setting/paymentType-limit");
        const limitsData = res?.data?.data || [];
        // Enrich type from fullPaymentTypes
        const enrichedData = limitsData.map((item, index) => {
          const match = fullPaymentTypes.find((p) => p.id === item.type);
          return {
            id: index + 1,
            mainId: item.id,
            type: match?.type || `Type ID: ${item.type}`,
            amount: item.amount,
            time: item.time,
            createdBy: item.createdBy || "-",
          };
        });

        setLimits(enrichedData);
      } catch (err) {
        console.error("Error loading limits:", err);
      } finally {
        setLoading(false);
      }
    };

    if (fullPaymentTypes.length > 0) {
      fetchLimits();
    }
  }, [fullPaymentTypes, refresh]);

  // Generalized fetch function
  const fetchData = async (endpoint) => {
    try {
      const response = await api.get(endpoint);
      const response2 = await api.get("/Lookup/payment-type-description");
      if (response?.status === 200 || response?.status === 201) {
        const modData = response?.data
          ?.map((item) => item.type)
          .filter((item) => !normalizeText(item)?.includes("all"));
        setPaymentTypes(modData);
      }
      if (response2.status === 200) {
        setFullPaymentTypes(response2?.data?.data);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  // Fetch Payment Methods
  useEffect(() => {
    fetchData("/Lookup/payment-type");
  }, []);

  const handleChange = (e) => {
    try {
      const { name, value } = e.target;
      const key = normalizeText(name);

      let transformedValue = value;

      if (["amount", "time"].includes(key)) {
        const numericValue = Math.abs(Number(value));
        transformedValue =
          key === "amount" ? parseFloat(numericValue) : parseInt(numericValue);
      }

      setForm((prev) => ({
        ...prev,
        [name]: transformedValue,
      }));

      setFormError((prev) => ({
        ...prev,
        [name]: "",
      }));
    } catch (error) {
      console.error("This is handle change error: ", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (Object.values(form || {}).some(isEmpty)) {
        toast.info("Please fill all fields.");

        Object.entries(form || {}).forEach(([key, value]) => {
          if (isEmpty(value)) {
            setFormError((prev) => ({
              ...prev,
              [key]: "Please fill this field.",
            }));
          }
        });

        return;
      }

      setSaveLoading(true);
      const payload = {
        id: isEdit
          ? form?.mainId
          : fullPaymentTypes.filter(
              (item) => normalizeText(item?.type) === normalizeText(form?.type)
            )[0]?.id,
        type: form.type,
        amount: parseFloat(form.amount),
        time: parseInt(form.time),
      };

      if (isEdit) {
        const response = await api.put("/Setting/paymentType-limit", payload);

        if (response?.status === 200) {
          toast.success(response?.data?.msg || "Updated successfully.");
          setForm(initialState);
          setIsEdit(false);
          setRefresh((prev) => !prev);
        }
      } else {
        const response = await api.post("/Setting/paymentType-limit", payload);
        if (response?.status === 200 || response?.status === 201) {
          toast.success(response?.data?.msg || "Created successfully.");
          setForm(initialState);
          setRefresh((prev) => !prev);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(error?.response?.data?.msg || "Internal Server error.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = async (params) => {
    try {
      setIsEdit(true);
      setForm(params?.row);
    } catch (error) {
      console.error("This is handle edit error: ", error);
    }
  };

  const handleDelete = async (params) => {
    try {
      if (params?.message === "Delete") {
        setIsDeleteLoading(true);

        const response = await api.delete("/Setting/paymentType-limit", {
          headers: {
            "Content-Type": "application/json",
          },
          data: selectedDeleteUser?.mainId || 0,
        });

        if (response?.status === 200) {
          toast.success(response?.data?.msg || "Deleted Successfully.");
          setSelectedDeleteUser({});
          setConfirmModalOpen(false);
          setRefresh((prev) => !prev);
          return;
        }
      }

      //start delete confirmation task
      setSelectedDeleteUser(params);
      setConfirmModalOpen(true);
    } catch (error) {
      console.error("This is handle delete error: ", error);
      toast.error(error?.response?.data?.msg || "Internal server error.");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialState);
    setIsEdit(false);
  };

  const columns = [
    { field: "id", headerName: "#", width: 60 },
    { field: "type", headerName: "Payment Type", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1 },
    { field: "time", headerName: "Time Limit", flex: 1 },
    { field: "createdBy", headerName: "Created By", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => handleEdit(params)}
            aria-label="edit"
            className="text-info"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row)}
            color="danger"
            aria-label="delete"
            className="text-danger"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Paper elevation={3} sx={{ p: 4, mx: "auto", mt: 5, marginInline: "15px" }}>
      <Typography variant="h6" gutterBottom>
        Set Payment Type Limit
      </Typography>

      <TextField
        select
        fullWidth
        label="Payment Type"
        name="type"
        value={form?.type}
        onChange={handleChange}
        sx={{ mb: 3 }}
        required
        error={!!formError?.type}
        helperText={formError?.type}
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
        {paymentTypes.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Amount"
        type="number"
        name="amount"
        value={form?.amount}
        onWheel={(e) => e.target.blur()}
        onChange={handleChange}
        sx={{ mb: 3 }}
        required
        error={!!formError?.amount}
        helperText={formError?.amount}
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
        fullWidth
        label="Time Limit (in Hours)"
        type="number"
        name="time"
        value={form?.time}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        sx={{ mb: 3 }}
        required
        error={!!formError?.time}
        helperText={formError?.time}
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

      <Box textAlign="right">
        <Button variant="outlined" color="error" onClick={handleCancel}>
          cancel
        </Button>
        <Button
          variant="contained"
          sx={{ marginLeft: "10px" }}
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
          onClick={() => handleSubmit()}
        >
          {saveLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <>{isEdit ? "Update" : "Save"}</>
          )}
        </Button>
      </Box>
      <ToastContainer />
      <Typography variant="h6" mt={6} mb={2}>
        Existing Payment Type Limits
      </Typography>

      <Box sx={{ height: 400, width: "100%", mt: 2 }}>
        <DataGrid rows={limits} columns={columns} loading={loading} />
      </Box>

      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        userData={selectedDeleteUser?.type}
        onConfirm={(data) => handleDelete(data)}
        showUser={false}
        loading={isDeleteLoading}
      />
    </Paper>
  );
};

export default PaymentTypeLimitForm;

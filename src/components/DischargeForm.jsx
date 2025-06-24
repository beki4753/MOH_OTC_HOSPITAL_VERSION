import React, { useEffect, useReducer, useState } from "react";
import {
  TextField,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  Divider,
  Box,
  CircularProgress,
  InputAdornment,
  MenuItem,
  useTheme,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { fetchPatientData } from "../services/open_mrs_api_call";
import { ToastContainer, toast } from "react-toastify";
import api from "../utils/api";
import { registerUser } from "../services/user_service"; // Assuming this is needed
import EtDatePicker from "mui-ethiopian-datepicker";
import {
  formatAccounting,
  formatAccounting2,
} from "../pages/hospitalpayment/HospitalPayment";
import { DataGrid } from "@mui/x-data-grid";
import { renderETDateAtCell } from "./PatientSearch";
import PatientTransactionsModal from "./PatientTransactionsModal";

const initialState = {
  services: [],
  patientCardNumber: "",
  patientName: "",
  medicationUse: "",
  admissionDate: "",
  dischargeDate: "",
  patientCondition: "",
};
const controllerError = (state, action) => {
  if (action.name === "Reset") return initialState;

  if (action.org === "services") {
    const services = [...(state.services || [])];

    if (!services[action.index]) {
      services[action.index] = { name: "", quantity: "", unitCost: "" };
    }

    const updatedServices = services.map((item, i) => {
      if (i === action.index) {
        return { ...item, [action.name]: action.values };
      }
      return item;
    });

    return { ...state, services: updatedServices };
  }

  if (action.name === "Add Services") {
    return {
      ...state,
      services: [
        ...(state?.services || []),
        { name: "", quantity: "", unitCost: "" },
      ],
    };
  }

  if (action.name === "Remove Services") {
    return {
      ...state,
      services: (state.services || []).filter((_, i) => i !== action.index),
    };
  }

  return { ...state, [action.name]: action.values };
};

const DischargeForm = () => {
  const theme = useTheme();
  const [formData, setFromData] = useState(initialState);
  const [formDataError, setFromDataError] = useReducer(
    controllerError,
    initialState
  );
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.put("/Patient/get-nurse-request", {});
        if (response?.status === 200) {
          const modData =
            response?.data?.length > 0
              ? response?.data?.map(
                  (
                    {
                      patientFirstName,
                      patientMiddleName,
                      patientLastName,
                      ...rest
                    },
                    index
                  ) => ({
                    patientFName: `${patientFirstName} ${patientMiddleName} ${patientLastName}`,
                    id: index + 1,
                    ...rest,
                  })
                )
              : [];

          setRowData(
            modData?.sort(
              (a, b) => new Date(b.createdOn) - new Date(a.createdOn)
            )
          );
        }
      } catch (error) {
        console.error("This is fetch data error: ", error);
      }
    };
    fetchData();
  }, [refresh]);

  // Columns definition
  const columns = [
    { field: "patientCardNumber", headerName: "Card No", flex: 1 },
    { field: "patientFName", headerName: "Patient Name", flex: 1 },
    { field: "patientGender", headerName: "Gender", flex: 1 },
    {
      field: "totalPrice",
      headerName: "Total",
      flex: 1,
      renderCell: (params) => {
        return formatAccounting2(params?.row?.totalPrice);
      },
    },
    {
      field: "paid",
      headerName: "Paid",
      flex: 1,
      renderCell: (params) => (params.value ? "✅" : "❌"),
    },

    { field: "createdBy", headerName: "Created By", width: 100 },
    {
      field: "createdOn",
      headerName: "Created On",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.createdOn);
      },
    },
  ];

  const handleDetailClose = () => {
    setOpenDetail(false);
    setDetailData([]);
  };

  const handleDoubleClick = (data) => {
    try {
      const services = (data.row.rquestedServices || [])?.map(
        ({ services, ...rest }) => ({
          service: services,
          ...rest,
          catagory: "Used Service",
        })
      );

      setOpenDetail(true);

      const dataToSet =
        services.length > 0
          ? services.map((item, index) => ({
              id: index + 1,
              patientFName: data.row.patientFName,
              patientCardNumber: data.row.patientCardNumber,
              ...item, // includes amount, service, catagory
            }))
          : [];
      setDetailData(dataToSet);
    } catch (error) {
      console.error("Double-click error: ", error);
      toast.error("Unable to open Detail Data.");
    }
  };

  const validateMrn = (name, value) => {
    const mrnRegex = /^[0-9]{5,}$/;
    if (!mrnRegex.test(value) && value?.length > 0) {
      setFromDataError({
        name: name,
        values: "Please insert a valid MRN (at least 5 digits, numbers only).",
      });
      return false;
    } else {
      setFromDataError({
        name: name,
        values: "",
      });
      return true;
    }
  };

  const handleCancel = () => {
    setFromData(initialState);
    setFromDataError({ name: "Reset" });
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    if (fieldName === "dischargeDate") {
      const admissionDate = formData?.admissionDate;
      const dischargeDate = selectedDate;

      if (admissionDate && dischargeDate < admissionDate) {
        setFromData((prev) => ({
          ...prev,
          [fieldName]: selectedDate,
        }));
        setFromDataError({
          name: fieldName,
          values: `Discharge date cannot be before admission date (${renderETDateAtCell(
            admissionDate
          )})`,
        });
        return;
      }
    }

    setFromData((prev) => ({
      ...prev,
      [fieldName]: selectedDate,
    }));
    setFromDataError({ name: fieldName, values: "" });
  };

  const handleChange = (e, index) => {
    if (e.target.name === "patientCardNumber") {
      setFromData((prev) => ({ ...prev, patientName: "" }));
      validateMrn(e.target.name, e.target.value);
    }

    if (["quantity", "unitCost", "name"]?.includes(e.target.name)) {
      const updated = [...formData?.services];
      updated[index][e.target.name] =
        e.target.name !== "name" && e.target.value?.length > 0
          ? parseFloat(Math.abs(e.target.value))
          : e.target.value;
      setFromData((prev) => ({ ...prev, services: updated }));
      if (e.target.name === "name") {
        letterOnlyCheck(index, e.target.name, e.target.value);
      } else {
        zeroValueCheck(index, e.target.name, e.target.value);
      }

      return;
    }

    if (e.target.name === "medicationUse") {
      setFromData({
        ...formData,
        [e.target.name]:
          e.target.value === "Yes"
            ? true
            : e.target.value === "No"
            ? false
            : null,
      });
      setFromDataError({ name: e.target.name, values: "" });
      return;
    }
    if (e.target.name === "patientCondition") {
      letterOnly(e.target.name, e.target.value);
    }

    if (e.target.name === "patientName") {
      setFromData({ ...formData, [e.target.name]: e.target.value });
      setFromDataError({ name: e.target.name, values: "" });
      return;
    }

    setFromData({ ...formData, [e.target.name]: e.target.value });
  };

  const letterOnlyCheck = (index, key, value) => {
    const regex = /^[A-Za-z\s]+$/;
    if (!regex.test(value) && value?.length > 0) {
      setFromDataError({
        name: key,
        index: index,
        values: "Only letters and spaces allowed.",
        org: "services",
      });
    } else {
      setFromDataError({
        name: key,
        index: index,
        values: "",
        org: "services",
      });
    }
  };

  const zeroValueCheck = (index, key, rawValue) => {
    const value = Number(rawValue); // Ensures "0" (string) is converted to 0 (number)

    if (value === 0) {
      setFromDataError({
        org: "services",
        index,
        name: key,
        values: "Zero value is not allowed.",
      });
    } else {
      // Clear previous error
      setFromDataError({
        org: "services",
        index,
        name: key,
        values: "",
      });
    }
  };

  const letterOnly = (key, value) => {
    const regex = /^[A-Za-z\s]+$/;
    if (!regex.test(value) && value?.length > 0) {
      setFromDataError({
        name: key,
        values: "Only letters and spaces allowed.",
      });
    } else {
      setFromDataError({
        name: key,
        values: "",
      });
    }
  };

  const handleGetPatientName = async () => {
    if (formData?.patientName?.length <= 0) {
      try {
        setIsFetching(true);

        if (
          formDataError?.patientCardNumber?.length <= 0 &&
          formData?.patientCardNumber?.length > 0
        ) {
          const response = await fetchPatientData(
            Number(formData?.patientCardNumber)
          );

          if (
            response?.patientFirstName ||
            response?.patientMiddleName ||
            response?.patientLastName
          ) {
            const fullName = `${response?.patientFirstName || ""} ${
              response?.patientMiddleName || ""
            } ${response?.patientLastName || ""}`.trim();
            setFromData((prev) => ({ ...prev, patientName: fullName }));
          } else {
            toast.error(
              response?.response?.data?.details || "Card Number Not Registered."
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
        toast.error("Failed to fetch patient data.");
        setFromData((prev) => ({ ...prev, patientName: "" }));
      } finally {
        setIsFetching(false);
      }
    }
  };
  const handleAddService = () => {
    setFromData((prev) => ({
      ...prev,
      services: [
        ...(prev?.services || []),
        { name: "", quantity: "", unitCost: "" },
      ],
    }));
    setFromDataError({ name: "Add Services" });
  };

  const handleRemoveService = (index) => {
    const updated = [...formData?.services];
    setFromData((prev) => ({
      ...prev,
      services: updated.filter((_, i) => i !== index),
    }));

    setFromDataError({ name: "Remove Services", index: index });
  };

  const totalCost =
    formData?.services?.length > 0
      ? formData?.services?.reduce(
          (acc, item) => acc + item.quantity * item.unitCost,
          0
        )
      : 0;

  // Effect for updating Bed service based on admission and discharge dates
  useEffect(() => {
    if (formData?.admissionDate && formData?.dischargeDate) {
      const getDateDifference = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 1;
      };

      const stayDuration = getDateDifference(
        formData?.admissionDate,
        formData?.dischargeDate
      );

      setFromData((prev) => {
        const updatedServices = [...(prev.services || [])];

        const bedServiceIndex = updatedServices.findIndex(
          (service) => service.name === "Bed"
        );

        if (bedServiceIndex !== -1) {
          updatedServices[bedServiceIndex] = {
            ...updatedServices[bedServiceIndex],
            quantity: stayDuration,
          };
        } else {
          updatedServices.unshift({
            name: "Bed",
            quantity: stayDuration,
            unitCost: 0,
          });
        }

        return {
          ...prev,
          services: updatedServices,
        };
      });
    } else if (!formData?.admissionDate || !formData?.dischargeDate) {
      setFromData((prev) => ({
        ...prev,
        services:
          prev.services?.filter((service) => service.name !== "Bed") || [],
      }));
    }
  }, [formData?.admissionDate, formData?.dischargeDate]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const noServices = Object.entries(formData || {}).filter(
        ([key]) => key !== "services"
      );

      const noServicesError = Object.entries(formDataError || {}).filter(
        ([key]) => key !== "services"
      );

      //1. Check if any non-service field has error
      if (noServicesError.some(([_, value]) => value?.length > 0)) {
        toast.error("Please first fix the error.");
        return;
      }

      //2. Check if any service field has error
      const hasServiceError = (formDataError?.services || []).some(
        (serviceError) =>
          Object.values(serviceError || {}).some((value) => value?.length > 0)
      );

      if (hasServiceError) {
        toast.error("Please fix errors in service fields.");
        return;
      }

      // 3. Check if any non-service field is empty
      const hasEmptyMainFields = noServices.some(
        ([_, value]) => !value || value?.length <= 0
      );

      if (hasEmptyMainFields) {
        toast.error("Please fill the required fields.");

        // Dispatch error for each empty main field
        noServices.forEach(([key, value]) => {
          if (!value || value.length <= 0) {
            setFromDataError({
              name: key,
              values: "Please fill this field",
            });
          }
        });

        return;
      }

      //4. Check if there is no Service add
      if (formData?.services?.length <= 0) {
        toast.error("Please insert at least one service.");
        return;
      }

      //5. Check if any service field is empty
      const hasServiceEmpty = (formData?.services || []).some(
        (service, index) =>
          Object.entries(service || {}).some(([field, value]) => {
            const isEmpty = !value || value?.length <= 0;
            if (isEmpty) {
              setFromDataError({
                org: "services",
                index,
                name: field,
                values: "Please fill this field",
              });
            }
            return isEmpty;
          })
      );

      if (hasServiceEmpty) {
        toast.error("Please insert at least one valid service.");
        return;
      }

      // const userDataResponse = await fetchPatientData(patientCardNumber);

      // const msg = await registerUser(userDataResponse);
      // if (msg?.toLowerCase().includes("internal server error.")) {
      //   toast.error(
      //     "Something is wrong with user registration. Please try again!"
      //   );
      //   return;
      // }

      const payload = {
        patientCardNumber: formData?.patientCardNumber,
        dischargeDate: formData?.dischargeDate,
        admissionDate: formData?.admissionDate,
        hasMedication: formData?.medicationUse,
        patientCondition: formData?.patientCondition,
        services: formData?.services.map((s) => ({
          service: s.name,
          amount: s.quantity,
          price: s.unitCost,
        })),
      };

      const response = await api.post(`/Patient/add-nurse-request`, payload);
      if (response?.status === 200) {
        setRefresh((prev) => !prev);
        setFromData(initialState);
        setFromDataError({ name: "Reset" });
        toast.success("Submitted Successfully.");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor:
          theme.palette.mode === "light"
            ? "#f5f7fb"
            : theme.palette.background.default,
        minHeight: "100vh",
        py: 6,
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
      {/* Form Container */}
      <Paper
        elevation={6}
        sx={{
          p: { xs: 3, sm: 5, md: 6 },
          borderRadius: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          gutterBottom
        >
          Patient Discharge Summary
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Card / MRN Number"
              fullWidth
              required
              name="patientCardNumber"
              value={formData?.patientCardNumber}
              onChange={handleChange}
              onBlurCapture={handleGetPatientName}
              error={!!formDataError?.patientCardNumber}
              helperText={formDataError?.patientCardNumber}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isFetching && <CircularProgress size={24} />}
                  </InputAdornment>
                ),
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
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
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              label="Patient Name"
              fullWidth
              required
              name="patientName"
              value={formData?.patientName}
              onChange={handleChange}
              error={!!formDataError?.patientName}
              helperText={formDataError?.patientName}
              InputProps={{
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
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
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Medication Use"
              name="medicationUse"
              fullWidth
              required
              value={
                formData?.medicationUse === null ||
                formData?.medicationUse === ""
                  ? ""
                  : formData?.medicationUse
                  ? "Yes"
                  : "No"
              }
              error={!!formDataError?.medicationUse}
              helperText={formDataError?.medicationUse}
              onChange={handleChange}
              InputProps={{
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
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
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} md={3}>
            <EtDatePicker
              key={formData?.admissionDate || "admissionDate-date"}
              label="Date of Admission"
              name="admissionDate"
              fullWidth
              required
              value={
                formData?.admissionDate
                  ? new Date(formData?.admissionDate)
                  : null
              }
              onChange={(e) => handleChangeTime("admissionDate", e)}
              error={!!formDataError?.admissionDate}
              helperText={formDataError?.admissionDate}
              InputProps={{
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
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
          </Grid>

          <Grid item xs={6} md={3}>
            <EtDatePicker
              key={formData?.dischargeDate || "dischargeDate-date"}
              label="Date of Discharge"
              name="dischargeDate"
              fullWidth
              required
              value={
                formData?.dischargeDate
                  ? new Date(formData?.dischargeDate)
                  : null
              }
              onChange={(e) => handleChangeTime("dischargeDate", e)}
              error={!!formDataError?.dischargeDate}
              helperText={formDataError?.dischargeDate}
              InputProps={{
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
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
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Patient Condition (e.g., Discharged / Death)"
              name="patientCondition"
              fullWidth
              required
              value={formData?.patientCondition}
              onChange={handleChange}
              error={!!formDataError?.patientCondition}
              helperText={formDataError?.patientCondition}
              InputProps={{
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
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
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={600} gutterBottom>
          Services Provided
        </Typography>

        {formData?.services.map((item, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            alignItems="center"
            sx={{
              mb: 1,
              px: 2,
              py: 1.5,
              backgroundColor: theme.palette.action.hover,
              borderRadius: 2,
            }}
          >
            <Grid item xs={12} sm={5} md={4}>
              <TextField
                label="Service Name"
                name="name"
                fullWidth
                required
                value={item?.name}
                onChange={(e) => handleChange(e, index)}
                error={!!formDataError?.services[index]?.name}
                helperText={formDataError?.services[index]?.name}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
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
            </Grid>

            <Grid item xs={4} sm={2}>
              <TextField
                label="Qty"
                type="number"
                name="quantity"
                required
                fullWidth
                inputProps={{ min: 0 }}
                onWheel={(e) => e.target.blur()}
                value={item?.quantity}
                onChange={(e) => handleChange(e, index)}
                error={!!formDataError?.services[index]?.quantity}
                helperText={formDataError?.services[index]?.quantity}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
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
            </Grid>

            <Grid item xs={4} sm={2}>
              <TextField
                label="Unit Cost"
                type="number"
                name="unitCost"
                required
                fullWidth
                onWheel={(e) => e.target.blur()}
                value={item?.unitCost}
                onChange={(e) => handleChange(e, index)}
                error={!!formDataError?.services[index]?.unitCost}
                helperText={formDataError?.services[index]?.unitCost}
                InputProps={{
                  sx: {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
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
            </Grid>

            <Grid item xs={4} sm={2}>
              <Typography fontWeight={500}>
                {formatAccounting(item?.quantity * item?.unitCost)} ብር
              </Typography>
            </Grid>

            <Grid item xs={12} sm={1}>
              <IconButton
                color="error"
                onClick={() => handleRemoveService(index)}
              >
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button
          startIcon={<Add />}
          onClick={handleAddService}
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
          variant="outlined"
          sx={{
            my: 2,
            textTransform: "none",
            borderStyle: "dashed",
            fontWeight: 500,
          }}
        >
          Add Service
        </Button>

        <Box display="flex" justifyContent="flex-end" sx={{ my: 3 }}>
          <Button variant="outlined" color="error" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="flex-end" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Total: {formatAccounting(totalCost)} ብር
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleSubmit}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Submit to Cashier"
          )}
        </Button>
        <Divider sx={{ mb: 4 }} />
        {/* Table Section */}
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          gutterBottom
        >
          Sent Requests
        </Typography>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 4,
            backgroundColor: theme.palette.background.paper,
            mt: 5,
          }}
        >
          <DataGrid
            rows={rowData}
            columns={columns}
            sx={{
              backgroundColor: theme.palette.background.default,
              borderRadius: 2,
            }}
            onRowDoubleClick={handleDoubleClick}
            localeText={{
              noRowsLabel: "No Nurse Request",
            }}
          />
        </Paper>
      </Paper>
      <PatientTransactionsModal
        open={openDetail}
        onClose={handleDetailClose}
        rows={detailData}
      />
      <ToastContainer />
    </Box>
  );
};

export default DischargeForm;

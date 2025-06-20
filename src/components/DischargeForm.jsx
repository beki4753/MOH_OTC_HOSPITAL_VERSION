import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { fetchPatientData } from "../services/open_mrs_api_call";
import { ToastContainer, toast } from "react-toastify";
import api from "../utils/api";
import { registerUser } from "../services/user_service"; // Assuming this is needed
const initialState = {
  services: [],
  patientCardNumber: "",
  patientName: "",
  medicationUse: "",
  admissionDate: "",
  dischargeDate: "",
  patientCondition: "",
};

const DischargeForm = () => {
  const [services, setServices] = useState([]);
  const [formData, setFromData] = useState(initialState);
  const [patientCardNumber, setPatientCardNumber] = useState("");
  const [patientCardNumberError, setPatientCardNumberError] = useState("");
  const [patientName, setPatientName] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [medicationUse, setMedicationUse] = useState(""); // Changed to empty string for initial state of select
  const [medicationUseError, setMedicationUseError] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [admissionDateError, setAdmissionDateError] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeDateError, setDischargeDateError] = useState("");
  const [patientCondition, setPatientCondition] = useState("");
  const [patientConditionError, setPatientConditionError] = useState("");

  // Memoized callback for MRN validation
  const validateMrn = useCallback((value) => {
    const mrnRegex = /^[0-9]{5,}$/;
    if (!value) {
      setPatientCardNumberError("MRN is required.");
      return false;
    } else if (!mrnRegex.test(value)) {
      setPatientCardNumberError(
        "Please insert a valid MRN (at least 5 digits, numbers only)."
      );
      return false;
    } else {
      setPatientCardNumberError("");
      return true;
    }
  }, []);

  // Memoized callback for Medication Use validation
  const validateMedicationUse = (value) => {
    if (value === null || value === "") {
      setMedicationUseError("Please select medication usage.");
      return false;
    } else {
      setMedicationUseError("");
      return true;
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "patientCardNumber") {
      setPatientName("");
      validateMrn(e.target.value);
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
      return;
    }

    setFromData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetPatientName = async () => {
    // Only fetch if there's no error and a value exists
    if (validateMrn(patientCardNumber)) {
      setIsFetching(true);
      try {
        const response = await fetchPatientData(patientCardNumber);
        if (
          response?.patientFirstName ||
          response?.patientMiddleName ||
          response?.patientLastName
        ) {
          const fullName = `${response?.patientFirstName || ""} ${
            response?.patientMiddleName || ""
          } ${response?.patientLastName || ""}`.trim();
          setPatientName(fullName);
        } else {
          toast.error("Card Number Not Registered.");
          setPatientName("");
        }
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
        toast.error("Failed to fetch patient data.");
        setPatientName("");
      } finally {
        setIsFetching(false);
      }
    } else {
      setPatientName("");
    }
  };

  const handleAddService = () => {
    setServices([...services, { name: "", quantity: "", unitCost: "" }]);
  };

  const handleRemoveService = (index) => {
    const updated = [...services];
    updated.splice(index, 1);
    setServices(updated);
  };

  const handleChangeService = (index, field, value) => {
    const updated = [...services];
    updated[index][field] = field === "name" ? value : parseFloat(value) || 0;
    setServices(updated);
  };

  const totalCost = services.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0
  );

  // Effect for updating Bed service based on admission and discharge dates
  useEffect(() => {
    if (admissionDate && dischargeDate) {
      const getDateDifference = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
      };

      const stayDuration = getDateDifference(admissionDate, dischargeDate);

      setServices((prev) => {
        const updated = [...prev];
        // Ensure "Bed" service is always the first item
        const bedServiceIndex = updated.findIndex(
          (service) => service.name === "Bed"
        );
        if (bedServiceIndex !== -1) {
          updated[bedServiceIndex] = {
            ...updated[bedServiceIndex],
            quantity: stayDuration,
          };
        } else {
          updated.unshift({ name: "Bed", quantity: stayDuration, unitCost: 0 });
        }
        return updated;
      });
    } else if (!admissionDate || !dischargeDate) {
      // If either date is cleared, remove the Bed service if it exists and is not manually added
      setServices((prev) => prev.filter((service) => service.name !== "Bed"));
    }
  }, [admissionDate, dischargeDate]);

  const handleSubmit = async () => {
    let hasError = false;

    // Validate main form fields
    if (!validateMrn(patientCardNumber)) {
      hasError = true;
    }

    if (!patientName) {
      // This case should ideally be covered by MRN validation and fetchPatientData success
      // But as a fallback, if name isn't populated, it's an issue.
      toast.error("Please enter a valid Card/MRN Number to get patient name.");
      hasError = true;
    }

    if (!admissionDate) {
      setAdmissionDateError("Admission date is required.");
      hasError = true;
    } else {
      setAdmissionDateError("");
    }

    if (!dischargeDate) {
      setDischargeDateError("Discharge date is required.");
      hasError = true;
    } else if (
      admissionDate &&
      new Date(dischargeDate) < new Date(admissionDate)
    ) {
      setDischargeDateError("Discharge date cannot be before admission date.");
      hasError = true;
    } else {
      setDischargeDateError("");
    }

    if (!validateMedicationUse(medicationUse)) {
      hasError = true;
    }

    if (!patientCondition.trim()) {
      setPatientConditionError("Patient condition is required.");
      hasError = true;
    } else {
      setPatientConditionError("");
    }

    // Validate services
    if (services.length === 0) {
      toast.error("Please add at least one service.");
      hasError = true;
    } else {
      for (let i = 0; i < services.length; i++) {
        const s = services[i];
        if (!s.name.trim()) {
          toast.error(`Service name is required at row ${i + 1}.`);
          hasError = true;
        }
        if (s.quantity <= 0 || isNaN(s.quantity)) {
          toast.error(`Quantity must be greater than 0 at row ${i + 1}.`);
          hasError = true;
        }
        if (s.unitCost <= 0 || isNaN(s.unitCost)) {
          toast.error(`Unit cost must be greater than 0 at row ${i + 1}.`);
          hasError = true;
        }
        if (hasError) break; // Stop checking further services if an error is found
      }
    }

    if (hasError) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    // Attempt to register user (assuming this is a pre-check before submission)
    // You might want to handle this logic differently if it's meant to be a separate step
    const userDataResponse = await fetchPatientData(patientCardNumber); // Re-fetch or use cached if available
    if (!userDataResponse) {
      toast.error("Patient data could not be retrieved. Cannot register.");
      return;
    }

    try {
      const msg = await registerUser(userDataResponse);
      if (msg?.toLowerCase().includes("internal server error.")) {
        toast.error(
          "Something is wrong with user registration. Please try again!"
        );
        return;
      }
    } catch (error) {
      console.error("User registration failed:", error);
      toast.error("User registration failed. Please try again.");
      return;
    }

    // Prepare payload
    const payload = {
      patientCardNumber,
      dischargeDate,
      admissionDate,
      hasMedication: medicationUse, // This will be boolean due to the MenuItem logic
      patientCondition,
      services: services.map((s) => ({
        service: s.name,
        amount: s.quantity,
        price: s.unitCost,
      })),
    };

    // Submit discharge data
    try {
      await api.post(`/Patient/add-nurse-request`, payload);
      toast.success("Successfully submitted to cashier.");
      // Optionally reset form here
      setServices([]);
      setPatientCardNumber("");
      setPatientCardNumberError("");
      setPatientName("");
      setMedicationUse("");
      setMedicationUseError("");
      setAdmissionDate("");
      setAdmissionDateError("");
      setDischargeDate("");
      setDischargeDateError("");
      setPatientCondition("");
      setPatientConditionError("");
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        background: "#f7f9fc",
        minHeight: "100vh",
        py: 5,
        margin: "0px 15px",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          px: { xs: 2, sm: 4, md: 8 },
          py: { xs: 4, md: 5 },
          borderRadius: 4,
          backgroundColor: "#ffffff",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          fontWeight="bold"
          textAlign="center"
        >
          Patient Discharge Summary
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Card / MRN Number"
              fullWidth
              name="patientCardNumber"
              value={formData?.patientCardNumber}
              onChange={handleChange}
              onBlur={() => handleGetPatientName()}
              error={!!patientCardNumberError}
              helperText={patientCardNumberError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isFetching && (
                      <CircularProgress size={24} color="inherit" />
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              label="Patient Name"
              fullWidth
              disabled
              name="patientName"
              value={formData?.patientName}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Medication Use"
              name="medicationUse"
              fullWidth
              value={
                formData?.medicationUse === null ||
                formData?.medicationUse === ""
                  ? ""
                  : formData?.medicationUse
                  ? "Yes"
                  : "No"
              }
              error={!!medicationUseError}
              helperText={medicationUseError}
              onChange={handleChange}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="Date of Admission"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              value={admissionDate}
              onChange={(e) => {
                setAdmissionDate(e.target.value);
                setAdmissionDateError(""); // Clear error on change
              }}
              error={!!admissionDateError}
              helperText={admissionDateError}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="Date of Discharge"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              value={dischargeDate}
              onChange={(e) => {
                setDischargeDate(e.target.value);
                setDischargeDateError(""); // Clear error on change
              }}
              error={!!dischargeDateError}
              helperText={dischargeDateError}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Patient Condition (e.g., Discharged / Death)"
              fullWidth
              required
              value={patientCondition}
              onChange={(e) => {
                setPatientCondition(e.target.value);
                setPatientConditionError(""); // Clear error on change
              }}
              error={!!patientConditionError}
              helperText={patientConditionError}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h5" gutterBottom>
          Services Provided
        </Typography>

        {services.map((item, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Grid item xs={12} sm={5} md={4}>
              <TextField
                label="Service Name"
                fullWidth
                value={item.name}
                onChange={(e) =>
                  handleChangeService(index, "name", e.target.value)
                }
                disabled={index === 0 && item.name === "Bed"} // Keep "Bed" service name disabled
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                label="Qty"
                type="number"
                fullWidth
                value={item.quantity}
                onChange={(e) =>
                  handleChangeService(index, "quantity", e.target.value)
                }
                // Allow changing quantity for Bed service
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                label="Unit Cost"
                type="number"
                fullWidth
                value={item.unitCost}
                onChange={(e) =>
                  handleChangeService(index, "unitCost", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <Typography fontWeight="medium">
                {(item.quantity * item.unitCost).toFixed(2)} ብር
              </Typography>
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton
                onClick={() => handleRemoveService(index)}
                disabled={index === 0 && item.name === "Bed"} // Disable delete for initial "Bed" service
              >
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button
          startIcon={<Add />}
          onClick={handleAddService}
          variant="outlined"
          sx={{ my: 2 }}
        >
          Add Service
        </Button>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="flex-end" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Total: {totalCost.toFixed(2)} ብር
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleSubmit}
        >
          Submit to Cashier
        </Button>
      </Paper>

      <ToastContainer />
    </Box>
  );
};

export default DischargeForm;

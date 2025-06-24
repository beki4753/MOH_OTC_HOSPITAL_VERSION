import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Modal,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Paper,
  Card,
  Avatar,
  CircularProgress,
  InputAdornment,
  Stack,
  IconButton,
  useTheme,
  OutlinedInput,
} from "@mui/material";
import { tokens } from "../theme";
import { PDFDocument, rgb } from "pdf-lib";
import ReactDOM from "react-dom/client";
import RenderPDF from "../pages/hospitalpayment/RenderPDF";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PaymentIcon from "@mui/icons-material/Payment";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";
import ReceiptModal from "../pages/hospitalpayment/ReceiptModal";
import { generatePDF } from "../pages/hospitalpayment/HospitalPayment";
import CancelConfirm from "./CancelConfirm";
import { CarCrash, Refresh } from "@mui/icons-material";
import { renderETDateAtCell } from "./PatientSearch";
import { normalizeText } from "../utils/normalizer";

const tokenvalue = getTokenValue();

const icons = {
  Cash: <LocalAtmIcon />,
  CBHI: <VolunteerActivismIcon />,
  Credit: <CreditScoreIcon />,
  "Free of Charge": <MonetizationOnIcon />,
  Digital: <AttachMoneyIcon />,
  Traffic: <CarCrash />,
};

//const creditOrganizations = ["Tsedey Bank", "Amhara Bank", "Ethio Telecom"]; // example list
const initialState = {
  PRNo: "",
  services: "",
  method: "",
  digitalChannel: "",
  trxref: "",
  organization: "",
  employeeId: "",
};

function PaymentManagement() {
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [digitalChannels, setDigitalChannels] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [trxRefError, settrxRefError] = useState("");
  const [paperReError, setPaperReError] = useState("");
  const [formDataError, setFormDataError] = useState(initialState);
  const [creditOrganizations, setcreditOrganizations] = useState([]);
  const [services, setServices] = useState([]);
  const [totals, setTotals] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [cancelLoad, setCancelLoad] = useState(false);
  const [renderDescription, setRenderDescription] = useState(false);

  const navigate = useNavigate();

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  //setRenderDescription check
  useEffect(() => {
    const check = paymentOptions
      ?.filter(
        (item) => normalizeText(item.type) === normalizeText(formData?.method)
      )
      .some(
        (item) =>
          Array.isArray(item.description) &&
          item.description.some(
            (desc) =>
              desc?.description && desc.description.toString().trim().length > 0
          )
      );
    if (check) {
      const value = paymentOptions?.filter(
        (item) => normalizeText(item.type) === normalizeText(formData?.method)
      )[0]?.description;
      setServices(value);
    } else {
      setServices([]);
    }
    setRenderDescription(check);
  }, [paymentOptions, formData?.method]);

  // Fetch all payment types with descriptions
  const fetchPaymentTypes = async () => {
    try {
      const response = await api.get("/Lookup/payment-type-description");
      if (response?.status === 200) {
        setPaymentOptions(
          response.data.data
            ?.map(({ id, ...rest }, index) => ({
              id: index + 1,
              mainId: id,
              ...rest,
            }))
            ?.filter(
              (item) => normalizeText(item?.type) !== normalizeText("all")
            )
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load payment types");
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(`/Organiztion/Organization`);
        if (response?.status === 200 || response?.status === 201) {
          setcreditOrganizations(
            response?.data?.map((item) => item.organization)
          );
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchORG();
  }, []);

  //All Payments by casher
  useEffect(() => {
    const fetchPaymetInfo = async () => {
      try {
        const response = await api.put(
          "/Payment/payment-by-cashier",
          tokenvalue.name,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200) {
          const sortedPayment = await response?.data.sort(
            (a, b) => b.id - a.id
          );
          updatePaymentSummary(sortedPayment);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPaymetInfo();
  }, [refresh]);

  const updatePaymentSummary = (payments) => {
    const summary = payments.reduce((acc, payment) => {
      const { paymentType, paymentAmount } = payment;

      if (!acc[paymentType]) {
        acc[paymentType] = 0;
      }
      acc[paymentType] += parseFloat(paymentAmount);
      return acc;
    }, {});

    setTotals(summary);
    setTotal(Object.values(summary).reduce((a, b) => a + b, 0));
  };

  useEffect(() => {
    const fetchChane = async () => {
      try {
        const response = await api.get("/Lookup/payment-channel");
        if (response?.status === 200) {
          setDigitalChannels(response?.data?.map((item) => item.channel));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchChane();
  }, []);

  const handleConfClose = () => {
    setOpenConfirm(false);
    setSelectedRow(null);
  };

  const handleCancel = async (confirm) => {
    try {
      if (confirm.message === "Yes Please!") {
        setCancelLoad(true);
        const endPoint = selectedRow?.whoRequested
          ?.toLowerCase()
          ?.includes("nurse")
          ? "/Patient/cancel-nurse-request"
          : "/Patient/cancel-patient-request";
        const results = await Promise.allSettled(
          confirm?.selectedPayload?.map((item) =>
            api.delete(endPoint, {
              data: {
                patientCardNumber: item.patientCardNumber,
                groupID: item.groupID,
                purpose: item.purpose,
              },
            })
          )
        );

        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result?.value?.status === 200) {
            const msg = result.value.data?.msg || "Success";
            const purpose =
              JSON.parse(result?.value?.config?.data)?.purpose || "Unknown";
            toast.success(
              `✅ Success ${index + 1}: ${msg} (Purpose: ${purpose})`
            );
          } else {
            const errorMsg =
              result?.reason?.response?.data?.msg ||
              result?.reason?.message ||
              "Unknown error occurred";
            toast.error(`❌ Failed ${index + 1}: ${errorMsg}`);
            setCancelLoad(false);
          }
        });
        setRefresh((prev) => !prev);
        setCancelLoad(false);
        handleConfClose();
      } else {
        setSelectedRow(confirm);
        setOpenConfirm(true);
      }
    } catch (error) {
      console.error("This is canceling Payment error: ", error);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "method") {
      setFormData({
        ...formData,
        method: e.target.value,
        digitalChannel: "",
        trxref: "",
        organization: "",
        employeeId: "",
        services: "",
        PRNo: "",
      });

      setFormDataError({
        ...formDataError,
        method: "",
        digitalChannel: "",
        trxref: "",
        organization: "",
        employeeId: "",
        services: "",
        PRNo: "",
      });
      settrxRefError("");
      setPaperReError("");
    } else {
      if (e.target.name === "trxref") {
        validateTransactionRef(e.target.value);
      }

      if (e.target.name === "PRNo") {
        numberOnlyCheck(e.target.value);
      }
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setFormDataError({ ...formDataError, [e.target.name]: "" });
    }
  };

  const numberOnlyCheck = (num) => {
    const numRegx = /^[0-9]{6,}$/;
    if (!numRegx.test(num) && num?.length > 0) {
      setPaperReError("Please insert valid receipt number.");
    } else {
      setPaperReError("");
    }

    return;
  };

  const validateTransactionRef = (trxRef) => {
    const trxPattern = /^[A-Za-z0-9-_]{10,25}$/;

    if (!trxRef) {
      settrxRefError("Transaction reference is required");
    } else if (!trxPattern.test(trxRef)) {
      settrxRefError(
        "Invalid format. Use 10-25 characters with letters, numbers, -, _"
      );
    } else {
      settrxRefError("");
    }

    return;
  };

  const handleOpenModal = (row) => {
    try {
      setSelectedRow(row);
      setOpenModal(true);
    } catch (error) {
      console.error("This is The Open Modal error: ", error);
      toast.error("Unable to open.");
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialState);
    setFormDataError(initialState);
    settrxRefError("");
    setPaperReError("");
    setSelectedRow(null);
    setServices([]);
  };

  const handleConfSave = async () => {
    try {
      const errorMessage = "Please Fill this field";
      const errors = {};

      const method = formData.method?.toUpperCase();

      // Basic validation
      if (!formData.method) {
        errors.method = errorMessage;
      }

      if (method?.includes("DIGITAL")) {
        if (!formData.digitalChannel) errors.digitalChannel = errorMessage;
        if (!formData.trxref || trxRefError) errors.trxref = errorMessage;
      }

      if (method?.includes("CREDIT")) {
        if (!formData.organization) errors.organization = errorMessage;
        if (!formData.employeeId) errors.employeeId = errorMessage;
      }

      if (method?.includes("CASH")) {
        if (!formData.PRNo || paperReError) errors.PRNo = errorMessage;
      }

      if (services?.length > 0 && !formData.services) {
        errors.services = errorMessage;
      }

      if (Object.keys(errors).length > 0) {
        setFormDataError((prev) => ({ ...prev, ...errors }));
        toast.error("Please Fill All Fields.");
        return;
      }

      // Check for form-level errors (e.g., client validation)
      if (Object.values(formDataError).some((msg) => msg?.length > 0)) {
        toast.error("Please fix the error first.");
        return;
      }

      // Ensure at least one item is paid
      const paidItems = selectedRow?.requestedCatagories?.filter(
        (item) => item.isPaid === true
      );

      if (!paidItems?.length) {
        toast.error("Should have at least one payment.");
        return;
      }

      const totalPaidAmount = paidItems.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      if (totalPaidAmount <= 0) {
        toast.error("Should have Total Amount Greater than zero (0).");
        return;
      }

      const checkData = {
        cardNumber: selectedRow?.patientCardNumber,
        amount: paidItems,
        method: formData?.method,
        reason: paidItems.map((item) => item.purpose),
        description: "-",
      };

      setReceiptOpen(true);
      setReceiptData(checkData || []);
    } catch (error) {
      console.error("This is Handle Confirm Error:", error);
      toast.error("Internal Server Error.");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setIsPrintLoading(true);

      const payload = {
        paymentType: formData?.method,
        cardNumber: selectedRow?.patientCardNumber,
        descriptionId:
          services?.length > 0
            ? services?.filter(
                (item) =>
                  normalizeText(item.description) ===
                  normalizeText(formData?.services)
              )[0]?.id
            : 0,
        amount: selectedRow?.requestedCatagories,
        description: "-",
        createdby: tokenvalue?.name,
        paymentRefNo: formData?.PRNo,
        channel: formData?.digitalChannel || "-",
        paymentVerifingID: formData?.trxref || "-",
        patientWorkID: formData?.employeeId || "-",
        organization: formData?.organization || "-",
        [selectedRow?.whoRequested?.toLowerCase()?.includes("nurse")
          ? "isNurseRequest"
          : "isLabRequest"]: true,
      };

      const response = await api.post("/Payment/add-payment", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response?.data?.refNo?.length > 0) {
        toast.success(`Payment Regitstered Under ${response?.data?.refNo}`);
        setRefresh((prev) => !prev);
        const data = {
          method: formData.method || "",
          amount:
            selectedRow?.requestedCatagories?.filter(
              (item) => item.isPaid === true
            ) || "",
          patientName: selectedRow?.patientFName || "",
          cardNumber: selectedRow?.patientCardNumber || "",
          digitalChannel: formData?.digitalChannel || "",
          trxref: formData?.trxref || "",
          organization: formData?.organization || "",
          employeeId: formData?.employeeId || "",
          cbhiId: response?.data?.data?.map((item) => item.patientCBHI_ID)[0],
          refNo: response?.data?.refNo || "-",
        };

        await generatePDF(data);
        setIsPrintLoading(false);
        setReceiptData(null);
        handleCloseModal();
      }
    } catch (error) {
      console.error("This is Error on handle Save: ", error);
      toast.error(error?.response?.data?.errorDescription || "Internal Server Error.");
    } finally {
      setLoading(false);
      setIsPrintLoading(false);
      setReceiptOpen(false);
    }
  };

  const columns = [
    { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
    { field: "patientFName", headerName: "First Name", flex: 1 },
    { field: "patientGender", headerName: "Gender", flex: 1 },
    {
      field: "noRequestedServices",
      headerName: "No of Requested Services",
      flex: 1,
    },
    {
      field: "requestedCatagories",
      headerName: "Reason",
      flex: 1,
      renderCell: (params) => {
        try {
          return params?.row?.requestedCatagories
            .map((item) => item?.purpose)
            .join(", ");
        } catch (error) {
          console.error("Error Occured on rendering: ", error);
        }
      },
    },
    {
      field: "totalPrice",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        try {
          return formatAccounting2(params.row.totalPrice);
        } catch (error) {
          console.error("Error Occured on rendering: ", error);
        }
      },
    },
    {
      field: "paid",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        try {
          return params.row.paid ? "Completed" : "Pending";
        } catch (error) {
          console.error("Error Occured on rendering: ", error);
        }
      },
    },
    {
      field: "whoRequested",
      headerName: "Request From",
      flex: 1,
    },
    {
      field: "createdOn",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        try {
          return renderETDateAtCell(params?.row?.createdOn);
        } catch (error) {
          console.error("Error Occured on rendering: ", error);
        }
      },
    },
    {
      field: "action",
      headerName: "Manage",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
          onClick={() => handleOpenModal(params.row)}
        >
          Manage
        </Button>
      ),
    },
    {
      field: "cancel",
      headerName: "Cancel",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="error"
          onClick={() => handleCancel(params.row)}
        >
          Cancel
        </Button>
      ),
    },
  ];

  //Fetch DataGrid Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.put("/Patient/get-patient-request-cashier", {
          loggedInUser: tokenvalue?.name,
        });

        const response2 = await api.put("/Patient/get-nurse-request-cashier");

        const modData2 =
          response2?.data?.length > 0
            ? response2?.data?.map(
                ({
                  patientFirstName,
                  patientMiddleName,
                  patientLastName,
                  rquestedServices,
                  ...rest
                }) => ({
                  patientFName:
                    patientFirstName +
                    " " +
                    patientMiddleName +
                    " " +
                    patientLastName,
                  requestedCatagories: rquestedServices?.map(
                    ({ services, price, amount, ...rest }) => ({
                      purpose: services,
                      amount: price,
                      isPaid: true,
                      ...rest,
                    })
                  ),
                  whoRequested: "Nurse (Ward)",
                  ...rest,
                })
              )
            : [];

        const modData =
          response?.data?.length > 0
            ? response?.data?.map(
                ({
                  patientFirstName,
                  patientMiddleName,
                  patientLastName,
                  ...rest
                }) => ({
                  patientFName:
                    patientFirstName +
                    " " +
                    patientMiddleName +
                    " " +
                    patientLastName,
                  whoRequested: rest?.requestedCatagories
                    .map((item) => item?.purpose)
                    .join(", ")
                    ?.toLowerCase()
                    ?.includes("laboratory")
                    ? "Laboratory"
                    : "Radiology",
                  ...rest,
                })
              )
            : [];

        const ModDataID = modData.map((item, index) => {
          return {
            ...item,
            id: index + 1,
          };
        });

        const ModDataID2 = modData2.map((item, index) => {
          return {
            ...item,
            id: index + 1,
          };
        });

        const merged = [...ModDataID, ...ModDataID2]?.map((item, index) => {
          return {
            ...item,
            id: index + 1,
          };
        });

        setRows(merged || []);
      } catch (error) {
        console.error("This is Fetch Table Data Error: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  const openNewTab = (id) => {
    window.open(
      `https://cs.bankofabyssinia.com/slip/?trx=${id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const generateAndOpenPDF = async (error) => {
    try {
      const responseData = error?.response?.data;

      // Check if response is a Blob (e.g., an actual PDF file)
      if (responseData instanceof Blob) {
        const blobUrl = URL.createObjectURL(responseData);
        window.open(blobUrl, "_blank");

        // Revoke the blob after a few seconds to free memory
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        return;
      }

      // If it's not a Blob, try to extract message
      let message = "Incorrect Receipt ID";
      if (responseData?.message) {
        message = String(responseData.message);
      }

      // Generate a simple PDF with the message using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const { height } = page.getSize();

      page.drawText(message, {
        x: 50,
        y: height - 100,
        size: 16,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      window.open(pdfUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
    } catch (err) {
      console.error("generateAndOpenPDF error:", err);
    }
  };

  const handleOpenPage = async () => {
    try {
      setIsChecking(true);
      if (formData?.trxref?.length <= 0) {
        toast.info("Transaction Refference Number is Empty.");
        return;
      }

      if (
        formDataError?.trxref?.length > 0 ||
        trxRefError?.length > 0 ||
        paperReError?.length > 0
      ) {
        toast.info("Please Fix The Error First.");
        return;
      }
      const receptId = formData?.trxref;

      let config = {};
      let url;
      if (
        formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING") ||
        formData.digitalChannel.toUpperCase().includes("TELEBIRR")
      ) {
        url = `/Lookup/payment-verify/${receptId}?channel=${formData?.digitalChannel.toUpperCase()}`;
        if (
          formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING")
        ) {
          config = { responseType: "blob" };
        } else {
          config = {};
        }
      } else if (
        formData.digitalChannel.toUpperCase().includes("BANK OF ABYSSINIA")
      ) {
        // url = `/Lookup/redirecttoboa?transactionId=${receptId}`;
        openNewTab(receptId);
        // <a href={`https://cs.bankofabyssinia.com/slip/?trx=${receptId}`} target="_blank">View Slip</a>
      }

      if (
        !formData.digitalChannel.toUpperCase().includes("BANK OF ABYSSINIA")
      ) {
        const response = await api.get(url, config);

        if (formData.digitalChannel.toUpperCase().includes("TELEBIRR")) {
          const newTab = window.open();
          if (newTab) {
            const newTabDocument = newTab.document;

            // Create a root div
            const rootDiv = newTabDocument.createElement("div");
            rootDiv.id = "root";
            newTabDocument.body.appendChild(rootDiv);

            // Render the component in the new tab
            const root = ReactDOM.createRoot(rootDiv);
            root.render(<RenderPDF html={response?.data} />);
          }
        } else if (
          formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING")
        ) {
          try {
            const pdfBlob = response?.data
              ? new Blob([response?.data], {
                  type: "application/pdf",
                })
              : new Blob("Unknown status received.");

            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, "_blank");
          } catch (error) {
            console.error("CBE Error: ", error);
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (
        formData.digitalChannel.toUpperCase().includes("CBE MOBILE BANKING")
      ) {
        await generateAndOpenPDF(error);
      }
      toast.error(
        error?.response?.data?.message ||
          (error?.message?.toLowerCase().includes("network") &&
            error?.message) ||
          "Something is wrong Please try again"
      );
    } finally {
      setIsChecking(false);
    }
  };

  const normalizeTexts = (text) => {
    try {
      if (text.toLowerCase() === "cash") {
        return "Cash";
      } else if (text.toLowerCase() === "cbhi") {
        return "CBHI";
      } else if (text.toLowerCase() === "credit") {
        return "Credit";
      } else if (text.toLowerCase() === "digital") {
        return "Digital";
      } else if (text.toLowerCase() === "free of charge") {
        return "Free of Charge";
      } else if (text.toLowerCase() === "traffic") {
        return "Traffic";
      } else {
        return text;
      }
    } catch (error) {
      console.error("This is text Normalizig Error: ", error);
      return "";
    }
  };

  return (
    <Box p={3}>
      {/* 🔝 Summary */}
      <Typography variant="h5" gutterBottom>
        💰 Today's Payment Summary
      </Typography>
      <Grid container spacing={2} mb={3}>
        {Object.entries(totals).map(([method, amt]) => (
          <Grid item xs={12} sm={6} md={3} key={method}>
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                boxShadow: 3,
                borderRadius: 3,
              }}
            >
              <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }} variant="rounded">
                {icons[normalizeTexts(method)] || <PaymentIcon />}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{method}</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatAccounting2(amt)} Birr
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              backgroundColor:
                theme.palette.mode === "light"
                  ? "#e3f2fd"
                  : theme.palette.primary.dark,
              borderLeft: `5px solid ${
                theme.palette.mode === "light"
                  ? "#1976d2"
                  : theme.palette.text.primary
              }`,
              borderRadius: 2,
              mt: 1,
              color: theme.palette.text.primary, // ensure text color matches theme
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Total Received Today: {formatAccounting2(total)} Birr
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 📋 Data Table */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={8}>
          <Typography variant="h6">🕓 Pending Payments</Typography>
        </Grid>
        <Grid item xs={12} md={4} textAlign="right">
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            alignItems="center"
          >
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate("/payments")}
            >
              Add Payment
            </Button>

            <Button
              variant="outlined"
              sx={{
                color: colors.grey[100],
                borderColor: colors.grey[100],
                "&:hover": {
                  borderColor: colors.grey[300],
                  color: colors.grey[300],
                },
              }}
              onClick={() => setRefresh((prev) => !prev)}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <Refresh
                  sx={{
                    transition: "transform 0.5s",
                    "&:hover": { transform: "rotate(90deg)" },
                  }}
                />
              )}
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <DataGrid
            rows={rows}
            // getRowId={(row) => row.patientCardNumber}
            loading={isLoading}
            columns={columns}
          />
        </Grid>
      </Grid>

      {/* 💳 Modal */}
      <Modal
        open={openModal}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            handleCloseModal();
          }
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: {
              xs: "90vw",
              sm: 500,
              md: 600,
              lg: 700,
            },
            maxWidth: "95vw",
            maxHeight: "90vh",
            bgcolor:
              theme.palette.mode === "light"
                ? "background.paper"
                : "background.default",
            boxShadow: 24,
            borderRadius: 3,
            p: 4,
            overflowY: "auto",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            color={theme.palette.mode === "light" ? "primary" : "#ffffff"}
          >
            Manage Payment for: {selectedRow?.patientFName}
          </Typography>

          <Card
            sx={{
              mb: 2,
              p: 2,
              backgroundColor:
                theme.palette.mode === "light"
                  ? "background.paper"
                  : "background.default",
            }}
          >
            <Typography variant="subtitle1">
              Card Number: <strong>{selectedRow?.patientCardNumber}</strong>
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Total Amount:{" "}
              {/* <strong>{formatAccounting2(selectedRow?.totalPrice)}</strong> */}
              <strong>
                {formatAccounting2(
                  selectedRow?.requestedCatagories
                    ?.filter((item) => item.isPaid)
                    .reduce((sum, item) => sum + item.amount, 0)
                )}
                &nbsp; Birr
              </strong>
            </Typography>
          </Card>

          {/* Payment Method */}
          <FormControl
            fullWidth
            margin="normal"
            required
            error={!!formDataError?.method}
            helpertext={formDataError?.method}
          >
            <Select
              name="method"
              value={formData.method}
              onChange={handleChange}
              displayEmpty
              input={
                <OutlinedInput
                  sx={{
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
                  }}
                />
              }
              renderValue={(selected) =>
                selected ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {icons[normalizeTexts(selected)]}&nbsp;{selected}
                  </Box>
                ) : (
                  <span style={{ color: "#888" }}>
                    Select Payment Method...*
                  </span>
                )
              }
            >
              <MenuItem disabled value="">
                <em>Select Payment Method...</em>
              </MenuItem>
              {paymentOptions.map((option) => (
                <MenuItem key={option?.type} value={option?.type}>
                  {icons[normalizeTexts(option?.type)]} &nbsp; {option?.type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/*Paper receipt for cash payment only.*/}
          {formData?.method?.toLowerCase().includes("cash") && (
            <TextField
              label="Paper Receipt"
              variant="outlined"
              name="PRNo"
              value={formData?.PRNo}
              onChange={handleChange}
              fullWidth
              error={
                paperReError?.length > 0
                  ? !!paperReError
                  : !!formDataError?.PRNo
              }
              helperText={
                paperReError?.length > 0 ? paperReError : formDataError?.PRNo
              }
              sx={{
                marginTop: "10px",
              }}
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
          )}

          {/* Digital */}
          {formData?.method?.toLowerCase().includes("digital") && (
            <>
              <FormControl
                fullWidth
                margin="normal"
                required
                error={!!formDataError?.digitalChannel}
                helpertext={formDataError?.digitalChannel}
              >
                <Select
                  name="digitalChannel"
                  value={formData.digitalChannel}
                  onChange={handleChange}
                  displayEmpty
                  input={
                    <OutlinedInput
                      sx={{
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
                      }}
                    />
                  }
                  renderValue={(selected) =>
                    selected ? (
                      selected
                    ) : (
                      <span style={{ color: "#888" }}>
                        Select Digital Channel...
                      </span>
                    )
                  }
                >
                  <MenuItem disabled value="">
                    <em>Select Digital Channel...</em>
                  </MenuItem>
                  {digitalChannels.map((channel) => (
                    <MenuItem key={channel} value={channel}>
                      {channel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                name="trxref"
                label="Transaction Ref. No"
                value={formData?.trxref}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {isChecking ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <IconButton onClick={handleOpenPage} edge="end">
                          <OpenInNewIcon />
                        </IconButton>
                      )}
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
                error={
                  trxRefError?.length > 0
                    ? !!trxRefError
                    : !!formDataError?.trxref
                }
                helperText={
                  trxRefError?.length > 0 ? trxRefError : formDataError?.trxref
                }
              />
            </>
          )}

          {/* Credit */}
          {formData?.method?.toLowerCase().includes("credit") && (
            <>
              <FormControl
                fullWidth
                margin="normal"
                required
                error={!!formDataError?.organization}
              >
                <Select
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  displayEmpty
                  input={
                    <OutlinedInput
                      sx={{
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
                      }}
                    />
                  }
                  renderValue={(selected) =>
                    selected ? (
                      selected
                    ) : (
                      <span style={{ color: "#888" }}>
                        Select Organization...
                      </span>
                    )
                  }
                >
                  <MenuItem disabled value="">
                    <em>Select Organization...</em>
                  </MenuItem>
                  {creditOrganizations.map((org) => (
                    <MenuItem key={org} value={org}>
                      {org}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                name="employeeId"
                label="Employee ID"
                value={formData.employeeId}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formDataError?.employeeId}
                helperText={formDataError?.employeeId}
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
            </>
          )}

          {renderDescription && (
            <>
              <FormControl
                fullWidth
                margin="normal"
                required
                error={!!formDataError?.services}
              >
                <Select
                  name="services"
                  value={formData?.services || ""}
                  onChange={handleChange}
                  displayEmpty
                  input={
                    <OutlinedInput
                      sx={{
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
                      }}
                    />
                  }
                  renderValue={(selected) =>
                    selected ? (
                      selected
                    ) : (
                      <span style={{ color: "#888" }}>Select Services...</span>
                    )
                  }
                >
                  <MenuItem disabled value="">
                    <em>Select Services...</em>
                  </MenuItem>
                  {services?.map((serv) => (
                    <MenuItem key={serv?.id} value={serv?.description}>
                      {serv?.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {/* Action Buttons */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                color="error"
                onClick={() => handleCloseModal()}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                fullWidth
                color={theme.palette.mode === "light" ? "primary" : "secondary"}
                onClick={handleConfSave}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <PaymentIcon />
                }
              >
                {loading ? "Processing..." : "Confirm Payment"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
      <ReceiptModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptData(null);
        }}
        data={receiptData}
        onPrint={handleSave}
        onloading={isPrintLoading}
      />
      <CancelConfirm
        isOpen={openConfirm}
        onClose={handleConfClose}
        onConfirm={handleCancel}
        userData={selectedRow}
        onloading={cancelLoad}
      />
      <ToastContainer />
    </Box>
  );
}

export default PaymentManagement;

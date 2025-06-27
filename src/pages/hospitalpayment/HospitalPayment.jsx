import React, { useState, useEffect } from "react";
import {
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Box,
  Checkbox,
  InputAdornment,
  IconButton,
  useTheme,
  CircularProgress,
  FormControl,
  Select,
  OutlinedInput,
} from "@mui/material";
import { PDFDocument, rgb } from "pdf-lib";
import numberToWords from "number-to-words";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import ReactDOM from "react-dom/client";
import ReceiptModal from "./ReceiptModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenValue, registerUser } from "../../services/user_service";
import api from "../../utils/api";
import { useLang } from "../../contexts/LangContext";
import RenderPDF from "./RenderPDF";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { green, orange, grey } from "@mui/material/colors";
import { renderETDateAtCell } from "../../components/PatientSearch.jsx";
import "./NotoSansEthiopic-Regular-normal.js";
import { fetchPatientData } from "../../services/open_mrs_api_call";
import { normalizeText } from "../../utils/normalizer.js";

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

const tokenvalue = getTokenValue();

const formatter = new Intl.NumberFormat("en-us", {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
});

const formatter2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

export const formatAccounting2 = (num) => {
  const formatted = formatter2.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

export const formatAccounting = (num) => {
  const formatted = formatter.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

export const generateAndOpenPDF = async (error) => {
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

const initialState = {
  PRNo: "",
  services: "",
  cardNumber: "",
  amount: [],
  method: "",
  description: "",
  reason: [],
  digitalChannel: "",
  trxref: "",
  organization: "",
  employeeId: "",
};

// To Display print iframe
export const printPDF = (doc) => {
  const blob = doc.output("blob");
  const blobURL = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.display = "none"; // Hide the iframe
  iframe.src = blobURL;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(blobURL);
    }, 30000);
  };
};

//Generate PDF
export const generatePDF = (data) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a6",
    });

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    const marginLeft = 10;
    const marginRight = pageWidth - 10;
    const maxWidth = pageWidth - marginLeft * 2;
    const baseFontSize = 10;
    const baseLineHeight = 6;

    // Estimate how many lines will be printed
    const countLines = () => {
      let lines = 10; // header and static
      lines += 5; // patient + method
      if (data.method.toUpperCase().includes("DIGITAL")) lines += 2;
      if (data.method.toUpperCase().includes("CBHI")) lines += 1;
      if (data.method.toUpperCase().includes("CREDIT")) lines += 1;
      lines += 3 + data.amount.length; // items and total
      lines += 6; // footer
      return lines;
    };

    const totalLines = countLines();
    let lineHeight = baseLineHeight;
    let fontSize = baseFontSize;

    const estimatedContentHeight = totalLines * baseLineHeight;

    if (estimatedContentHeight > pageHeight) {
      const scale = pageHeight / estimatedContentHeight;
      lineHeight = baseLineHeight * scale;
      fontSize = baseFontSize * scale;
    }

    let yPos = 8;
    doc.setFontSize(fontSize);

    const drawText = (text, x, y, options = {}) => {
      doc.text(String(text), x, y, options);
    };

    // Header
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText("*************************", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += lineHeight;
    drawText("HOSPITAL PAYMENT RECEIPT", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += lineHeight;
    drawText("*************************", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += lineHeight + 1;

    doc.setFontSize(fontSize - 1);
    drawText(`${tokenvalue?.Hospital || "N/A"}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += lineHeight;

    // Receipt Info
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`Receipt NO : ${data?.refNo || "N/A"}`, marginLeft, yPos);
    yPos += lineHeight;
    if (data.method.toUpperCase().includes("CASH")) {
      drawText(`Paper Receipt : ${data?.recipt || "N/A"}`, marginLeft, yPos);
      yPos += lineHeight;
    }

    drawText(`Address : Debrebrehan`, marginLeft, yPos);
    yPos += lineHeight;
    drawText(`Date : ${renderETDateAtCell(new Date())}`, marginLeft, yPos);
    yPos += lineHeight;
    drawText(`Cashier : ${tokenvalue?.name || "N/A"}`, marginLeft, yPos);
    yPos += lineHeight;

    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPos, marginRight, yPos);
    yPos += lineHeight;

    // Patient Info
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`Patient Name :`, marginLeft, yPos);
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`${data?.patientName || "N/A"}`, marginLeft + 35, yPos);
    yPos += lineHeight;

    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`Card Number :`, marginLeft, yPos);
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`${data.cardNumber || "N/A"}`, marginLeft + 35, yPos);
    yPos += lineHeight;

    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`Payment Method :`, marginLeft, yPos);
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`${data.method || "N/A"}`, marginLeft + 35, yPos);
    yPos += lineHeight;

    if (data.method.toUpperCase().includes("DIGITAL")) {
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText("Channel :", marginLeft, yPos);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`${data.digitalChannel || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText("Transaction Ref No :", marginLeft, yPos);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`${data.trxref || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;
    } else if (data.method.toUpperCase().includes("CBHI")) {
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`CBHI ID :`, marginLeft, yPos);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`${data.cbhiId || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;
    } else if (data.method.toUpperCase().includes("CREDIT")) {
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`Organization :`, marginLeft, yPos);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`${data.organization || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`Employee Id :`, marginLeft, yPos);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      drawText(`${data.employeeId || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;
    }

    doc.line(marginLeft, yPos, marginRight, yPos);
    yPos += lineHeight;

    // Item Table
    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`Reason`, marginLeft, yPos);
    drawText(`Price`, marginRight - 25, yPos);
    yPos += lineHeight;

    doc.setFont("NotoSansEthiopic-Regular", "normal");
    data?.amount?.forEach((item) => {
      drawText(`${item.purpose}`, marginLeft, yPos);
      drawText(
        `${formatAccounting2(parseFloat(item.amount).toFixed(2))}`,
        marginRight - 25,
        yPos
      );
      yPos += lineHeight;
    });

    doc.line(marginLeft, yPos, marginRight, yPos);
    yPos += lineHeight;

    const totalAmount = data?.amount
      ?.map((item) => parseFloat(item.amount))
      .reduce((a, b) => a + b, 0);

    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(`Total In Figure`, marginLeft, yPos);
    drawText(
      `${formatAccounting2(totalAmount.toFixed(2))}`,
      marginRight - 25,
      yPos
    );
    yPos += lineHeight;

    drawText(`Total In Words : `, marginLeft, yPos);
    drawText(
      `${capitalizeWords(numberToWords.toWords(totalAmount.toFixed(2)))} birr`,
      marginLeft + 30,
      yPos,
      {
        maxWidth: maxWidth - 30, // to fit within the page
        align: "left",
      }
    );
    yPos += lineHeight * 2;

    doc.setFont("NotoSansEthiopic-Regular", "normal");
    drawText(
      "This Receipt is invalid unless it is stamped.",
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    // Save & Print
    doc.save("receipt.pdf");
    printPDF(doc);
  } catch (error) {
    console.error(error.message);
  }
};

const HospitalPayment = () => {
  const { language } = useLang();

  const [payments, setPayments] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  const [formData, setFormData] = useState(initialState);
  const [formDataError, setFormDataError] = useState(initialState);
  const [organizations, setOrganizations] = useState([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [cardNumberError, setCardNumberError] = useState("");
  const [trxRefError, settrxRefError] = useState("");
  const [paperReError, setPaperReError] = useState("");
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [paymentMethods, setPaymentMehods] = useState([]);
  const [digitalChannels, setDigitalChannels] = useState([]);
  const [reasons] = useState([
    "Card",
    "For Examination",
    "Laboratory",
    "X-ray/Ultrasound",
    "Bed",
    "Medicines",
    "Surgery",
    "Food",
    "Other",
  ]);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [renderDescription, setRenderDescription] = useState(false);
  const [services, setServices] = useState([]);

  const navigate = useNavigate();

  const theme = useTheme();
  // Define checkbox color based on theme mode
  const checkboxColor =
    theme.palette.mode === "light"
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  //Inserting evry changet that the user makes on print into the loacl storage using the useEffect hooks
  // onchange of payments the useEffect runs
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
            (a, b) => b.rowId - a.rowId
          );
          const reNamedData = sortedPayment.map(({ rowId, ...rest }) => ({
            id: rowId,
            ...rest,
          }));
          setPayments(reNamedData);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchPaymetInfo();
    updatePaymentSummary(payments);
  }, [refresh, payments]);
  //payments

  //setRenderDescription check
  useEffect(() => {
    const check = paymentMethods
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
      const value = paymentMethods?.filter(
        (item) => normalizeText(item.type) === normalizeText(formData?.method)
      )[0]?.description;
      setServices(value);
    } else {
      setServices([]);
    }
    setRenderDescription(check);
  }, [paymentMethods, formData?.method]);

  //fetch paymentmethods
  useEffect(() => {
    const fetchMeth = async () => {
      try {
        const response = await api.get("/Lookup/payment-type-description");
        if (response?.status === 200) {
          setPaymentMehods(
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
        console.error(error.message);
      }
    };
    fetchMeth();
  }, []);

  //fetch Digital Channels
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

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(`/Organiztion/Organization`);
        if (response?.status === 200 || response?.status === 201) {
          setOrganizations(response?.data?.map((item) => item.organization));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchORG();
  }, []);

  const updatePaymentSummary = (payments) => {
    try {
      if (!Array.isArray(payments)) {
        throw new Error("Invalid payments data: expected an array.");
      }

      const summary = payments.reduce((acc, payment) => {
        const { paymentType, paymentAmount, isReversed } = payment;
        const amount = parseFloat(paymentAmount);

        if (isNaN(amount)) {
          // Skip invalid amounts or handle as needed
          return acc;
        }

        // Initialize sums for paymentType if not present
        if (!acc[paymentType]) {
          acc[paymentType] = 0;
        }

        // Initialize sums for reversed payments of this paymentType
        const reversedKey = `${paymentType} REVERSED`;
        if (!acc[reversedKey]) {
          acc[reversedKey] = 0;
        }

        if (isReversed === true) {
          // Add to reversed sum for this paymentType
          acc[reversedKey] -= amount;
        } else {
          // Add to normal sum for this paymentType
          acc[paymentType] += amount;
        }

        return acc;
      }, {});

      // Remove reversed keys with zero or falsy values
      Object.keys(summary).forEach((key) => {
        if (
          key.endsWith(" REVERSED") &&
          (!summary[key] || summary[key] === 0)
        ) {
          delete summary[key];
        }
      });

      const mapped = Object.entries(summary).map(([method, amount]) => ({
        method,
        amount,
      }));

      setPaymentSummary(mapped);
    } catch (error) {
      console.error("Failed to update payment summary:", error);
    }
  };

  const handleChange = (e) => {
    try {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      setFormDataError((prev) => ({ ...prev, [e.target.name]: "" }));

      if (e.target.name === "trxref") {
        validateTransactionRef(e.target.value);
      }
      if (e.target.name === "cardNumber") {
        setPatientName("");
        handleNumberOnlyCheck(e.target.value);
      }
      if (e.target.name === "PRNo") {
        numberOnlyCheck(e.target.value);
      }
      if (e.target.name === "method") {
        setFormData((prev) => ({
          ...prev,
          trxref: "",
          organization: "",
          employeeId: "",
          digitalChannel: "",
          services: "",
          PRNo: "",
        }));
        setFormDataError((prev) => ({
          ...prev,
          trxref: "",
          organization: "",
          employeeId: "",
          digitalChannel: "",
          services: "",
          PRNo: "",
        }));
        settrxRefError("");
        setPaperReError("");
      }
    } catch (error) {
      console.error(error.message);
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

  const handleCheckboxChange = (reason) => {
    try {
      let updatedReason;
      setFormData((prev) => {
        updatedReason = prev.reason.includes(reason)
          ? prev.reason.filter((r) => r !== reason)
          : [...prev.reason, reason];

        // if unchecking, drop any amount entry for that reason:
        const finalAmount = updatedReason.includes(reason)
          ? prev.amount
          : prev.amount.filter((item) => item.purpose !== reason);

        return {
          ...prev,
          reason: updatedReason,
          amount: finalAmount,
        };
      });

      setFormDataError((prev) => {
        const myReason = "";
        // if unchecking, drop any amount entry for that reason:
        const finalAmount = updatedReason.includes(reason)
          ? prev.amount
          : prev.amount.filter((item) => item.purpose !== reason);

        return {
          ...prev,
          reason: myReason,
          amount: finalAmount,
        };
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAmountChange = (e, reason) => {
    try {
      const rawValue = e.target.value;

      const parsed = parseFloat(rawValue) || 0;

      setFormData((prev) => {
        const updatedAmount = prev.amount.map((item) =>
          item.purpose === reason ? { ...item, amount: Math.abs(parsed) } : item
        );

        const finalAmounts = updatedAmount.some(
          (item) => item.purpose === reason
        )
          ? updatedAmount
          : [...updatedAmount, { purpose: reason, amount: Math.abs(parsed) }];

        return {
          ...prev,
          amount: finalAmounts,
        };
      });
      setFormDataError((prev) => {
        const finalAmounts = prev?.amount.some(
          (item) => item.purpose === reason
        )
          ? prev?.amount?.filter((item) => item.purpose !== reason)
          : [...prev?.amount];

        return {
          ...prev,
          amount: finalAmounts,
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNumberOnlyCheck = (value) => {
    try {
      const regex = /^[0-9]{5,}$/;
      if (!regex.test(value)) {
        setCardNumberError("Please Insert Valid Card Number.");
      } else {
        setCardNumberError("");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSubmit = () => {
    try {
      const errors = {};
      const amountErrormsg =
        "Each reason must have a corresponding payment amount greater than 0!";
      const fillError = "Please fill this field.";

      const method = formData.method?.toUpperCase();

      // Basic Field Validation
      if (!formData.cardNumber || cardNumberError) {
        errors.cardNumber = fillError;
      }

      if (!formData.reason?.length) {
        errors.reason = "Please select a reason.";
      }

      if (!formData.method) {
        errors.method = "Please select payment method.";
      }

      if (method?.includes("DIGITAL")) {
        if (!formData.digitalChannel) errors.digitalChannel = fillError;
        if (!formData.trxref || trxRefError.length > 0)
          errors.trxref = fillError;
      }

      if (method?.includes("CASH")) {
        if (!formData.PRNo || paperReError) errors.PRNo = fillError;
      }

      if (services?.length > 0 && !formData.services) {
        errors.services = fillError;
      }

      if (method?.includes("CREDIT")) {
        if (!formData.organization) errors.organization = fillError;
        if (!formData.employeeId) errors.employeeId = fillError;
      }

      // Amount validation (basic)
      if (!formData.amount?.length) {
        errors.amount = formData.reason.map((item) => ({
          purpose: item,
          amount: amountErrormsg,
        }));
      }

      // Stop and show error if any base field has issues
      if (Object.keys(errors).length > 0) {
        setFormDataError((prev) => ({ ...prev, ...errors }));
        return toast.error("Please fill all the necessary fields!!");
      }

      // Detailed Amount-Per-Reason Validation
      const amountValidationFailures = formData.reason.filter((reason) => {
        const matching = formData.amount.find(
          (item) => item.purpose === reason
        );
        return !matching || matching.amount <= 0;
      });

      if (amountValidationFailures.length > 0) {
        const updatedAmountErrors = amountValidationFailures.map((item) => ({
          purpose: item,
          amount: amountErrormsg,
        }));
        setFormDataError((prev) => ({ ...prev, amount: updatedAmountErrors }));
        return toast.error(amountErrormsg);
      }

      // If previous errors still exist
      if (Object.values(formDataError).some((err) => err?.length > 0)) {
        return toast.error("Please fix the errors first.");
      }

      // Success
      setReceiptData(formData);
      setReceiptOpen(true);
    } catch (error) {
      console.error("handleSubmit error:", error.message);
      toast.error("Something went wrong.");
    }
  };

  const handleRegisterAndPrint = async () => {
    try {
      setIsPrintLoading(true);
      const newPayment = {
        id: payments.length + 1,
        ...receiptData,
        recipt: formData?.PRNo || "-",
        reason: receiptData.reason.join(", "),
      };

      const payload = {
        paymentType: formData?.method,
        descriptionId:
          services?.length > 0
            ? services?.filter(
                (item) =>
                  normalizeText(item.description) ===
                  normalizeText(formData?.services)
              )[0]?.id
            : 0,
        cardNumber: `${Number(formData?.cardNumber)}`,
        amount: formData.amount,
        description: formData?.description || "-",
        createdby: tokenvalue?.name,
        paymentRefNo: formData?.PRNo,
        channel: formData.digitalChannel || "-",
        paymentVerifingID: formData.trxref || "-",
        patientWorkID: formData.employeeId || "-",
        organization: formData?.organization || "-",
        groupID: "-",
      };

      const userData = await fetchPatientData(Number(formData?.cardNumber));

      let msg;
      if (Object.values(userData || {})?.some((item) => item?.length > 0)) {
        msg = await registerUser(userData);
      } else {
        toast.error("Patient Is Not Registered.");
        return;
      }

      if (msg?.toLowerCase().includes("internal server error.")) {
        toast.error("Someting is wrong. please try again!");
        return;
      }

      const response = await api.post("/Payment/add-payment", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 201) {
        const final = {
          ...newPayment,
          patientName: response?.data?.data?.map((item) => item.patientName)[0],
          cbhiId: response?.data?.data?.map((item) => item.patientCBHI_ID)[0],
          refNo: response?.data?.refNo || "-",
        };
        setReceiptOpen(false);
        setFormData(initialState);
        setFormDataError(initialState);
        setPatientName("");
        setServices([]);
        toast.success(`Payment Regitstered Under ${response?.data?.refNo}`);
        setRefresh((prev) => !prev);
        generatePDF(final);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.errorDescription || "Internal Server Error."
      );
    } finally {
      setIsPrintLoading(false);
    }
  };

  const columns = [
    {
      field: "registeredOn",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.registeredOn);
      },
    },
    { field: "referenceNo", headerName: "Reciept Number", flex: 1 },
    { field: "recipt", headerName: "Paper Reciept Number", flex: 1 },
    { field: "patientName", headerName: "Name", flex: 1 },
    { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
    {
      field: "paymentAmount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => formatAccounting2(params.row.paymentAmount),
    },
    {
      field: "paymentType",
      headerName: "Payment Method",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0,
            color:
              params?.row?.paymentType === "CASH"
                ? "green"
                : params?.row?.paymentType?.toUpperCase()?.includes("CREDIT")
                ? "red"
                : "black",
            fontSize: "0.9rem",
          }}
        >
          {params?.row?.paymentType}
        </span>
      ),
    },
    { field: "paymentReason", headerName: "Reason", flex: 1 },
    {
      field: "paymentDescription",
      headerName: "Description",
      flex: 1,
      renderCell: (params) => {
        return params?.row?.paymentDescription.split(":-")[0];
      },
    },
    {
      field: "paymentIsCollected",
      headerName: "Coll",
      flex: 1,
      renderCell: (params) => {
        const { paymentIsCollected, paymentType } = params.row;
        const isCash = paymentType?.toLowerCase()?.includes("cash");

        if (isCash && paymentIsCollected === 1) {
          return <CheckCircleIcon sx={{ color: green[500] }} />;
        } else if (isCash && paymentIsCollected !== 1) {
          return <CancelIcon sx={{ color: orange[500] }} />;
        } else {
          return <RemoveCircleOutlineIcon sx={{ color: grey[500] }} />;
        }
      },
    },
  ];

  const openNewTab = (id) => {
    window.open(
      `https://cs.bankofabyssinia.com/slip/?trx=${id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleOpenPage = async () => {
    try {
      setIsChecking(true);
      if (formData?.trxref?.length <= 0) {
        toast.info("Transaction Refference Number is Empty.");
        return;
      }

      if (formDataError?.trxref?.length > 0 || trxRefError?.length > 0) {
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

  const handleGetPatientName = async () => {
    try {
      setIsFetching(true);

      if (patientName?.length <= 0) {
        if (
          formDataError?.cardNumber?.length <= 0 &&
          cardNumberError?.length <= 0 &&
          formData?.cardNumber?.length > 0
        ) {
          const response = await fetchPatientData(Number(formData?.cardNumber));

          if (
            response?.patientFirstName ||
            response?.patientMiddleName ||
            response?.patientLastName
          ) {
            const fullName =
              response?.patientFirstName +
              " " +
              response?.patientMiddleName +
              " " +
              response?.patientLastName;
            setPatientName(fullName);
          } else {
            toast.error(
              response?.response?.data?.details || "Card Number Not Registered."
            );
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {language === "AMH" ? "የክፍያ መቆጣጠሪያ" : "Hospital Payment Management"}
      </Typography>
      <Paper sx={{ padding: 2, marginBottom: 2, display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            label={language === "AMH" ? "የካርድ ቁጥርቁጥር" : "Card Number"}
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            fullWidth
            error={
              cardNumberError?.length > 0
                ? !!cardNumberError
                : !!formDataError?.cardNumber
            }
            helperText={
              cardNumberError?.length > 0
                ? cardNumberError
                : formDataError?.cardNumber?.length > 0
                ? formDataError?.cardNumber
                : patientName
            }
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",

                "&:hover fieldset": {
                  borderColor: "info.main",
                },
                "&.Mui-focused fieldset": {
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isFetching && <CircularProgress size={24} color="inherit" />}
                </InputAdornment>
              ),
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
            FormHelperTextProps={{
              style: {
                color:
                  !!cardNumberError || !!formDataError?.cardNumber
                    ? "red"
                    : "green",
                fontSize: "14px",
              },
            }}
            onBlurCapture={(e) => handleGetPatientName()}
          />
          <Typography variant="subtitle1" gutterBottom>
            {language === "AMH" ? "ምክንያት" : "Select Reason*"}
          </Typography>
          {formDataError?.reason?.length > 0 && (
            <Typography variant="subtitle1" color="error" gutterBottom>
              {formDataError?.reason}
            </Typography>
          )}

          {reasons?.map((reason) => (
            <FormControlLabel
              key={reason}
              control={
                <Checkbox
                  checked={formData?.reason?.includes(reason)}
                  onChange={() => handleCheckboxChange(reason)}
                  sx={{
                    color: checkboxColor,
                    "&.Mui-checked": {
                      color: checkboxColor,
                    },
                  }}
                />
              }
              label={reason}
            />
          ))}

          {/* TextFields for Selected Checkboxes */}
          {formData?.reason?.map((reason, index) => (
            <TextField
              key={index}
              name={reason}
              label={`${reason} Amount`}
              fullWidth
              required
              margin="normal"
              value={
                formData?.amount?.find((item) => item.purpose === reason)
                  ?.amount || ""
              }
              onChange={(e) => handleAmountChange(e, reason)}
              onWheel={(e) => e.target.blur()} // <-- Prevent scroll change
              type="number"
              InputProps={{
                min: 0, // Prevents negative values
                step: "any", // Allows decimal values
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px", // Rounded edges for a modern look

                  "&:hover fieldset": {
                    borderColor: "info.main", // Changes border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
              }}
              error={
                !!formDataError?.amount
                  .filter((item) => item.purpose === reason)
                  .map((item) => item.amount)[0]
              }
              helperText={
                formDataError?.amount
                  .filter((item) => item.purpose === reason)
                  .map((item) => item.amount)[0]
              }
            />
          ))}

          <TextField
            select
            label="Payment Method"
            name="method"
            value={formData.method}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px", // Rounded edges for a modern look

                "&:hover fieldset": {
                  borderColor: "info.main", // Changes border color on hover
                },
                "&.Mui-focused fieldset": {
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
            error={!!formDataError?.method}
            helperText={formDataError?.method}
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
            {paymentMethods?.map((method) => (
              <MenuItem key={method?.type} value={method?.type}>
                {method?.type}
              </MenuItem>
            ))}
          </TextField>
          {formData?.method?.toUpperCase().includes("CASH") && (
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
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px", // Rounded edges for a modern look

                  "&:hover fieldset": {
                    borderColor: "info.main", // Changes border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
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

          {formData?.method.toUpperCase().includes("DIGITAL") && (
            <>
              <TextField
                select
                label="Digital Channel"
                name="digitalChannel"
                value={formData.digitalChannel}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
                error={!!formDataError?.digitalChannel}
                helperText={formDataError?.digitalChannel}
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
                {digitalChannels?.map((channel) => (
                  <MenuItem key={channel} value={channel}>
                    {channel}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Transaction Reference No"
                name="trxref"
                value={formData.trxref}
                error={
                  trxRefError?.length > 0
                    ? !!trxRefError
                    : !!formDataError?.trxref
                }
                helperText={
                  trxRefError?.length > 0 ? trxRefError : formDataError?.trxref
                }
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
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
              ></TextField>
            </>
          )}
          {formData?.method.toUpperCase().includes("CREDIT") && (
            <>
              <TextField
                select
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                fullWidth
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
                error={!!formDataError?.organization}
                helperText={formDataError?.organization}
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
                {organizations.map((org) => (
                  <MenuItem key={org} value={org}>
                    {org}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Employee Id"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                fullWidth
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px", // Rounded edges for a modern look

                    "&:hover fieldset": {
                      borderColor: "info.main", // Changes border color on hover
                    },
                    "&.Mui-focused fieldset": {
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
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

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px", // Rounded edges for a modern look

                "&:hover fieldset": {
                  borderColor: "info.main", // Changes border color on hover
                },
                "&.Mui-focused fieldset": {
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
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
            fullWidth
            sx={{ marginTop: 2 }}
            onClick={handleSubmit}
          >
            Check Receipt
          </Button>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ padding: 2, marginBottom: 2 }}>
            <Typography variant="h3">Payment Summary</Typography>
            <hr />
            {/* <SmartCards data={paymentSummary} /> */}
            {paymentSummary.map((summary) => (
              <Box
                key={summary.method}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 1,
                }}
              >
                <Typography sx={{ fontWeight: "bolder" }}>
                  {summary.method}
                </Typography>
                <Typography>{formatAccounting(summary.amount)}</Typography>
              </Box>
            ))}
            <hr />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 1,
              }}
            >
              <Typography sx={{ fontWeight: "bolder" }}>Total</Typography>

              <Typography>
                {formatAccounting(
                  paymentSummary
                    ?.filter((item) => !item?.method?.includes("REVERSED"))
                    .map((e) => e.amount)
                    .reduce((acc, num) => acc + num, 0)
                )}
              </Typography>
            </Box>
          </Paper>
          <Button
            variant="contained"
            color="success"
            //startIcon={<AttachMoneyIcon />}
            onClick={() => navigate("/payment-entry")}
            sx={{
              display: "flex",
              marginTop: "100px",
              justifySelf: "flex-end",
            }}
          >
            Back To List
          </Button>
        </Box>
      </Paper>
      <Paper sx={{ height: 400 }}>
        <DataGrid rows={payments.length ? payments : []} columns={columns} />
      </Paper>
      <ReceiptModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptData(null);
        }}
        data={receiptData}
        onPrint={handleRegisterAndPrint}
        onloading={isPrintLoading}
      />
      <ToastContainer />
    </Box>
  );
};
export default HospitalPayment;

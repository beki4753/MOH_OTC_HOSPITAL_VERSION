import React, { useState, useEffect } from "react";
import {
  Container,
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
  CircularProgress,
  colors,
} from "@mui/material";
import { PDFDocument, rgb } from "pdf-lib";
import numberToWords from "number-to-words";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";
import { jsPDF } from "jspdf";
import ReactDOM from "react-dom/client";
import ReceiptModal from "./ReceiptModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenValue } from "../../services/user_service";
import api from "../../utils/api";
import AddPatientInfo from "../../components/AddPatientInfo";
import { useLang } from "../../contexts/LangContext";
import AddCBHIInfo from "../../components/AddCBHIInfo";
import RenderPDF from "./RenderPDF";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { green, red, orange, grey } from "@mui/material/colors";

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

// const woredas = ["Woreda 1", "Woreda 2", "Woreda 3"]; // Add relevant woredas
// const organizations = ["Org A", "Org B", "Org C"]; // Add relevant organizations

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

const HospitalPayment = () => {
  const { language } = useLang();

  const [payments, setPayments] = useState([]);

  const [formData, setFormData] = useState({
    cardNumber: "",
    amount: [],
    method: "",
    description: "",
    reason: [],
    digitalChannel: "",
    woreda: "",
    trxref: "",
    organization: "",
    employeeId: "",
  });
  const [woredas, setWoredas] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [cardNumberError, setCardNumberError] = useState("");
  const [trxRefError, settrxRefError] = useState("");
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [paymentMethods, setPaymentMehods] = useState([]);
  const [digitalChannels, setDigitalChannels] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [isAdditonalInfo, setIsAdditionalInfo] = useState(false);
  const [isAdditonalCBHIInfo, setIsAdditionalCBHIInfo] = useState(false);
  const [cardsearchLoad, setCardSearchLoad] = useState(false);
  const [cbhisearchLoad, setCbhiSearchLoad] = useState(false);
  const [addPatientLoad, setAddPatienthLoad] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [cbhiId, setCbhiId] = useState("");
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [registeredCBHI, setRegisteredCBHI] = useState(null);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isAdditionalCBHILoading, setIsAdditionalCBHILoading] = useState(false);

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
            (a, b) => b.id - a.id
          );
          setPayments(sortedPayment);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchPaymetInfo();
    updatePaymentSummary(payments);
  }, [refresh, payments]);

  //fetch Reasons
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await api.get("/Lookup/payment-purpose");
        if (response?.status === 200) {
          setReasons(response?.data?.map((item) => item.purpose));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchReasons();
  }, []);

  //fetch paymentmethods
  useEffect(() => {
    const fetchMeth = async () => {
      try {
        const response = await api.get("/Lookup/payment-type");
        if (response?.status === 200) {
          setPaymentMehods(
            response?.data
              ?.filter((item) => item.type !== "ALL")
              .map((item) => item.type)
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

  //Fetch (CBHI) providers
  useEffect(() => {
    const fetchCBHI = async () => {
      try {
        const response = await api.get(
          `/Providers/list-providers/${tokenvalue.name}`
        );
        if (response?.status === 200) {
          setWoredas(response?.data?.map((item) => item.provider));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchCBHI();
  }, []);

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(
          `/Organiztion/Organization/${tokenvalue.name}`
        );
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
    const summary = payments.reduce((acc, payment) => {
      const { type, amount } = payment;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += parseFloat(amount);
      return acc;
    }, {});

    const mapped = Object.entries(summary).map(([key, value]) => ({
      method: key,
      amount: value,
    }));

    setPaymentSummary(mapped);
  };

  const handleChange = (e) => {
    try {
      setFormData({ ...formData, [e.target.name]: e.target.value });

      if (e.target.name === "trxref") {
        validateTransactionRef(e.target.value);
      }
      if (e.target.name === "cardNumber") {
        handleNumberOnlyCheck(e.target.value);
        setPatientName("");
        setCbhiId("");
        setRegisteredCBHI(null);
        setRegisteredPatient(null);
      }
      if (e.target.name === "method") {
        setFormData((prev) => ({
          ...prev,
          woreda: "",
          trxref: "",
          organization: "",
          employeeId: "",
          digitalChannel: "",
        }));
        setCbhiId("");
        setRegisteredCBHI(null);
      }

      if (e.target.name === "woreda") {
        setCbhiId("");
        setRegisteredCBHI(null);
      }
    } catch (error) {
      console.error(error.message);
    }
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
      setFormData((prev) => {
        // Update reason array (toggle selection)
        const updatedReason = prev.reason.includes(reason)
          ? prev.reason.filter((r) => r !== reason)
          : [...prev.reason, reason];

        const updatedAmount = [...prev.amount];

        // If the reason is being removed, remove the corresponding amount entry
        if (!updatedReason.includes(reason)) {
          return {
            ...prev,
            reason: updatedReason,
            amount: updatedAmount.filter((item) => item.purpose !== reason), // Remove related amount
          };
        }

        return { ...prev, reason: updatedReason, amount: updatedAmount };
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAmountChange = (e, reason) => {
    try {
      setFormData((prev) => {
        const updatedAmount = prev.amount.map((item) =>
          item.purpose === reason
            ? { ...item, Amount: Math.abs(parseFloat(e.target.value)) }
            : item
        );

        if (!updatedAmount.some((item) => item.purpose === reason)) {
          updatedAmount.push({
            purpose: reason,
            Amount: Math.abs(parseFloat(e.target.value)),
          });
        }

        return { ...prev, amount: updatedAmount };
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleNumberOnlyCheck = (value) => {
    try {
      const regex = /^[0-9]*$/;
      if (!regex.test(value)) {
        setCardNumberError("Please Insert Number Only");
      } else if (value.length < 6 || value.length > 6) {
        setCardNumberError("Please Insert 6 Digit Number.");
      } else {
        setCardNumberError("");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSubmit = () => {
    try {
      if (
        !formData.cardNumber ||
        !!cardNumberError ||
        formData.reason.length <= 0 ||
        formData.amount.length <= 0 ||
        !formData.method ||
        (formData.method.toUpperCase().includes("DIGITAL") &&
          (!formData.digitalChannel ||
            !formData.trxref ||
            trxRefError.length > 0)) ||
        (formData.method.toUpperCase().includes("CBHI") && !formData.woreda) ||
        (formData.method.toUpperCase().includes("CREDIT") &&
          (!formData.organization || !formData.employeeId))
      ) {
        return window.alert("Please fill all the necessary fields!!");
      }

      // Validate amount based on reason
      const isAmountValid = formData.reason.every((reason) =>
        formData.amount.some(
          (item) => item.purpose === reason && item.Amount > 0
        )
      );

      if (!isAmountValid) {
        return window.alert(
          "Each reason must have a corresponding payment amount greater than 0!"
        );
      }

      setReceiptData(formData);
      setReceiptOpen(true);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleRegisterAndPrint = async () => {
    try {
      setIsPrintLoading(true);
      const newPayment = {
        id: payments.length + 1,
        ...receiptData,
        reason: receiptData.reason.join(", "),
      };
      const trxDate = new Date().toISOString();
      const response = await api.post(
        "/Payment/add-payment",
        {
          paymentType: formData.method,
          cardNumber: formData.cardNumber,
          hospital: tokenvalue?.Hospital,
          amount: formData.amount,
          description: formData?.description || "-",
          createdby: tokenvalue?.name,
          createdOn: trxDate,
          channel: formData.digitalChannel || "-",
          department: tokenvalue?.Departement,
          paymentVerifingID: formData.trxref || "-",
          patientLocation: formData.woreda || "-",
          patientWorkID: formData.employeeId || "-",
          patientWorkingPlace: formData?.organization || "-",
          userType: tokenvalue?.UserType,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        try {
          // To Add patient Name on the Reciept
          const add = await api.put("/Payment/patient-info", {
            patientCardNumber: formData?.cardNumber,
            hospital: tokenvalue?.Hospital,
            cashier: tokenvalue?.name,
          });

          const final = {
            ...newPayment,
            patientName: add?.data[0]?.patientName,
          };
          setReceiptOpen(false);
          setFormData({
            cardNumber: "",
            amount: [],
            method: "",
            description: "",
            reason: [],
            digitalChannel: "",
            woreda: "",
            trxref: "",
            organization: "",
            employeeId: "",
          });
          setRegisteredPatient(null);
          setPatientName("");
          setCbhiId("");
          setRegisteredCBHI(null);
          toast.success(`Payment Regitstered Under ${response?.data?.refNo}`);
          setRefresh((prev) => !prev);

          generatePDF(final, response?.data?.refNo);
          setIsPrintLoading(false);
        } catch (error) {
          console.error(error);
          setIsPrintLoading(false);
        }
      }
    } catch (error) {
      console.error(error);
      setIsPrintLoading(false);
      toast.error(error?.response?.data || "Internal Server Error.");
    }
  };

  // To Display print iframe
  const printPDF = (doc) => {
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
  const generatePDF = (data, refNo) => {
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
      doc.setFont("helvetica", "bold");
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
      doc.setFont("helvetica", "normal");
      drawText(`Receipt NO: ${refNo || "N/A"}`, marginLeft, yPos);
      yPos += lineHeight;
      drawText(`Address: Debre Brihan`, marginLeft, yPos);
      yPos += lineHeight;
      drawText(`Date: ${new Date().toLocaleDateString()}`, marginLeft, yPos);
      yPos += lineHeight;
      drawText(`Cashier: ${tokenvalue?.name || "N/A"}`, marginLeft, yPos);
      yPos += lineHeight;

      doc.setLineWidth(0.3);
      doc.line(marginLeft, yPos, marginRight, yPos);
      yPos += lineHeight;

      // Patient Info
      doc.setFont("helvetica", "bold");
      drawText(`Patient Name:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data?.patientName || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "bold");
      drawText(`Card Number:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.cardNumber || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "bold");
      drawText(`Payment Method:`, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      drawText(`${data.method || "N/A"}`, marginLeft + 35, yPos);
      yPos += lineHeight;

      if (data.method.toUpperCase().includes("DIGITAL")) {
        doc.setFont("helvetica", "bold");
        drawText("Channel:", marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.digitalChannel || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;

        doc.setFont("helvetica", "bold");
        drawText("Transaction Ref No:", marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.trxref || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;
      } else if (data.method.toUpperCase().includes("CBHI")) {
        doc.setFont("helvetica", "bold");
        drawText(`Woreda:`, marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.woreda || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;
      } else if (data.method.toUpperCase().includes("CREDIT")) {
        doc.setFont("helvetica", "bold");
        drawText(`Organization:`, marginLeft, yPos);
        doc.setFont("helvetica", "normal");
        drawText(`${data.organization || "N/A"}`, marginLeft + 35, yPos);
        yPos += lineHeight;
      }

      doc.line(marginLeft, yPos, marginRight, yPos);
      yPos += lineHeight;

      // Item Table
      doc.setFont("helvetica", "bold");
      drawText(`Reason`, marginLeft, yPos);
      drawText(`Price`, marginRight - 25, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "normal");
      data?.amount?.forEach((item) => {
        drawText(`${item.purpose}`, marginLeft, yPos);
        drawText(
          `${formatAccounting2(parseFloat(item.Amount).toFixed(2))}`,
          marginRight - 25,
          yPos
        );
        yPos += lineHeight;
      });

      doc.line(marginLeft, yPos, marginRight, yPos);
      yPos += lineHeight;

      const totalAmount = data?.amount
        ?.map((item) => parseFloat(item.Amount))
        .reduce((a, b) => a + b, 0);

      doc.setFont("helvetica", "bold");
      drawText(`Total In Figure`, marginLeft, yPos);
      drawText(
        `${formatAccounting2(totalAmount.toFixed(2))}`,
        marginRight - 25,
        yPos
      );
      yPos += lineHeight;

      drawText(`Total In Words : `, marginLeft, yPos);
      drawText(
        `${capitalizeWords(
          numberToWords.toWords(totalAmount.toFixed(2))
        )} birr`,
        marginLeft + 30,
        yPos,
        {
          maxWidth: maxWidth - 30, // to fit within the page
          align: "left",
        }
      );
      yPos += lineHeight * 2;

      doc.setFont("helvetica", "normal");
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

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "createdOn", headerName: "Date", width: 200 },
    { field: "refNo", headerName: "Reciept Number", width: 200 },
    { field: "cardNumber", headerName: "Card Number", width: 150 },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      renderCell: (params) => formatAccounting2(params.row.amount),
    },
    {
      field: "type",
      headerName: "Payment Method",
      width: 120,
      renderCell: (params) => (
        <Typography
          color={
            params.row.type === "CASH"
              ? "green"
              : params.row.type.toUpperCase().includes("CREDIT")
              ? "red"
              : "black"
          }
        >
          {params.row.type}
        </Typography>
      ),
    },
    { field: "purpose", headerName: "Reason", width: 190 },
    {
      field: "isCollected",
      headerName: "Coll",
      width: 10,
      renderCell: (params) => {
        const { isCollected, type } = params.row;
        const isCash = type?.toLowerCase().includes("cash");

        if (isCash && isCollected === 1) {
          return <CheckCircleIcon sx={{ color: green[500] }} />;
        } else if (isCash && isCollected !== 1) {
          return <CancelIcon sx={{ color: orange[500] }} />; // or use WarningAmberIcon
        } else {
          return <RemoveCircleOutlineIcon sx={{ color: grey[500] }} />; // Not applicable
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
    }
  };

  const handleAdditionalUser = async () => {
    try {
      setAddPatienthLoad(true);
      if (formData.cardNumber.length <= 0 || !!cardNumberError) {
        toast.error("please fill the card number!!");
        return;
      }

      const response = await api.put("/Payment/patient-info", {
        patientCardNumber: formData?.cardNumber,
        hospital: tokenvalue?.Hospital,
        cashier: tokenvalue?.name,
      });
      if (response.status === 200) {
        if (response.data.length <= 0 || response.data === "user not found") {
          setIsAdditionalInfo(true);
        } else {
          setRegisteredPatient(response?.data[0]);
          setPatientName(response?.data?.map((item) => item.patientName));
          setIsAdditionalInfo(true);
          return response?.data[0];
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data);
      return {};
    } finally {
      setAddPatienthLoad(false);
    }
  };

  const handleResetPatientInfo = () => {
    setRegisteredPatient(null);
  };
  const handleResetCBHIInfo = () => {
    setRegisteredCBHI(null);
  };

  const handleAdditionalCBHI = async () => {
    try {
      setCbhiSearchLoad(true);
      if (formData.cardNumber.length <= 0 || !!cardNumberError) {
        toast.error("Please fill out The Card Number First");
        return;
      }

      if (formData.woreda.length <= 0) {
        toast.error("Please select The woreda First");
        return;
      }

      const response = await api.put("/Payment/get-service-provider", {
        cardnumber: formData?.cardNumber,
        user: tokenvalue?.name,
      });
      if (response.status === 200) {
        setCbhiId(response?.data?.map((item) => item.idNo));
        const woreda = response?.data?.map((item) => item.provider)[0];
        if (response?.data?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            woreda: woredas.includes(woreda) ? woreda : "",
          }));
        }

        setRegisteredCBHI(response?.data[0]);
        setIsAdditionalCBHIInfo(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCbhiSearchLoad(false);
    }
  };

  const handleAddtionalPAtientInfo = async (Data) => {
    try {
      setCardSearchLoad(true);
      if (formData.cardNumber.length <= 0 || cardNumberError) {
        toast.error("Please fill out The Card Number First");
        return;
      } else {
        const response = await api.post("/Payment/add-patient-info", {
          patientCardNumber: formData?.cardNumber,
          patientName: Data.fullName,
          patientGender: Data.gender,
          patientAddress: Data.address,
          patientAge: Number(Data.age),
          createdBy: tokenvalue?.name,
          patientPhoneNumber: Data.phone,
        });
        if (response.status === 201) {
          toast.success(
            `${response?.data?.patientName} Is Registered Success Fully!`
          );
          setPatientName(response?.data?.patientName);
          setIsAdditionalInfo(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Internal Server Error!!");
    } finally {
      setCardSearchLoad(false);
    }
  };

  const handleAddtionalCBHIInfo = async (Data) => {
    try {
      if (formData.cardNumber.length <= 0) {
        toast.error("Please fill out The Card Number First");
        return;
      } else if (formData.woreda.length <= 0) {
        toast.error("Please fill out Woreda First");
        return;
      } else {
        setIsAdditionalCBHIInfo(true);
        try {
          setIsAdditionalCBHILoading(true);
          const response = await api.post("/Payment/add-service-provider", {
            provider: formData?.woreda,
            service: "CBHI",
            kebele: Data?.kebele,
            goth: Data?.goth,
            idNo: Data?.idNumber,
            referalNo: Data?.referalNum,
            letterNo: Data?.letterNum,
            examination: Data?.examination,
            cashier: tokenvalue?.name,
            cardNumber: formData?.cardNumber,
          });

          if (response.status === 201) {
            setCbhiId(response?.data?.idNo);
            toast.success("Add Successfully!");
            setIsAdditionalCBHIInfo(false);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsAdditionalCBHILoading(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Internal Server Error!!");
    }
  };

  return (
    <Container>
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
            error={!!cardNumberError}
            helperText={!!cardNumberError ? cardNumberError : patientName}
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",

                "&:hover fieldset": {
                  borderColor: "info.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main", // Focus effect
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
            FormHelperTextProps={{
              style: {
                color: !!cardNumberError ? "red" : "green",
                fontSize: "14px",
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    color="info"
                    onClick={handleAdditionalUser}
                    sx={{
                      borderRadius: "20px", // More rounded button
                      fontWeight: "bold",
                      textTransform: "none", // Removes uppercase
                      padding: "6px 16px",
                    }}
                  >
                    {cardsearchLoad ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Optional"
                    )}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="subtitle1" gutterBottom>
            {language === "AMH" ? "ምክንያት" : "Select Reason*"}
          </Typography>
          {reasons?.map((reason) => (
            <FormControlLabel
              key={reason}
              control={
                <Checkbox
                  checked={formData?.reason?.includes(reason)}
                  onChange={() => handleCheckboxChange(reason)}
                />
              }
              label={reason}
            />
          ))}

          {/* TextFields for Selected Checkboxes */}
          {formData?.reason?.map((reason) => (
            <TextField
              key={reason}
              name={reason}
              label={`${reason} Amount`}
              fullWidth
              required
              margin="normal"
              value={
                formData?.amount?.find((item) => item.purpose === reason)
                  ?.Amount || ""
              }
              onChange={(e) => handleAmountChange(e, reason)}
              type="number"
              inputProps={{
                min: 1, // Prevents negative values
                step: "any", // Allows decimal values
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px", // Rounded edges for a modern look

                  "&:hover fieldset": {
                    borderColor: "info.main", // Changes border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main", // Focus effect
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
              }}
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
                  borderColor: "primary.main", // Focus effect
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
          >
            {paymentMethods?.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
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
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
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
                error={!!trxRefError}
                helperText={trxRefError}
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
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleOpenPage} edge="end">
                        <OpenInNewIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
          {formData?.method.trim().toUpperCase().includes("CBHI") && (
            <TextField
              select
              label="woreda/Kebele"
              name="woreda"
              value={formData.woreda}
              onChange={handleChange}
              fullWidth
              required
              helperText={cbhiId}
              margin="normal"
              FormHelperTextProps={{
                style: { color: "green", fontSize: "14px" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px", // Rounded edges for a modern look

                  "&:hover fieldset": {
                    borderColor: "info.main", // Changes border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main", // Focus effect
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      color="info"
                      onClick={handleAdditionalCBHI}
                      sx={{
                        borderRadius: "20px", // More rounded button
                        fontWeight: "bold",
                        textTransform: "none", // Removes uppercase
                        padding: "6px 16px",
                      }}
                    >
                      {cbhisearchLoad ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Optional"
                      )}
                    </Button>
                  </InputAdornment>
                ),
              }}
            >
              {woredas?.map((woreda) => (
                <MenuItem key={woreda} value={woreda}>
                  {woreda}
                </MenuItem>
              ))}
            </TextField>
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
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
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
                      borderColor: "primary.main", // Focus effect
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                    },
                  },
                }}
              />
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
                  borderColor: "primary.main", // Focus effect
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)", // Nice glow
                },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
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
                    .map((e) => e.amount)
                    .reduce((acc, num) => acc + num, 0)
                )}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Paper>
      <Paper sx={{ height: 400 }}>
        <DataGrid
          rows={payments.length ? payments : []}
          columns={columns}
          // pageSize={5}
          // rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>
      <ReceiptModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
        }}
        data={receiptData}
        onPrint={handleRegisterAndPrint}
        onloading={isPrintLoading}
      />
      <AddPatientInfo
        isOpen={isAdditonalInfo}
        onClose={() => setIsAdditionalInfo(false)}
        onSubmit={handleAddtionalPAtientInfo}
        userData={registeredPatient}
        resetUserData={handleResetPatientInfo}
        adding={addPatientLoad}
      />
      <AddCBHIInfo
        isOpen={isAdditonalCBHIInfo}
        onClose={() => setIsAdditionalCBHIInfo(false)}
        onSubmit={handleAddtionalCBHIInfo}
        userData={registeredCBHI}
        resetUserData={handleResetCBHIInfo}
        adding={isAdditionalCBHILoading}
      />
      <ToastContainer />
    </Container>
  );
};
export default HospitalPayment;

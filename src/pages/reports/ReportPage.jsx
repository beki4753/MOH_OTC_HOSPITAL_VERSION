import React, { useState, useEffect, useMemo } from "react";
import {
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Select,
  FormControl,
  useTheme,
  OutlinedInput,
} from "@mui/material";
import api from "../../utils/api";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { GetAllPaymentType } from "../../services/report_service";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import { formatAccounting2 } from "../hospitalpayment/HospitalPayment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EtDatePicker from "mui-ethiopian-datepicker";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./NotoSansEthiopic-Regular-normal.js";
import { renderETDateAtCell } from "../../components/PatientSearch";

const normalizeType = (type) => type?.toString().trim().toLowerCase();

const keysToRemoveByPaymentType = {
  cash: [
    "carPlateNumber",
    "policePhone",
    "policeName",
    "accedentDate",
    "cbhiProvider",
    "patientWorkID",
    "idNo",
    "referalNo",
    "patientWorkingPlace",
  ],
  cbhi: [
    "carPlateNumber",
    "policePhone",
    "policeName",
    "accedentDate",
    "patientWorkingPlace",
    "patientWorkID",
  ],
  credit: [
    "carPlateNumber",
    "policePhone",
    "policeName",
    "accedentDate",
    "cbhiProvider",
    "idNo",
    "referalNo",
  ],
  traffic: [
    "cbhiProvider",
    "patientWorkID",
    "idNo",
    "referalNo",
    "patientWorkingPlace",
  ],
};

const exportToPDF = async (data) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    doc.setFont("NotoSansEthiopic-Regular", "normal");

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const availableWidth = pageWidth - 2 * margin;

    const widthDistribution = [
      2, 4, 10, 7, 5, 3, 4, 4, 4, 4, 5, 5, 6, 5, 6, 6, 6, 5, 5, 4, 4, 4,
    ];
    const totalUnits = widthDistribution.reduce((sum, w) => sum + w, 0);
    const columnStyles = {};
    widthDistribution.forEach((units, index) => {
      columnStyles[index] = {
        cellWidth: (units / totalUnits) * availableWidth,
      };
    });

    const topHeaders = [
      [
        "N.O",
        "Card Number",
        "Patient Name",
        "Patient Admitted Date",
        "Payment Type",
        "Age",
        "Gender",
        "Kebele",
        "Goth",
        "ID number",
        "Referral No",
        "Outpatient/ inpatient",
        "Expenses for service",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Total",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Card",
        "For examination",
        "Laboratory",
        "X-ray/ultrasound",
        "Bed",
        "Medicine",
        "Surgery",
        "Food",
        "Other",
        "Total",
      ],
    ];

    const formattedData = data.map((row) =>
      row.map((cell, colIndex) =>
        typeof cell === "number" && colIndex !== 0
          ? formatAccounting2(cell)
          : cell ?? ""
      )
    );

    autoTable(doc, {
      startY: 50,
      head: topHeaders,
      body: formattedData,
      styles: {
        font: "NotoSansEthiopic-Regular",
        fontSize: 7,
        cellPadding: 3,
        overflow: "linebreak",
        lineWidth: 0.1,
        lineColor: [80, 80, 80],
      },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: 255,
        fontSize: 7.5,
        halign: "center",
        valign: "middle",
        fontStyle: "bold",
      },
      bodyStyles: {
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [240, 250, 250],
      },
      columnStyles,
      theme: "grid",
      tableWidth: availableWidth, // Ensure table uses availableWidth
      margin: { left: margin, right: margin }, // Ensure same margins

      didParseCell: function (data) {
        if (data.section === "head") {
          if (data.row.index === 0) {
            if (data.column.index === 12) {
              data.cell.colSpan = 9;
              data.cell.content = "Expenses for service";
            } else if (data.column.index > 12 && data.column.index < 21) {
              data.cell.content = "";
            }
            if (data.column.index <= 11 || data.column.index === 21) {
              data.cell.rowSpan = 2;
            }
          }
          if (data.row.index === 1 && data.column.index <= 11) {
            data.cell.styles.fillColor = [22, 160, 133];
            data.cell.styles.textColor = [22, 160, 133];
          }
        }

        if (data.column.index >= 12 && data.section === "body") {
          data.cell.styles.halign = "right";
        }

        if (data.column.index === 21 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
        }
      },

      willDrawCell: function (data) {
        if (
          data.section === "head" &&
          data.row.index === 0 &&
          data.column.index > 12 &&
          data.column.index < 21
        ) {
          return false;
        }
        return true;
      },

      didDrawCell: function (data) {
        if (
          data.section === "head" &&
          data.row.index === 0 &&
          data.column.index === 12
        ) {
          const mergedWidth = data.table.columns
            .slice(12, 21)
            .reduce((sum, col) => sum + col.width, 0);

          doc.setFillColor(22, 160, 133);
          doc.rect(
            data.cell.x,
            data.cell.y,
            mergedWidth,
            data.cell.height,
            "F"
          );

          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.1);
          doc.rect(
            data.cell.x,
            data.cell.y,
            mergedWidth,
            data.cell.height,
            "S"
          );

          doc.setTextColor(255);
          doc.setFontSize(7.5);
          doc.setFont("NotoSansEthiopic-Regular", "normal");
          doc.text(
            "Expenses for service",
            data.cell.x + mergedWidth / 2,
            data.cell.y + data.cell.height / 2,
            { align: "center", baseline: "middle" }
          );
        }
      },

      didDrawPage: function () {
        doc.setFillColor(22, 160, 133);
        doc.rect(margin, 20, pageWidth - 2 * margin, 20, "F");

        doc.setTextColor(255);
        doc.setFontSize(16);
        doc.setFont("NotoSansEthiopic-Regular", "normal");
        doc.text("Service Cost Report", pageWidth / 2, 35, { align: "center" });

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("NotoSansEthiopic-Regular", "normal");
        doc.text(
          "Generated: " + new Date().toLocaleDateString(),
          margin,
          pageHeight - 20
        );
        doc.text(
          "Page " + doc.internal.getNumberOfPages(),
          pageWidth - margin,
          pageHeight - 20,
          {
            align: "right",
          }
        );
      },
    });

    doc.save("structured-report.pdf");
  } catch (error) {
    console.error("Export to PDF Error:", error);
    toast.error("Report generation failed.");
  }
};

// Filter options
const filterOptions = [
  { label: "Equal to", value: "=" },
  { label: "Greater than", value: ">" },
  { label: "Less than", value: "<" },
  { label: "Greater or equal", value: ">=" },
  { label: "Less or equal", value: "<=" },
  { label: "Not equal", value: "!=" },
  { label: "Between", value: "between" },
];

const ReportPage = () => {
  const [payments, setPayments] = useState([]);

  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredPayments, setFilteredPayments] = useState(payments);
  const [operator, setOperator] = useState("=");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [paymentMethods, setpaymentMethods] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    woreda: "",
    organization: "",
  });

  const [isLoading, setLoading] = useState(false);

  const theme = useTheme();

  const filteredRows = useMemo(() => {
    const parsedAge = parseInt(filterAge);
    const min = parseInt(minAge);
    const max = parseInt(maxAge);

    if (operator === "between") {
      if (isNaN(min) || isNaN(max)) return payments;
      return payments.filter((row) => row.age >= min && row.age <= max);
    }

    if (isNaN(parsedAge)) return payments;

    return payments.filter((row) => {
      switch (operator) {
        case ">":
          return row.age > parsedAge;
        case "<":
          return row.age < parsedAge;
        case "=":
          return row.age === parsedAge;
        case ">=":
          return row.age >= parsedAge;
        case "<=":
          return row.age <= parsedAge;
        case "!=":
          return row.age !== parsedAge;
        default:
          return true;
      }
    });
  }, [operator, filterAge, minAge, maxAge, payments]);

  //Fetch (CBHI) providers
  useEffect(() => {
    const fetchCBHI = async () => {
      try {
        const response = await api.get(`/Providers/list-providers`);
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

  useEffect(() => {
    const fetchData = async () => {
      setpaymentMethods(await GetAllPaymentType());
    };

    fetchData();
  }, []);

  useEffect(() => {
    try {
      const newSet = new Set(payments.map((item) => item.paymentType));
      const prev = new Set(
        paymentMethods.map((item) => item?.type?.toLowerCase())
      );
      const diffSet = new Set(
        [...newSet].filter((x) => !prev.has(x?.toLowerCase()))
      );

      if (diffSet.size === 0) return;

      const maxId =
        paymentMethods?.length > 0
          ? Math.max(...paymentMethods.map((item) => item.id))
          : 0;

      const newEntries = Array.from(diffSet).map((type, index) => ({
        id: maxId + index + 1,
        type,
      }));

      setpaymentMethods((prevData) => [...prevData, ...newEntries]);
    } catch (error) {
      console.error("Filter Error : ", error);
    }
  }, [payments]);

  const cumulativeDataModifier = async () => {
    try {
      const sorted = [...filteredPayments]
        .map(({ id, visitingDate, ...rest }) => rest)
        .sort((a, b) => a.name.localeCompare(b.name));

      const withOrder = sorted.map((item, index) => ({
        No: index + 1,
        ...item,
      }));

      const grouped = withOrder.reduce((acc, item) => {
        const {
          No,
          referenceNumber,
          cardPaid,
          unltrasoundPaid,
          examinationPaid,
          medicinePaid,
          laboratoryPaid,
          bedPaid,
          surgeryPaid,
          foodpaid,
          otherPaid,
          totalPaid,
          ...rest
        } = item;

        const key = JSON.stringify(rest); // serialize grouping keys

        if (!acc[key]) {
          acc[key] = {
            ...rest,
            cardPaid: 0,
            unltrasoundPaid: 0,
            examinationPaid: 0,
            medicinePaid: 0,
            laboratoryPaid: 0,
            bedPaid: 0,
            surgeryPaid: 0,
            foodpaid: 0,
            otherPaid: 0,
            totalPaid: 0,
          };
        }

        acc[key].cardPaid += cardPaid || 0;
        acc[key].unltrasoundPaid += unltrasoundPaid || 0;
        acc[key].examinationPaid += examinationPaid || 0;
        acc[key].medicinePaid += medicinePaid || 0;
        acc[key].laboratoryPaid += laboratoryPaid || 0;
        acc[key].bedPaid += bedPaid || 0;
        acc[key].surgeryPaid += surgeryPaid || 0;
        acc[key].foodpaid += foodpaid || 0;
        acc[key].otherPaid += otherPaid || 0;
        acc[key].totalPaid += totalPaid || 0;

        return acc;
      }, {});

      const result = Object.values(grouped);

      const resultAmended = result.map((item, index) => {
        const normalizedType = normalizeType(selectedMethod);
        const keysToRemove = keysToRemoveByPaymentType[normalizedType] || [];

        const amended = { No: index + 1 };

        Object.entries(item).forEach(([key, value]) => {
          if (!keysToRemove.includes(key)) {
            amended[key] = value;
          }
        });

        return amended;
      });

      return resultAmended;
    } catch (error) {
      console.error("This is Cumulative data modifier error: ", error);
    }
  };

  const dataModifier = async () => {
    try {
      const sorted = [...filteredPayments]
        .map(({ id, visitingDate, ...rest }) => rest)
        .sort((a, b) => a.name.localeCompare(b.name));

      const withOrder = sorted.map((item, index) => ({
        No: index + 1,
        ...item,
      }));

      const columnsFilter = withOrder.map((item) => {
        const normalizedType = normalizeType(selectedMethod);
        const keysToRemove = keysToRemoveByPaymentType[normalizedType] || [];

        const amended = {};

        Object.entries(item).forEach(([key, value]) => {
          if (!keysToRemove.includes(key)) {
            amended[key] = value;
          }
        });

        return amended;
      });

      return columnsFilter;
    } catch (error) {
      console.error("This is data modifier error: ", error);
    }
  };

  const exportToExcel = async () => {
    try {
      if (filteredPayments?.length < 0) {
        toast.info("Empty Data.");
        return;
      }

      const columnsFilter = await dataModifier();
      const ws = XLSX.utils.json_to_sheet(columnsFilter);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments Report");
      XLSX.writeFile(
        wb,
        `Payments_Report_${startDate}_to_${endDate}_${selectedMethod}.xlsx`
      );
    } catch (error) {
      console.error("This is Export To Excell Error: ", error);
      toast.error("Report Generation Failed.");
    }
  };

  const cumulativeReport = async () => {
    try {
      if (filteredPayments?.length < 0) {
        toast.info("Empty Data.");
        return;
      }
      const resultAmended = await cumulativeDataModifier();
      const ws = XLSX.utils.json_to_sheet(resultAmended);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments Report");
      XLSX.writeFile(
        wb,
        `Payments_Report_${startDate}_to_${endDate}_${selectedMethod}.xlsx`
      );
    } catch (error) {
      console.error(error);
      toast.error("Report Generation Failed.");
    }
  };

  const StyledGridOverlay = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    "& .no-results-primary": {
      fill: "#3D4751",
      ...theme.applyStyles("light", {
        fill: "#AEB8C2",
      }),
    },
    "& .no-results-secondary": {
      fill: "#1D2126",
      ...theme.applyStyles("light", {
        fill: "#E8EAED",
      }),
    },
  }));

  function CustomNoResultsOverlay() {
    return (
      <StyledGridOverlay>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          width={96}
          viewBox="0 0 523 299"
          aria-hidden
          focusable="false"
        >
          <path
            className="no-results-primary"
            d="M262 20c-63.513 0-115 51.487-115 115s51.487 115 115 115 115-51.487 115-115S325.513 20 262 20ZM127 135C127 60.442 187.442 0 262 0c74.558 0 135 60.442 135 135 0 74.558-60.442 135-135 135-74.558 0-135-60.442-135-135Z"
          />
          <path
            className="no-results-primary"
            d="M348.929 224.929c3.905-3.905 10.237-3.905 14.142 0l56.569 56.568c3.905 3.906 3.905 10.237 0 14.143-3.906 3.905-10.237 3.905-14.143 0l-56.568-56.569c-3.905-3.905-3.905-10.237 0-14.142ZM212.929 85.929c3.905-3.905 10.237-3.905 14.142 0l84.853 84.853c3.905 3.905 3.905 10.237 0 14.142-3.905 3.905-10.237 3.905-14.142 0l-84.853-84.853c-3.905-3.905-3.905-10.237 0-14.142Z"
          />
          <path
            className="no-results-primary"
            d="M212.929 185.071c-3.905-3.905-3.905-10.237 0-14.142l84.853-84.853c3.905-3.905 10.237-3.905 14.142 0 3.905 3.905 3.905 10.237 0 14.142l-84.853 84.853c-3.905 3.905-10.237 3.905-14.142 0Z"
          />
          <path
            className="no-results-secondary"
            d="M0 43c0-5.523 4.477-10 10-10h100c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 53 0 48.523 0 43ZM0 89c0-5.523 4.477-10 10-10h80c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 99 0 94.523 0 89ZM0 135c0-5.523 4.477-10 10-10h74c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 181c0-5.523 4.477-10 10-10h80c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 227c0-5.523 4.477-10 10-10h100c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM523 227c0 5.523-4.477 10-10 10H413c-5.523 0-10-4.477-10-10s4.477-10 10-10h100c5.523 0 10 4.477 10 10ZM523 181c0 5.523-4.477 10-10 10h-80c-5.523 0-10-4.477-10-10s4.477-10 10-10h80c5.523 0 10 4.477 10 10ZM523 135c0 5.523-4.477 10-10 10h-74c-5.523 0-10-4.477-10-10s4.477-10 10-10h74c5.523 0 10 4.477 10 10ZM523 89c0 5.523-4.477 10-10 10h-80c-5.523 0-10-4.477-10-10s4.477-10 10-10h80c5.523 0 10 4.477 10 10ZM523 43c0 5.523-4.477 10-10 10H413c-5.523 0-10-4.477-10-10s4.477-10 10-10h100c5.523 0 10 4.477 10 10Z"
          />
        </svg>
        <Box sx={{ mt: 2 }}>No results found.</Box>
      </StyledGridOverlay>
    );
  }

  useEffect(() => {
    if (formData?.organization?.length <= 0 && formData.woreda?.length <= 0) {
      setFilteredPayments(
        filteredRows
          ? filteredRows?.filter((payment) =>
              selectedMethod === "ALL"
                ? payment
                : payment.paymentType.toLowerCase() ===
                  selectedMethod.toLocaleLowerCase()
            )
          : []
      );
    }
  }, [selectedMethod, startDate, endDate, filteredRows]);

  const handleMethodChange = (event, newValue) => {
    setSelectedMethod(newValue);
    setFormData({
      woreda: "",
      organization: "",
    });
  };

  const calculateTotal = (method) => {
    try {
      return filteredRows
        ? filteredRows
            ?.filter((payment) =>
              method === "ALL"
                ? payment
                : payment.paymentType?.toLowerCase() === method?.toLowerCase()
            )
            .reduce((sum, payment) => sum + Number(payment.totalPaid), 0)
        : 0; // Ensure amount is treated as a number
    } catch (error) {
      console.error("Calc Error : ", error);
    }
  };

  const columns = [
    { field: "referenceNumber", headerName: "Ref No.", flex: 1 },
    {
      field: "treatmentDate",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.treatmentDate);
      },
    },
    { field: "cardNumber", headerName: "Card Number", flex: 1 },
    { field: "name", headerName: "Patient Name", flex: 1 },
    { field: "cbhiProvider", headerName: "Woreda/Kebele", flex: 1 },
    { field: "idNo", headerName: "ID No", flex: 1 },
    { field: "patientWorkingPlace", headerName: "Working Place", flex: 1 },
    { field: "patientWorkID", headerName: "Working Place ID", flex: 1 },
    { field: "paymentType", headerName: "Payment Method", flex: 1 },

    {
      field: "totalPaid",
      headerName: "Total Paid",
      width: 120,
      renderCell: (params) => formatAccounting2(params.row.totalPaid),
    },
  ];

  const dateObj = {
    sdate: setStartDate,
    edate: setEndDate,
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    try {
      const jsDate =
        selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

      if (isNaN(jsDate.getTime())) {
        console.error(
          "Invalid date provided to handleChangeTime:",
          selectedDate
        );
        toast.error("Invalid date selected.");
        return;
      }
      const finalDateTime = jsDate.toLocaleDateString("en-CA");
      dateObj[fieldName](finalDateTime);
    } catch (error) {
      console.error("Date Picker Change Error:", error);
      toast.error("Unable to select the date properly.");
    }
  };

  const handleReportRequest = async () => {
    try {
      setLoading(true);
      if (startDate === "" || endDate === "") {
        alert("Please select start and end date");
        return;
      }

      const datas = await api.put("/Payment/rpt-all-Payment", {
        startDate: startDate.replace(" +03:00", ""),
        endDate: endDate.replace(" +03:00", ""),
      });

      if (datas?.status === 200) {
        const modData = datas?.data?.map((item, index) => ({
          id: index + 1,
          ...item,
        }));
        setPayments(() => {
          if (!modData) return [];

          return modData.filter((item) => item.totalPaid !== 0);
        });

        setFilteredPayments(
          filteredRows
            ? filteredRows?.filter((payment) =>
                selectedMethod === "ALL"
                  ? payment
                  : payment.paymentType.toLowerCase() ===
                    selectedMethod.toLowerCase()
              )
            : []
        );
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = (name, value) => {
    try {
      if (name === "woreda") {
        if (filteredRows?.length <= 0) {
          toast.info("Empty Filter.");
          return;
        }
        const copy = filteredRows;
        setFilteredPayments(
          copy?.filter(
            (item) => item.kebele?.toLowerCase() === value.toLowerCase()
          )
        );
      } else if (name === "organization") {
        const copy = filteredRows;
        setFilteredPayments(
          copy?.filter(
            (item) =>
              item.patientWorkingPlace?.toLowerCase() === value.toLowerCase()
          )
        );
      }
    } catch (error) {
      console.error("The Data Filter Error", error);
    }
  };

  const handleChange = (e) => {
    try {
      if (e.target.name === "woreda") {
        setSelectedMethod("CBHI");
        setFormData({ organization: "", [e.target.name]: e.target.value });
      } else {
        setSelectedMethod("Credit");
        setFormData({ woreda: "", [e.target.name]: e.target.value });
      }
      filterData(e.target.name, e.target.value);
    } catch (error) {
      console.error("This is Handle change error: ", error);
    }
  };

  const handlexportToPDF = async () => {
    try {
      if (filteredPayments?.length < 0) {
        toast.info("Empty Data.");
        return;
      }

      const data = await cumulativeDataModifier();
      const exportToPDFData = data.map((item, index) => [
        item?.No,
        item.cardNumber || "",
        item.name || "",
        renderETDateAtCell(item.treatmentDate),
        item?.paymentType,
        item.age || "",
        item.gender || "",
        item.kebele || "",
        item.goth || "",
        item.idNo || "",
        item.referalNo || "",
        item.patientType || "",
        item.cardPaid ?? 0,
        item.examinationPaid ?? 0,
        item.laboratoryPaid ?? 0,
        item.unltrasoundPaid ?? 0,
        item.bedPaid ?? 0,
        item.medicinePaid ?? 0,
        item.surgeryPaid ?? 0,
        item.foodpaid ?? 0,
        item.otherPaid ?? 0,
        item.totalPaid ?? 0,
      ]);

      exportToPDF(exportToPDFData);
    } catch (error) {
      console.error("This is export to pdf handler error: ", error);
    }
  };

  const handleOperatorChange = (e) => {
    try {
      const { value } = e.target;
      setOperator(value);
      if (value === "between") {
        setFilterAge("");
      } else {
        setMaxAge("");
        setMinAge("");
      }
    } catch (error) {
      console.error("This is handle Operator Change error: ", error);
    }
  };
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ margin: 2 }}>
        Payment Reports
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          m: 2,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Report Filter Panel
        </Typography>

        <Grid container columnSpacing={1} rowSpacing={2}>
          {/* Start Date */}
          <Grid item xs={12} sm={6} md={2}>
            <EtDatePicker
              key={startDate || "startDate"}
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(e) => {
                handleChangeTime("sdate", e);
                setFormData({ woreda: "", organization: "" });
              }}
              required
              fullWidth
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6} md={2}>
            <EtDatePicker
              key={endDate || "endDate"}
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(e) => {
                handleChangeTime("edate", e);
                setFormData({ woreda: "", organization: "" });
              }}
              required
              fullWidth
            />
          </Grid>

          {/* Request Report */}
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleReportRequest}
              // fullWidth
              disabled={isLoading}
              // sx={{ height: "100%" }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Request Report"
              )}
            </Button>
          </Grid>

          {/* Woreda */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Woreda"
              name="woreda"
              value={formData.woreda}
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
              {woredas.map((woreda) => (
                <MenuItem key={woreda} value={woreda}>
                  {woreda}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Organization */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Organization"
              name="organization"
              value={formData.organization}
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
              {organizations.map((org, index) => (
                <MenuItem key={index} value={org}>
                  {org}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Filter Type */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <Select
                value={operator}
                label="Filter Type"
                onChange={(e) => handleOperatorChange(e)}
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
              >
                {filterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Between input */}
          {operator === "between" ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Min Age"
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  fullWidth
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Max Age"
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  fullWidth
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
            </>
          ) : (
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                type="number"
                label="Age"
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                fullWidth
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
          )}
        </Grid>

        {/* Tabs for payment methods */}
        <Tabs
          value={selectedMethod}
          onChange={handleMethodChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ marginTop: 3 }}
          TabIndicatorProps={{
            sx: {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.secondary.main
                  : theme.palette.primary.main,
            },
          }}
        >
          {paymentMethods?.length > 0 &&
            paymentMethods.map((method) => (
              <Tab
                key={method.type}
                label={`${method.type} (${calculateTotal(method.type)})`}
                value={method.type}
                sx={{
                  color: theme.palette.text.primary,
                  "&.Mui-selected": {
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.secondary.main
                        : theme.palette.primary.main,
                  },
                }}
              />
            ))}
        </Tabs>
      </Paper>
      <Paper sx={{ height: 400, margin: 2 }}>
        <DataGrid
          rows={filteredPayments?.length ? filteredPayments : []}
          columns={columns}
          loading={isLoading}
          slots={{
            noResultsOverlay: CustomNoResultsOverlay,
          }}
        />
      </Paper>
      <Button
        sx={{ marginLeft: 2 }}
        variant="contained"
        color="primary"
        onClick={() => exportToExcel()}
      >
        Export to Excel
      </Button>
      <Button
        sx={{ marginLeft: 2 }}
        variant="contained"
        color="primary"
        onClick={() => cumulativeReport()}
      >
        Cumulative Export
      </Button>

      <Button
        sx={{ marginLeft: 2 }}
        variant="contained"
        color="primary"
        onClick={() => handlexportToPDF()}
      >
        Export to PDF
      </Button>

      <ToastContainer />
    </Box>
  );
};

export default ReportPage;

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Switch,
  FormControlLabel,
  useTheme,
  OutlinedInput,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EtDatePicker from "mui-ethiopian-datepicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import api from "../utils/api";
import { normalizeText } from "../utils/normalizer";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Well-known reasons for pivoting
const REASON_KEYS = [
  { key: "card", labels: ["CARD"] },
  { key: "examination", labels: ["FOR EXAMINATION", "FOR EXAMONATION"] },
  { key: "laboratory", labels: ["LABORATORY"] },
  { key: "xray_ultrasound", labels: ["X-RAY/ULTRASOUND"] },
  { key: "bed", labels: ["BED"] },
  { key: "medicines", labels: ["MEDICINES"] },
  { key: "surgery", labels: ["SURGERY"] },
  { key: "food", labels: ["FOOD"] },
];

const getReasonKey = (reason) => {
  if (!reason) return "other";
  const normalized = reason.trim().toUpperCase();
  for (const { key, labels } of REASON_KEYS) {
    if (labels.some((label) => normalized === label)) return key;
  }
  return "other";
};

const getDynamicColumns = (paymentTypeRaw, showDescription, reversedOnly) => {
  const paymentType = normalizeText(paymentTypeRaw);
  const columnMap = {
    digital: [
      { key: "paymentChannel", label: "Channel" },
      { key: "paymentVerifingID", label: "Verifying ID" },
    ],
    cash: [{ key: "recipt", label: "Paper Receipt" }],
    credit: [
      { key: "patientWorkingPlace", label: "Working Place" },
      { key: "patientWorkID", label: "Work Place ID" },
    ],
    traffic: [
      { key: "accedentDate", label: "Accident Date" },
      { key: "policeName", label: "Police Name" },
      { key: "policePhone", label: "Police Phone" },
      { key: "carPlateNumber", label: "Car Plate" },
      { key: "carCertificate", label: "Car Certificate" },
    ],
    cbhi: [
      { key: "patientWoreda", label: "Woreda" },
      { key: "patientKebele", label: "Kebele" },
      { key: "patientsGoth", label: "Goth" },
      { key: "patientCBHI_ID", label: "CBHI ID" },
      { key: "patientReferalNo", label: "Referral No" },
      { key: "patientLetterNo", label: "Letter No" },
    ],
    "free of charge": [],
  };

  const baseCols = columnMap[paymentType] || [];

  //show Description Check
  const interm = showDescription
    ? [...baseCols, { key: "ServiceIS", label: "Payment Sub Type" }]
    : baseCols;

  //Is Reversal Report Check
  const final = reversedOnly
    ? [
        ...interm,
        { key: "reversedBy", label: "Reversed By" },
        { key: "reversedOn", label: "Reversed Date" },
        { key: "reversalReason", label: "Reversal Reason" },
      ]
    : interm;
  return final;
};

const aggregatePaymentsByReason = (
  data,
  paymentType,
  renderDescription,
  reversedOnly
) => {
  const dynamicCols = getDynamicColumns(
    paymentType,
    renderDescription,
    reversedOnly
  );

  const reasonKeys = REASON_KEYS.map((r) => r.key).concat("other");
  const groups = {};
  data.forEach((row) => {
    const date = row.registeredOn?.split("T")[0];
    const groupKey = `${row.patientCardNumber}-${date}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        patientCardNumber: row.patientCardNumber,
        patientName: row.patientName,
        registeredOn: date,
      };
      reasonKeys.forEach((key) => {
        groups[groupKey][key] = 0;
      });
      dynamicCols.forEach((col) => {
        groups[groupKey][col.key] = row[col.key] ?? "";
      });
    }
    const reasonKey = getReasonKey(row.paymentReason);
    groups[groupKey][reasonKey] += Number(row.paymentAmount) || 0;
    dynamicCols.forEach((col) => {
      const prev = groups[groupKey][col.key];
      const curr = row[col.key] ?? "";
      if (prev === "") {
        groups[groupKey][col.key] = curr;
      } else if (prev !== curr) {
        groups[groupKey][col.key] = "Multiple";
      }
    });
  });
  // Add total column
  Object.values(groups).forEach((group) => {
    group.total = reasonKeys.reduce((sum, key) => sum + (group[key] || 0), 0);
  });
  return Object.values(groups);
};

const getColumns = (
  paymentType,
  isAggregated,
  renderDescription,
  reversedOnly
) => {
  const dynamicCols = getDynamicColumns(
    paymentType,
    renderDescription,
    reversedOnly
  );

  if (isAggregated) {
    const reasonCols = REASON_KEYS.map((r) => ({
      field: r.key,
      headerName: r.labels[0] + " Amount",
      flex: 1,
      type: "number",
    }));
    return [
      { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
      { field: "patientName", headerName: "Patient Name", flex: 1.5 },
      { field: "registeredOn", headerName: "Date", flex: 1 },
      ...dynamicCols.map((col) => ({
        field: col.key,
        headerName: col.label,
        flex: 1,
      })),
      ...reasonCols,
      { field: "other", headerName: "Other Amount", flex: 1, type: "number" },
      { field: "total", headerName: "Total", flex: 1, type: "number" },
    ];
  }
  // List mode
  const columns = [
    { field: "referenceNo", headerName: "Reference No", flex: 1 },
    { field: "patientName", headerName: "Patient Name", flex: 1.5 },
    { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
    { field: "patientGender", headerName: "Gender", flex: 1 },
    { field: "patientAge", headerName: "Patient Age", flex: 1 },
    { field: "registeredOn", headerName: "Admission Date", flex: 1 },

    ...dynamicCols.map((col) => ({
      field: col.key,
      headerName: col.label,
      flex: 1,
    })),
    { field: "paymentType", headerName: "Payment Type", flex: 1 },
    { field: "paymentReason", headerName: "Payment Reason", flex: 1 },
    {
      field: "paymentAmount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        return formatAccounting2(params?.row?.paymentAmount);
      },
    },
  ];
  return columns;
};

const PaymentTable = () => {
  const theme = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState("");
  const [viewAggregated, setViewAggregated] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().startOf("day"));
  const [endDate, setEndDate] = useState(dayjs().endOf("day"));
  const [reversedOnly, setReversedOnly] = useState(false);
  const [creditOrg, setCreditOrg] = useState("");
  const [woreda, setWoreda] = useState("");
  const [creditOrganizations, setCreditOrganizations] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [selctedServices, setSelectedServices] = useState("");
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [renderDescription, setRenderDescription] = useState(false);
  const [services, setServices] = useState([]);

  //Reset Sub Type on Payment Method Change
  useEffect(() => {
    setSelectedServices("");
  }, [paymentType]);

  //setRenderDescription check
  useEffect(() => {
    const check = paymentTypes
      ?.filter(
        (item) => normalizeText(item.type) === normalizeText(paymentType)
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
      const value = paymentTypes?.filter(
        (item) => normalizeText(item.type) === normalizeText(paymentType)
      )[0]?.description;
      setServices(value);
    } else {
      setServices([]);
    }
    setRenderDescription(check);
  }, [paymentTypes, paymentType]);

  //fetch payment Types
  useEffect(() => {
    const fetchType = async () => {
      try {
        const response = await api.get("/Lookup/payment-type-description");
        if (response?.status === 200) {
          setPaymentTypes(
            response?.data?.data?.filter(
              (item) => normalizeText(item?.type) !== "all"
            )
          );
        }
      } catch (error) {
        console.error("This is fetch Type handler error: ", error);
      }
    };
    fetchType();
  }, []);

  const handleResetData = () => {
    setPayments([]);
    setCreditOrganizations([]);
    setWoredas([]);
    setRenderDescription(false);
    setSelectedServices([]);
    setServices([]);
  };

  // Request report from backend
  const requestReport = async () => {
    try {
      setLoading(true);
      if (startDate?.length <= 0 || endDate?.length <= 0) {
        toast.error("Please Select Date first.");
        return;
      }

      handleResetData();
      const payload = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(reversedOnly === true
          ? { reversedOnly: true }
          : reversedOnly === false
          ? { reversedOnly: false }
          : {}),
      };

      const res = await api.put("/Payment/Get-all-Payment", payload);
      const data = res?.data?.map(({ paymentDescription, ...rest }) => ({
        ServiceIS: paymentDescription?.split(":")[0],
        paymentDescription,
        ...rest,
      }));

      setPayments(data || []);
      setCreditOrganizations(
        Array.from(
          new Set(
            (data || []).map((p) => p.patientWorkingPlace).filter(Boolean)
          )
        )
      );
      setWoredas(
        Array.from(
          new Set((data || []).map((p) => p.patientWoreda).filter(Boolean))
        )
      );
    } catch (err) {
      console.error("This is Request Report Error: ", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter payments by type and selects (client-side)
  const filteredPayments = payments.filter((p) => {
    if (
      !!paymentType &&
      normalizeText(p?.paymentType) !== normalizeText(paymentType)
    )
      return false;
    if (
      !!creditOrg &&
      normalizeText(p?.patientWorkingPlace) !== normalizeText(creditOrg)
    )
      return false;
    if (!!woreda && normalizeText(p?.patientWoreda) !== normalizeText(woreda))
      return false;
    if (
      renderDescription &&
      !!selctedServices &&
      normalizeText(p?.ServiceIS) !== normalizeText(selctedServices)
    )
      return false;
    if (reversedOnly !== "All" && p?.isReversed !== reversedOnly) {
      return false;
    }

    return true;
  });

  const displayedData = viewAggregated
    ? aggregatePaymentsByReason(
        filteredPayments,
        paymentType,
        renderDescription,
        reversedOnly
      )
    : filteredPayments.map((row, idx) => ({
        ...row,
        id: idx + 1,
      }));

  const columns = getColumns(
    paymentType,
    viewAggregated,
    renderDescription,
    reversedOnly
  );

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Payment Report");

      // Prepare Excel headers from DataGrid columns
      worksheet.columns = columns.map((col) => ({
        header: col.headerName,
        key: col.field,
        width: 20,
      }));

      // Populate rows using field keys
      displayedData.forEach((row) => {
        const rowData = {};
        columns.forEach((col) => {
          rowData[col.field] = row[col.field] ?? ""; // Use field key, not headerName
        });
        worksheet.addRow(rowData);
      });

      // Format header row
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Trigger file download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "Payment_Report.xlsx");
    } catch (error) {
      console.error("This is handle Export Excel Error: ", error);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Payment Records
      </Typography>
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <EtDatePicker
          key={startDate || "startDate-date"}
          label="Start Date"
          value={startDate ? new Date(startDate) : null}
          onChange={setStartDate}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.info.main, // Use actual color
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                borderColor: theme.palette.info.main, // Add border color for focus
              },
            },
          }}
        />
        <EtDatePicker
          key={endDate || "endDate-date"}
          label="End Date"
          value={endDate ? new Date(endDate) : null}
          onChange={setEndDate}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.info.main, // Use actual color
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                borderColor: theme.palette.info.main, // Add border color for focus
              },
            },
          }}
        />
        <FormControl
          sx={{
            minWidth: 150,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.info.main, // Use actual color
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                borderColor: theme.palette.info.main, // Add border color for focus
              },
            },
          }}
        >
          <InputLabel
            sx={{
              color: theme.palette.mode === "dark" ? "#fff" : "#000",
              "&.Mui-focused": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.MuiInputLabel-shrink": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
            }}
          >
            Reversed Only
          </InputLabel>

          <Select
            value={reversedOnly}
            label="Reversed Only"
            onChange={(e) => setReversedOnly(e.target.value)}
            input={
              <OutlinedInput
                label="Reversed Only"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                }}
              />
            }
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value={true}>Yes</MenuItem>
            <MenuItem value={false}>No</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
          onClick={() => requestReport()}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Request Report"
          )}
        </Button>
        <Button
          variant="contained"
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
          onClick={() => handleExportExcel()}
          disabled={loading}
        >
          Export To excell
        </Button>

        <FormControl
          sx={{
            minWidth: 150,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.info.main, // Use actual color
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                borderColor: theme.palette.info.main, // Add border color for focus
              },
            },
          }}
        >
          <InputLabel
            sx={{
              color: theme.palette.mode === "dark" ? "#fff" : "#000",
              "&.Mui-focused": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.MuiInputLabel-shrink": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
            }}
          >
            Payment Type
          </InputLabel>
          <Select
            value={paymentType}
            label="Payment Type"
            onChange={(e) => setPaymentType(e.target.value)}
            input={
              <OutlinedInput
                label="Payment Type"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                }}
              />
            }
          >
            <MenuItem value="">All</MenuItem>
            {paymentTypes.map((item) => (
              <MenuItem value={item?.type} key={item?.type}>
                {item?.type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {renderDescription && (
          <FormControl
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.info.main, // Use actual color
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                  borderColor: theme.palette.info.main, // Add border color for focus
                },
              },
            }}
          >
            <InputLabel
              sx={{
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
                "&.Mui-focused": {
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                },
                "&.MuiInputLabel-shrink": {
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                },
              }}
            >
              Sub type
            </InputLabel>
            <Select
              value={selctedServices}
              label="Sub type"
              onChange={(e) => setSelectedServices(e.target.value)}
              input={
                <OutlinedInput
                  label="Sub type"
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  }}
                />
              }
            >
              <MenuItem value="">All</MenuItem>
              {services?.map((serv) => (
                <MenuItem key={serv?.id} value={serv?.description}>
                  {serv?.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl
          sx={{
            minWidth: 170,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.info.main, // Use actual color
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                borderColor: theme.palette.info.main, // Add border color for focus
              },
            },
          }}
        >
          <InputLabel
            sx={{
              color: theme.palette.mode === "dark" ? "#fff" : "#000",
              "&.Mui-focused": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.MuiInputLabel-shrink": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
            }}
          >
            Credit Organization
          </InputLabel>
          <Select
            value={creditOrg}
            label="Credit Organization"
            onChange={(e) => setCreditOrg(e.target.value)}
            input={
              <OutlinedInput
                label="Credit Organization"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                }}
              />
            }
          >
            <MenuItem value="">All</MenuItem>
            {creditOrganizations.map((org) => (
              <MenuItem value={org} key={org}>
                {org}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          sx={{
            minWidth: 150,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.info.main, // Use actual color
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                borderColor: theme.palette.info.main, // Add border color for focus
              },
            },
          }}
        >
          <InputLabel
            sx={{
              color: theme.palette.mode === "dark" ? "#fff" : "#000",
              "&.Mui-focused": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.MuiInputLabel-shrink": {
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
            }}
          >
            Woreda
          </InputLabel>
          <Select
            value={woreda}
            label="Woreda"
            onChange={(e) => setWoreda(e.target.value)}
            input={
              <OutlinedInput
                label="Woreda"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                }}
              />
            }
          >
            <MenuItem value="">All</MenuItem>
            {woredas.map((w) => (
              <MenuItem value={w} key={w}>
                {w}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
              checked={viewAggregated}
              onChange={() => setViewAggregated((v) => !v)}
            />
          }
          label="Aggregated View"
        />
      </Box>
      <Box height={600}>
        <DataGrid
          rows={displayedData}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Box>
      <ToastContainer />
    </Box>
  );
};

export default PaymentTable;

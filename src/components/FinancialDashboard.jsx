import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { PieChart, Pie, Cell, Legend } from "recharts";
import AgreementDialog from "./AgreementDialog";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";
import { formatAccounting } from "../pages/hospitalpayment/HospitalPayment";
import { convertToEthDateWithTime } from "../pages/reports/CollectedReport";
import "./NotoSansEthiopic-Regular-normal.js";
import { renderETDateAtCell } from "./PatientSearch.jsx";

const tokenvalue = getTokenValue();

const formatter2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

const formatAccounting2 = (num) => {
  const formatted = formatter2.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

const COLORS = ["#00C49F", "#FF8042"];

const isNumber = (value) => !isNaN(parseFloat(value)) && isFinite(value);

const PaymentStatusCard = ({ title, amount, trend, status }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color="primary">
          ETB {amount.toLocaleString()}
        </Typography>
        <Box display="flex" alignItems="center" mt={2}>
          <Typography variant="body2" color="textSecondary">
            {isNumber(trend) ? trend : 0}% {status}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const FinancialDashboard = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    const fetchColl1 = async () => {
      try {
        const response1 = await api.get(`/Collection/uncollected`);

        const updatedUncollectedData =
          response1?.data.length > 0
            ? response1?.data?.map(({ uncollectedCashAmount, ...rest }) => ({
                collectedAmount: uncollectedCashAmount,
                ...rest,
              })) || []
            : [];

        const fetchColl = async () => {
          try {
            const response2 = await api.get(`/Collection/collection`);

            const updatedCollectedData =
              response2?.data.length > 0
                ? response2?.data?.map(({ collectionId, ...rest }) => ({
                    id: collectionId,
                    ...rest,
                  })) || []
                : [];

            return updatedCollectedData
              .map((prev) => ({ ...prev, status: "collected" }))
              .sort((a, b) => b.id - a.id);
          } catch (error) {
            console.error(
              "Error fetching collected transactions:",
              error.message
            );
            return [];
          }
        };

        const collected = await fetchColl();

        const maxId =
          collected.length > 0
            ? Math.max(...collected.map((item) => item.id))
            : 0;

        const transform = updatedUncollectedData.map((prev, index) => ({
          ...prev,
          id: maxId + index + 1,
        }));

        const transform2 = transform.map((prev) => ({
          ...prev,
          status: "uncollected",
          collectedOn: "",
          collectedBy: "",
        }));

        const final = [...collected, ...transform2].sort((a, b) => b.id - a.id);
        setTransactions(final);
      } catch (error) {
        console.error("Error in fetchColl1:", error);
      }
    };

    fetchColl1();
  }, [refresh]);

  const generatePDF = (data, amount) => {
    try {
      const doc = new jsPDF();

      // Set initial position
      let yPos = 20;

      // Add Header
      doc.setFontSize(16);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text("AGREEMENT PAPER", 105, yPos, { align: "center" });
      yPos += 8;

      // Separator Line
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text(`HOSPITAL NAME:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${tokenvalue?.Hospital || "N/A"}`, 100, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text(`CASHIER NAME:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${tokenvalue?.name || "N/A"}`, 100, yPos);
      yPos += 8;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text(`BANKER ID:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${data?.empId || "N/A"}`, 100, yPos);
      yPos += 8;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text("BANKER NAME:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${data?.empName || "N/A"}`, 100, yPos);
      yPos += 8;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text("MONEY AMOUNT:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${formatAccounting2(amount) || "N/A"}`, 100, yPos);
      yPos += 8;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text(`RECEIVED DATE:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(data?.signature || "N/A", 100, yPos);
      yPos += 20;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text(`REGISTERED DATE:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(data?.createdOn || "N/A", 100, yPos);
      yPos += 20;

      doc.setFont("NotoSansEthiopic-Regular", "normal");
      doc.text(
        `I confirm this agreement paper and agree to the terms of service`,
        40,
        yPos
      );
      yPos += 20;

      // SIGNATURE LINE
      doc.setFont("helvetica", "normal");
      doc.text(`CASHIER:`, 20, yPos);
      doc.setLineWidth(0.5);
      doc.line(45, yPos, 95, yPos);

      doc.setFont("helvetica", "normal");
      doc.text(`BANKER:`, 115, yPos);
      doc.setLineWidth(0.5);
      doc.line(140, yPos, 190, yPos);
      yPos += 10;

      // Save PDF
      doc.save(
        `${data?.signature || "unknown date"}_aggrement_between_${
          tokenvalue?.name || "unknown cashier"
        }_and_${data?.empName || "unknown banker"}_on_${
          amount ? amount : "unknown amount"
        }_money.pdf`
      );
    } catch (error) {
      console.error(error.message);
    }
  };

  const obj = {
    collectedBy: "teshale debela",
    collecterID: "ts1212",
    collectedOn: "2025-05-29T13:33:17.819Z",
    collectedAmount: 50,
    fromDate: "2025-05-29T13:28:29.470216",
    toDate: "2025-05-29T13:28:29.470216",
    casher: "Test1",
  };

  const handleSubmit = async (data) => {
    try {
      const payload = {
        collectedBy: data.empName,
        collecterID: data.empId.toLocaleLowerCase(),
        collectedOn: data.signature,
        collectedAmount: selectedTransaction.collectedAmount,
        fromDate: selectedTransaction.fromDate,
        toDate: selectedTransaction.toDate,
        casher: tokenvalue.name,
      };
      const response = await api.post("/Collection/collection", payload);
      if (response.status === 201) {
        toast.success(response?.data?.msg || "Cash Collected Successfully!");
        setRefresh((prev) => !prev);
        const modData = {
          empId: data?.empId,
          empName: data?.empName,
          signature: convertToEthDateWithTime(data?.signature),
          cashier: data?.cashier,
          createdOn: convertToEthDateWithTime(response?.data?.data?.createdOn),
        };
        generatePDF(modData, selectedTransaction.collectedAmount);
        setSelectedTransaction(null);

        setOpenDialog(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data || "Internal Server Error!");
    }
  };

  const collected = transactions
    .filter((t) => t.status === "collected")
    .reduce((sum, t) => sum + t.collectedAmount, 0);
  const uncollected = transactions
    .filter((t) => t.status === "uncollected")
    .reduce((sum, t) => sum + t.collectedAmount, 0);

  const collectedTrend = (collected * 100) / (collected + uncollected);

  const uncollectedTrend = (uncollected * 100) / (collected + uncollected);

  const handleCollectPayment = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenDialog(true);
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5, minWidth: 50 },
    {
      field: "fromDate",
      headerName: "Start Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.fromDate);
      },
    },
    {
      field: "toDate",
      headerName: "End Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.toDate);
      },
    },
    {
      field: "collectedAmount",
      headerName: "Amount",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => formatAccounting(params.value),
    },

    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0,
            color: params.row.status === "collected" ? "green" : "orange",
            fontSize: "0.9rem",
          }}
        >
          {params.row.status}
        </span>
      ),
    },
    { field: "collectedBy", headerName: "Collector", flex: 1, minWidth: 120 },
    {
      field: "collectedOn",
      headerName: "Collected Date",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 200,
      renderCell: (params) =>
        params.row.status === "uncollected" && (
          <Button
            variant="contained"
            color={theme.palette.mode === "light" ? "primary" : "secondary"}
            size="small"
            onClick={() => handleCollectPayment(params.row)}
          >
            Mark as Collected
          </Button>
        ),
    },
  ];

  const data = [
    { name: "Collected", value: collected },
    { name: "Uncollected", value: uncollected },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Financial Collection System
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <PaymentStatusCard
            title="Total Collected"
            amount={collected}
            trend={collectedTrend.toFixed(2)}
            status={"Collected"}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PaymentStatusCard
            title="Total Uncollected"
            amount={uncollected}
            trend={uncollectedTrend.toFixed(2)}
            status={"Uncollected"}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Collection Rate
              </Typography>
              <PieChart width={300} height={200}>
                <Pie
                  data={data}
                  cx={100}
                  cy={100}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ marginLeft: 20 }}
                />
                <Typography
                  variant="body2"
                  sx={{ position: "absolute", right: 10, top: 10 }}
                >
                  Legend
                </Typography>
              </PieChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <DataGrid rows={transactions} columns={columns} autoHeight />
        </CardContent>
      </Card>

      <AgreementDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        selectedTransaction={selectedTransaction}
        BackdropProps={{ style: { backgroundColor: "rgba(0, 0, 0, 0.5)" } }}
        onSubmit={handleSubmit}
      />
      <ToastContainer />
    </Box>
  );
};

export default FinancialDashboard;

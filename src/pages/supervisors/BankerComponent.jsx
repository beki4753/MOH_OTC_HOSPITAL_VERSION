import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Chip,
  Tooltip,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const mockCashPayments = [
  {
    id: 1,
    cashier: "Cashier 1",
    hospital: "City Hospital",
    amount: 1000,
    status: "Pending",
  },
  {
    id: 2,
    cashier: "Cashier 2",
    hospital: "General Hospital",
    amount: 1500,
    status: "Pending",
  },
];

const BankerComponent = () => {
  const [cashPayments, setCashPayments] = useState(() => {
    const storedPayments = localStorage.getItem("cashPayments");
    return storedPayments ? JSON.parse(storedPayments) : mockCashPayments;
  });
  const  [selectedHosp,setSelectedHosp] = useState({selectedHosp:""})


const handleChange = (e) => {
  setSelectedHosp(e.target.value);
};

  useEffect(() => {
    localStorage.setItem("cashPayments", JSON.stringify(cashPayments));
  }, [cashPayments]);

  const requestClearance = (cashierId) => {
    setCashPayments((prevPayments) =>
      prevPayments.map((payment) =>
        payment.id === cashierId ? { ...payment, status: "Pending" } : payment
      )
    );
  };

  const requestAllClearance = () => {
    setCashPayments((prevPayments) =>
      prevPayments.map((payment) => ({
        ...payment,
        status: "Pending",
      }))
    );
  };

  const clearAllByHospital = () => {
    setCashPayments((prevPayments) =>
      prevPayments.map((payment) => ({
        ...payment,
        status: "Pending",
      }))
    );
  };

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "cashier", headerName: "Cashier", width: 150 },
    { field: "hospital", headerName: "Hospital", width: 200 },
    { field: "amount", headerName: "Amount", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          color={
            params.row.status === "Pending"
              ? "warning"
              : params.row.status === "Pending Approval"
              ? "info"
              : "success"
          }
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Tooltip title="Request clearance for this cashier">
          <span>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => requestClearance(params.row.id)}
              disabled={params.row.status !== "Pending"}
            >
              Request Clearance
            </Button>
          </span>
        </Tooltip>
      ),
    },
  ];

  const formatter = new Intl.NumberFormat("en-us", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  });

  const formatAccounting = (num) => {
    const formatted = formatter.format(Math.abs(num));
    return num < 0 ? `(${formatted})` : formatted;
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" gutterBottom align="center">
        Banker Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body1">
                Total Cashiers: {cashPayments.length}
              </Typography>
              <Typography variant="body1">
                Total Amount:{" "}
                {formatAccounting(
                  cashPayments.reduce((acc, p) => acc + p.amount, 0)
                )}
              </Typography>
              <Typography variant="body1">
                Pending Clearance:{" "}
                {cashPayments.filter((p) => p.status === "Pending").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} md={6}>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            justifyContent="center"
          >
            <Tooltip title="Request clearance for all cashiers">
              <span>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={requestAllClearance}
                  disabled={cashPayments.every((p) => p.status !== "Pending")}
                >
                  Request Clearance for All
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Clear all cash payments by hospital">
              <span>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={clearAllByHospital}
                  // disabled={cashPayments.every((p) => p.status === "Cleared")}
                >
                  Clear All by Hospital
                </Button>
              </span>
            </Tooltip>
            <TextField
              select
              fullWidth
              label="Select Hospital"
              name="selectedHosp"
              value={selectedHosp}
              onChange={(e)=>handleChange(e)}
              margin="normal"
              required
            >
              {cashPayments.map((items)=>items.hospital).map((type, index) => (
                <MenuItem key={index} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ height: 400, marginTop: 3, padding: 2 }}>
        <DataGrid
          rows={cashPayments}
          columns={columns}
          pageSize={5}
          disableSelectionOnClick
        />
      </Paper>
    </Container>
  );
};

export default BankerComponent;

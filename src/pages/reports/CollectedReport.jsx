import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import api from "../../utils/api";
import { getTokenValue } from "../../services/user_service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatAccounting2 } from "../hospitalpayment/HospitalPayment";
import EtDatePicker from "mui-ethiopian-datepicker";
import { EthDateTime } from "ethiopian-calendar-date-converter";
import { renderETDateAtCell } from "../../components/PatientSearch";
import { tokens } from "../../theme";

const tokenvalue = getTokenValue();

export function convertToEthDateWithTime(isoDateStr) {
  try {
    if (!isoDateStr) return "";
    //GMT+0300 (East Africa Time)
    const europeanDate = new Date(
      isoDateStr.replace("T", " ") + " GMT+0300 (East Africa Time)"
    );
    const ethDateTime = EthDateTime.fromEuropeanDate(europeanDate);
    return ethDateTime.toFullDateTimeString();
  } catch (error) {
    console.error("Ethiopian DateTime Conversion Error:", error);
    return "Invalid Ethiopian Date";
  }
}
const CollectedReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showOnlyHighAmount, setShowOnlyHighAmount] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState([]);

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const fetchReportData = async (e) => {
    try {
      e.preventDefault();

      const response = await api.put("/Collection/Get-all-Collection", {
        startDate: startDate,
        endDate: endDate,
        user: tokenvalue?.name,
        isCollected: 0,
      });
      if (response?.data.length <= 0) {
        toast.info("Report not found!");
        return;
      }
      const data =
        response?.data.length > 0
          ? response?.data?.map(({ collectionId, ...rest }) => ({
              id: collectionId,
              ...rest,
            })) || []
          : [];
      setData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error(error?.response?.data?.msg || "Internal Server Error!");
    }
  };

  const filterData = () => {
    try {
      if (data.length > 0) {
        const filteredData = data?.filter((item) => {
          if (
            showOnlyHighAmount &&
            item.collectedAmount <
              Math.max(...data?.map((item) => item?.collectedAmount))
          )
            return false;
          return true;
        });
        setFilteredData(filteredData);
      } else {
        toast.info("There is No High Amount!");
        setFilteredData([]);
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  };

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

      // Adjust for local timezone
      const tzOffsetMinutes = jsDate.getTimezoneOffset();
      const localTime = new Date(jsDate.getTime() - tzOffsetMinutes * 60000);
      const formattedDate = localTime.toISOString().split("T")[0];

      dateObj[fieldName](formattedDate);
    } catch (error) {
      console.error("Date Picker Change Error:", error);
      toast.error("Unable to select the date properly.");
    }
  };

  useEffect(() => {
    if (showOnlyHighAmount) {
      filterData();
    }
  }, [showOnlyHighAmount]);

  const exportToExcel = () => {
    try {
      const modData = filteredData.length > 0 ? filteredData : data;
      const reportData = modData?.map(
        ({
          collectedOn,
          createdOn,
          createdBy,
          id,
          collectedBy,
          collecterID,
          toDate,
          fromDate,
          collectedAmount,
          casher,
        }) => ({
          fromDate: renderETDateAtCell(fromDate),
          toDate: renderETDateAtCell(toDate),
          collectedOn: convertToEthDateWithTime(collectedOn),
          collectedBy,
          collecterID,
          collectedAmount,
          casher,
          createdOn,
          createdBy,
        })
      );
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        `Collection Report of ${tokenvalue?.name}`
      );
      XLSX.writeFile(
        wb,
        `Collection_Report from ${startDate} to ${endDate}.xlsx`
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        mx: "auto",
        p: { xs: 2, sm: 3 },
        mt: 4,
        borderRadius: 2,
        //backgroundColor: "#f9f9f9",
        boxShadow: 3,
        marginInline: "15px",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Collection Report
      </Typography>
      <form onSubmit={fetchReportData}>
        <Paper
          sx={{
            padding: 2,
            marginBottom: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <EtDatePicker
            label="Start Date"
            value={startDate.length > 0 ? new Date(startDate) : null}
            onChange={(e) => {
              // setStartDate(e);
              handleChangeTime("sdate", e);
              setShowOnlyHighAmount(false);
            }}
            InputLabelProps={{ shrink: true }}
            required
          />

          <EtDatePicker
            label="End Date"
            value={endDate?.length > 0 ? new Date(endDate) : null}
            onChange={(e) => {
              // setEndDate(e);
              handleChangeTime("edate", e);
              setShowOnlyHighAmount(false);
            }}
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyHighAmount}
                onChange={(e) => setShowOnlyHighAmount(e.target.checked)}
              />
            }
            label="Show High Amount"
          />
          <Button variant="contained" color="secondary" type="submit">
            Request Report
          </Button>
        </Paper>
      </form>
      <Typography
        variant="h6"
        sx={{
          textAlign: "right",
          mb: 1,
          fontWeight: "bold",
          color: colors.greenAccent[500],
        }}
      >
        Total Collected:{" "}
        {formatAccounting2(
          (showOnlyHighAmount ? filteredData : data).reduce(
            (sum, item) => sum + (item.collectedAmount || 0),
            0
          )
        )}
      </Typography>

      <Paper sx={{ height: 400, marginBottom: 2 }}>
        <DataGrid
          rows={showOnlyHighAmount ? filteredData : data}
          columns={[
            { field: "id", headerName: "ID", width: 40 },
            {
              field: "fromDate",
              headerName: "Start Date",
              width: 150,
              renderCell: (params) => {
                return renderETDateAtCell(params?.row?.fromDate);
              },
            },
            {
              field: "toDate",
              headerName: "End Date",
              width: 140,
              renderCell: (params) => {
                return renderETDateAtCell(params?.row?.toDate);
              },
            },
            {
              field: "collectedAmount",
              headerName: "Amount",
              width: 130,
              renderCell: (params) =>
                formatAccounting2(params.row.collectedAmount),
            },
            { field: "collectedBy", headerName: "Collector", width: 200 },
            { field: "casher", headerName: "Cashier", width: 200 },
            {
              field: "collectedOn",
              headerName: "Collected Date",
              width: 170,
              renderCell: (params) => {
                return convertToEthDateWithTime(params?.row?.collectedOn);
              },
            },
          ]}
        />
      </Paper>
      <Button
        variant="contained"
        color="primary"
        sx={{
          color: (theme) =>
            theme.palette.getContrastText(theme.palette.primary.main),
          backgroundColor: (theme) => theme.palette.secondary.main,
          "&:hover": {
            backgroundColor: (theme) => theme.palette.primary.dark,
          },
        }}
        onClick={() => exportToExcel()}
      >
        Export to Excel
      </Button>
      <ToastContainer />
    </Box>
  );
};

export default CollectedReport;

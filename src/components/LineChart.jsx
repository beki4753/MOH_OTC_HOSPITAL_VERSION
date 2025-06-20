import React, { useEffect, useState, useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { getTokenValue } from "../services/user_service";
import api from "../utils/api";

const LineChart = ({ isCustomLineColors = false, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const tokenvalue = useMemo(() => getTokenValue(), []);

  // Set default dates: today and 7 days before, normalized
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.put("/Payment/Get-all-Payment", {
          startDate,
          endDate: today,
          user: tokenvalue?.name,
        });

        const filteredData = response?.data || [];

        const summary = filteredData
          .filter((item) => item.paymentType.toLowerCase() !== "free of charge")
          .reduce((acc, payment) => {
            const dateKey = new Date(payment.registeredOn)
              .toISOString()
              .split("T")[0];
            acc[dateKey] =
              (acc[dateKey] || 0) + parseFloat(payment.paymentAmount);
            return acc;
          }, {});

        const mapped = Object.entries(summary)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([date, amount]) => ({
            x: date,
            y: amount,
            Date: date,
            Amount: amount,
          }));

        setResult(mapped);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, today, tokenvalue]);

  const data = useMemo(
    () => [
      {
        id: "Transaction",
        color: tokens("dark").greenAccent[500],
        data: result,
      },
    ],
    [result]
  );

  if (loading) return <div>Loading chart...</div>;
  if (!result.length) return <></>;

  return (
    <ResponsiveLine
      data={data}
      theme={{
        axis: {
          domain: { line: { stroke: colors.grey[100] } },
          legend: { text: { fill: colors.grey[100] } },
          ticks: {
            line: { stroke: colors.grey[100], strokeWidth: 1 },
            text: { fill: colors.grey[100] },
          },
        },
        legends: {
          text: { fill: colors.grey[100] },
        },
      }}
      tooltip={({ point }) => (
        <div
          style={{
            background: colors.primary[400],
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            color: colors.grey[100],
          }}
        >
          <div>
            <strong>Date:</strong> {point.data.Date}
          </div>
          <div>
            <strong>Amount:</strong> {point.data.Amount}
          </div>
        </div>
      )}
      colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Date",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        orient: "left",
        tickValues: 5,
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Amount",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={false}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default LineChart;

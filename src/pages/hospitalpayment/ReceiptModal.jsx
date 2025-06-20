import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Slide,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import { EthiopianDate } from "habesha-datepicker/dist/util/EthiopianDateUtils";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const formatter = new Intl.NumberFormat("en-us", {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
});

const formatAccounting = (num) => {
  const formatted = formatter.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows,
    padding: theme.spacing(2),
  },
  backdropFilter: "blur(5px)",
}));

const ReceiptModal = ({ open, onClose, data, onPrint, onloading }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const getEthiopianDate = () => {
    const ndate = new Date();
    const etDate = EthiopianDate.toEth(ndate);
    const formattedString = `${etDate.Year}-${String(etDate.Month).padStart(
      2,
      "0"
    )}-${String(etDate.Day).padStart(2, "0")}`;
    return formattedString;
  };

  return (
    <StyledDialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose(); // Reset and close the modal
        }
      }}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
      disableEnforceFocus
    >
      <DialogTitle>Payment Receipt</DialogTitle>
      <DialogContent dividers>
        {data && data !== null && (
          <Typography
            component="pre"
            style={{ fontFamily: "Courier, monospace" }}
          >
            -----------------------------------
            {"\n"} Hospital Payment Receipt
            {"\n"}-----------------------------------
            {"\n"}Card Number : {data?.cardNumber}
            {"\n"}Amount :{" "}
            {formatAccounting(
              data?.amount
                ?.map((item) => item.amount)
                .reduce((a, b) => a + b, 0)
            )}
            {"\n"}Method : {data?.method}
            {"\n"}Reason :{" "}
            {Array.isArray(data?.reason) ? data?.reason.join(", ") : "N/A"}
            {"\n"}Description : {data?.description}
            {"\n"}Date : {getEthiopianDate()}
            {"\n"}-----------------------------------
            {"\n"} Thank you for your visit!
            {"\n"}-----------------------------------
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={onloading}
          onClick={onPrint}
          color={theme.palette.mode === "light" ? "primary" : "secondary"}
        >
          {onloading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Confirm"
          )}
        </Button>
        <Button
          onClick={onClose}
          color={theme.palette.mode === "light" ? "secondary" : "error"}
        >
          Close
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReceiptModal;

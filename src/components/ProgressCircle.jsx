import { Box, useTheme, Typography, Stack } from "@mui/material";
import { tokens } from "../theme";

const ProgressCircle = ({ 
  progress = "0.75", 
  size = "40", 
  showLegend = false,
  legendText = "",
  uncollectedLabel = "Uncollected",
  collectedLabel = "Collected"
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const angle = progress * 360;
  const percentage = Math.round(progress * 100);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* Progress Circle */}
      <Box
        sx={{
          background: `radial-gradient(${colors.primary[400]} 55%, transparent 56%),
            conic-gradient(transparent 0deg ${angle}deg, ${colors.blueAccent[500]} ${angle}deg 360deg),
            ${colors.greenAccent[500]}`,
          borderRadius: "50%",
          width: `${size}px`,
          height: `${size}px`,
        }}
      />

      {/* Conditional Legend */}
      {showLegend && (
        <Stack direction="row" spacing={2} alignItems="center">
          {/* UNCollected portion legend */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box 
              sx={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                backgroundColor: colors.blueAccent[500]
              }} 
            />
            <Typography variant="caption">
            {`${100 - percentage}% ${uncollectedLabel}`}
            </Typography>
          </Stack>
          
          {/* collected portion legend */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box 
              sx={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                backgroundColor: colors.greenAccent[500]
              }} 
            />
            <Typography variant="caption">
            {`${percentage}% ${collectedLabel}`}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default ProgressCircle;
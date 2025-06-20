import React, { useState } from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Typography,
} from "@mui/material";

const items = [
  { id: "item1", name: "Item 1" },
  { id: "item2", name: "Item 2" },
  { id: "item3", name: "Item 3" },
  { id: "item4", name: "Item 4" },
];

const DynamicFieldsForm = () => {
  const [selectedItems, setSelectedItems] = useState({});
  


  

  // Handle Checkbox Selection
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    console.log(event.target)
    setSelectedItems((prev) => {
      if (checked) {
        return { ...prev, [name]: "" }; // Add with empty amount
      } else {
        const newItems = { ...prev };
        delete newItems[name]; // Remove when unchecked
        return newItems;
      }
    });
  };

  // Handle Amount Input Change
  const handleAmountChange = (event, name) => {
    const { value } = event.target;
    setSelectedItems((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Form Submission
  const handleSubmit = () => {
    console.log("Selected Items with Amounts:", selectedItems);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: "auto", boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Items and Enter Amounts
      </Typography>

      {/* Checkboxes */}
      {items.map((item) => (
        <FormControlLabel
          key={item.id}
          control={
            <Checkbox
              name={item.name}
              checked={selectedItems.hasOwnProperty(item.name)}
              onChange={handleCheckboxChange}
            />
          }
          label={item.name}
        />
      ))}

      {/* TextFields for Selected Checkboxes */}
      {Object.keys(selectedItems).map((name) => (
        <TextField
          key={name}
          label={`${name} Amount`}
          fullWidth
          margin="normal"
          value={selectedItems[name]}
          onChange={(e) => handleAmountChange(e, name)}
          type="number"
        />
      ))}

      {/* Submit Button */}
      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
        Submit
      </Button>
    </Box>
  );
};

export default DynamicFieldsForm;

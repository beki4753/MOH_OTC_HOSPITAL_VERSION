import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Paper,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Box,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  AddCircleOutline,
  RemoveCircleOutline,
  ExpandMore,
  Edit,
} from "@mui/icons-material";
import api from "../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { normalizeText } from "../utils/normalizer";
const initialState = {
  type: "",
  descriptions: [],
};

const initialStateError = {
  type: "",
  descriptions: [""],
};
const PaymentTypeManager = () => {
  const theme = useTheme();
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentType, setPaymentType] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialState);
  const [formDataError, setFormDataError] = useState(initialStateError);
  const [refresh, setRefresh] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all payment types with descriptions
  const fetchPaymentTypes = async () => {
    try {
      const response = await api.get("/Lookup/payment-type-description");
      if (response?.data?.data) {
        setPaymentTypes(
          response.data.data
            ?.filter((item) => normalizeText(item?.type) !== "all")
            ?.map(({ id, ...rest }, index) => ({
              id: index + 1,
              mainId: id,
              ...rest,
            }))
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load payment types");
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, [refresh]);

  useEffect(() => {
    const fetchPaymentType = async () => {
      try {
        const response = await api.get("/Lookup/payment-type");
        if (response?.status === 200) {
          setPaymentType(
            response?.data
              ?.map((item) => item?.type)
              ?.filter((item) => normalizeText(item) !== "all")
          );
        }
      } catch (error) {
        console.error("This is fecth Payment Type error: ", error);
      }
    };
    fetchPaymentType();
  }, []);

  ///Edit handler
  const handleEditClick = (paymentType) => {
    setEditingId(paymentType.mainId);
    setFormData({
      type: paymentType.type,
      descriptions:
        paymentType?.description?.length > 0 ||
        paymentType?.description !== null
          ? paymentType?.description
          : [{ id: null, description: "" }],
    });
  };

  //Descriptions Change Handler
  const handleDescriptionChange = (index, value) => {
    const updated = [...formData.descriptions];

    setFormData((prev) => ({
      ...prev,
      descriptions: updated?.map((item, i) => {
        if (i === index) {
          return { id: item.id, description: value };
        }

        return item;
      }),
    }));
    isValidName(index, value);
  };

  //Description Validator
  const isValidName = (index, value) => {
    const regex = /^[A-Za-z0-9._\-\s]{2,}$/;
    const des = Array.isArray(formDataError?.descriptions)
      ? [...formDataError.descriptions]
      : [];

    if (!regex.test(value) && value?.length > 0) {
      des[index] =
        "Use only letters, numbers, space, dot (.), dash (-), or underscore (_) — at least 2 characters.";
      setFormDataError((prev) => ({
        ...prev,
        descriptions: des,
      }));
      return false;
    } else {
      des[index] = ""; // clear error at that index
      setFormDataError((prev) => ({
        ...prev,
        descriptions: des,
      }));
      return true;
    }
  };

  //Descriptions Add Handler
  const handleAddDescription = () => {
    setFormData((prev) => ({
      ...prev,
      descriptions: [...prev.descriptions, { id: null, description: "" }],
    }));
  };

  //Descriptions Remove Handler
  const handleRemoveDescription = async (index) => {
    try {
      if (
        formData?.descriptions?.some(
          (item) =>
            item.description === null ||
            item.description === undefined ||
            item.description.toString().trim() === ""
        )
      ) {
        toast.error("Please fill required fields.");
        setFormDataError({
          ...formDataError,
          descriptions: "Please fill this field.",
        });
        return;
      }

      if (editingId !== null) {
        //Remove the description for Edit
        setDeleteLoading(true);

        const removeData = formData?.descriptions?.filter(
          (_, i) => i === index
        );
        const response = await api.delete("/Lookup/payment-type-description", {
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            id: removeData[0]?.id,
          },
        });

        if (response?.status === 200) {
          if (formData.descriptions.length === 1) {
            toast.success(response?.data?.msg || "Removed Successfully.");
            setFormData(initialState);
            setRefresh((prev) => !prev);
            setEditingId(null);
            return;
          }
          toast.success(response?.data?.msg || "Removed Successfully.");
          setFormData((prev) => ({
            ...prev,
            descriptions: prev.descriptions.filter((_, i) => i !== index),
          }));
          setRefresh((prev) => !prev);
        }
      } else {
        //Remove the description for Create
        setFormData((prev) => ({
          ...prev,
          descriptions: prev.descriptions.filter((_, i) => i !== index),
        }));
      }
    } catch (error) {
      console.error("This is handle Remove Description error: ", error);
      toast.error(error?.response?.data?.msg || "Internal server error.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialState);
    setFormDataError(initialStateError);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const payload = {
        type: formData?.type,
        description: editingId
          ? formData?.descriptions?.filter((d) => d?.description?.trim() !== "")
          : formData?.descriptions
              ?.filter((d) => d?.description?.trim() !== "")
              ?.map((item) => item?.description),
      };

      if (
        formData?.type?.length <= 0 ||
        formData?.descriptions?.some(
          (item) =>
            item.description === null ||
            item.description === undefined ||
            item.description.toString().trim() === ""
        )
      ) {
        toast.error("Pleas fill required fields.");
        if (formData?.type?.length <= 0) {
          setFormDataError({
            ...formDataError,
            type: "Please fill this field.",
          });
        }

        if (
          formData?.descriptions?.some(
            (item) =>
              item.description === null ||
              item.description === undefined ||
              item.description.toString().trim() === ""
          )
        ) {
          setFormDataError({
            ...formDataError,
            descriptions: formData?.descriptions?.map(
              () => "Please fill this field."
            ),
          });
        }

        return;
      }

      if (
        !!formDataError?.type ||
        formDataError?.descriptions?.some((item) => item?.length > 0)
      ) {
        toast.error("Please fix the error first.");
        return;
      }

      if (editingId) {
        // Update existing
        const responses = await Promise.all(
          formData?.descriptions.map((desc) =>
            api.put("/Lookup/payment-type-description/", {
              id: desc?.id,
              discription: desc?.description,
            })
          )
        );

        let hasSuccess = false;

        responses?.forEach((res, i) => {
          if (res?.status === 200) {
            hasSuccess = true;
            toast.success(res?.data?.msg || `Description ${i + 1} updated.`);
          }
        });

        if (hasSuccess) {
          setRefresh((prev) => !prev);
          handleCancelEdit();
          setEditingId(null);
        }
      } else {
        // Create new
        const response = await api.post(
          "/Lookup/payment-type-description",
          payload
        );
        if (response?.status === 201) {
          setRefresh((prev) => !prev);
          handleCancelEdit();
          toast.success(
            response?.data?.msg ||
              (editingId ? "Updated successfully" : "Created successfully")
          );
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error?.response?.data?.msg || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        margin: 2,
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Payment Types Manager
      </Typography>

      {/* Edit/Create Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mt: 4,
          background: theme.palette.mode === "dark" && "#1f2a408a",
        }}
      >
        <Typography variant="h6" gutterBottom>
          {editingId ? "Edit Payment Type" : "Create New Payment Type"}
        </Typography>

        <TextField
          fullWidth
          select
          label="Payment Type"
          value={formData?.type}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, type: e.target.value }))
          }
          sx={{ mb: 3 }}
          error={!!formDataError?.type}
          helperText={formDataError?.type}
          InputProps={{
            sx: {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
          {paymentType?.map((item, index) => (
            <MenuItem key={index} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>

        {formData.descriptions.map((desc, index) => (
          <Grid
            container
            spacing={1}
            key={index}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Grid item xs={10}>
              <TextField
                fullWidth
                label={`Description ${index + 1}`}
                value={desc?.description || ""}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                error={!!formDataError?.descriptions[index]}
                helperText={formDataError?.descriptions[index]}
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
            <Grid item xs={2}>
              <IconButton onClick={() => handleRemoveDescription(index)}>
                {deleteLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <RemoveCircleOutline color="error" />
                )}
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            startIcon={<AddCircleOutline />}
            onClick={handleAddDescription}
            variant="outlined"
            color="inherit"
            disabled={editingId !== null}
          >
            Add Description
          </Button>
          <Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelEdit}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
              onClick={handleSubmit}
              disabled={
                !formData.type ||
                formData.descriptions.every(
                  (d) =>
                    d?.description?.trim() === "" || d?.description === null
                )
              }
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : editingId ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Display Section */}
      <div
        style={{
          marginTop: "40px",
        }}
      >
        {paymentTypes.map((type) => (
          <Accordion
            key={type.id}
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(45deg, #1f2a40 30%, #2c3a58 90%)"
                  : "linear-gradient(45deg, #f8f9fa 30%, #ffffff 90%)",
              borderRadius: "12px !important",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: theme.shadows[2],
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[6],
              },
              "&:before": {
                // Remove default divider
                display: "none",
              },
              "&.Mui-expanded": {
                margin: "16px 0",
                transform: "scale(1.005)",
              },
              mb: 2,
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMore sx={{ color: theme.palette.text.secondary }} />
              }
              sx={{
                transition: "background 0.2s ease",
                "&:hover": {
                  background:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                },
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                  py: 2,
                },
              }}
            >
              <Grid container alignItems="center">
                <Grid item xs={10}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      position: "relative",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: -8,
                        left: 0,
                        width: "40px",
                        height: "3px",
                        background: theme.palette.primary.main,
                        transition: "all 0.3s ease",
                        opacity: 0,
                      },
                    }}
                  >
                    {type.type}
                  </Typography>
                </Grid>
                <Grid item xs={2} textAlign="right">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(type);
                    }}
                    sx={{
                      transform: "scale(0.9)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.1)",
                        background:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              <List
                sx={{
                  background:
                    theme.palette.mode === "dark"
                      ? "rgba(0,0,0,0.15)"
                      : "rgba(255,255,255,0.5)",
                  borderRadius: "8px",
                  py: 0,
                }}
              >
                {type.description.map((desc, idx) => (
                  <ListItem
                    key={desc.id || idx}
                    sx={{
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateX(8px)",
                        background:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.02)",
                      },
                      "&:not(:last-child)": {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <ListItemText
                      primary={desc.description || "No description"}
                      primaryTypographyProps={{
                        sx: {
                          position: "relative",
                          "&:before": {
                            content: '"•"',
                            color:
                              theme.palette.mode === "light"
                                ? theme.palette.primary.main
                                : theme.palette.secondary.main,
                            mr: 1.5,
                            fontSize: "1.2rem",
                          },
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>

      <ToastContainer />
    </Paper>
  );
};

export default PaymentTypeManager;

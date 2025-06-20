import React, { useState } from 'react';
import {
  Box, Button, Stepper, Step, StepLabel, Typography, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Paper
} from '@mui/material';

const steps = ['Basic Info', 'Registration Type', 'Contact & Review'];

const initialData = {
  fullName: '',
  age: '',
  gender: '',
  registrationType: 'Normal',
  cbhiIdNumber: '',
  cbhiReferralNumber: '',
  cbhiLetterNumber: '',
  cbhiExamination: '',
  accidentDate: '',
  accidentAddress: '',
  carPlateNumber: '',
  policeName: '',
  policePhone: '',
  phoneNumber: '',
};

export default function PatientRegistrationForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialData);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      alert('Submitting: ' + JSON.stringify(formData, null, 2));
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Gender" name="gender" value={formData.gender} onChange={handleChange} />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Registration Type</InputLabel>
                <Select
                  name="registrationType"
                  value={formData.registrationType}
                  onChange={handleChange}
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="CBHI">CBHI</MenuItem>
                  <MenuItem value="Traffic Accident">Traffic Accident</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* CBHI fields */}
            {formData.registrationType === 'CBHI' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="ID Number" name="cbhiIdNumber" value={formData.cbhiIdNumber} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Referral Number" name="cbhiReferralNumber" value={formData.cbhiReferralNumber} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Letter Number" name="cbhiLetterNumber" value={formData.cbhiLetterNumber} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Examination" name="cbhiExamination" value={formData.cbhiExamination} onChange={handleChange} />
                </Grid>
              </>
            )}

            {/* Traffic Accident fields */}
            {formData.registrationType === 'Traffic Accident' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Accident Date" name="accidentDate" type="date" InputLabelProps={{ shrink: true }} value={formData.accidentDate} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Accident Address" name="accidentAddress" value={formData.accidentAddress} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Car Plate Number" name="carPlateNumber" value={formData.carPlateNumber} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Police Name" name="policeName" value={formData.policeName} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Police Phone" name="policePhone" value={formData.policePhone} onChange={handleChange} />
                </Grid>
              </>
            )}
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Review: {JSON.stringify(formData, null, 2)}</Typography>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" mb={2}>Patient Registration</Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Box mt={3}>{renderStepContent(activeStep)}</Box>

        <Box mt={4} display="flex" justifyContent="space-between">
          <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
          <Button variant="contained" onClick={handleNext}>
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

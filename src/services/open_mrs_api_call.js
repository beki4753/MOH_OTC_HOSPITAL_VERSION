import api2 from "../utils/api2";

export const fetchPatientData = async (cardNumber) => {
  try {
    if (cardNumber?.length <= 0) {
      console.error("Empty Card number provided.");
      return;
    }

    const response = await api2.post("/change", {
      cardNumber: cardNumber,
    });

    if (response?.status === 200) {
      const patient = response?.data?.results[0];
      const person = patient?.person;

      if (Object.values(patient || {})?.some((item) => item.length > 0)) {
        const payload = {
          patientCardNumber: patient?.identifiers[0]?.identifier || "",
          patientFirstName: person.preferredName?.givenName || "",
          patientMiddleName: person.preferredName?.middleName || "",
          patientLastName: person.preferredName?.familyName || "",
          patientMotherName: "",

          patientDOB:
            person.birthdate?.replace(" +03:00", "") ||
            new Date().replace(" +03:00", ""),
          patientGender:
            person?.gender?.toUpperCase() === "M" ? "Male" : "Female",

          patientReligion: "",
          patientPlaceofbirth: person.addresses[0]?.cityVillage || "",
          multiplebirth: "",

          appointment: "OPDCLINIC",
          patientPhoneNumber: "",

          iscreadituser: false,
          iscbhiuser: false,

          patientOccupation: "",
          department: "OutPatient Clinic",
          patientEducationlevel: "",
          patientMaritalstatus: "",

          patientSpouseFirstName: "",
          patientSpouselastName: "",

          patientRegisteredBy: patient.auditInfo?.creator?.display || "",
          patientVisitingDate:
            patient.auditInfo?.creator?.dateCreated || new Date().toISOString(),

          patientRegion: person.addresses[0]?.country || "Amhara",
          patientWoreda: person.addresses[0]?.cityVillage || "Amhara",
          patientKebele: "unknow",
          patientHouseNo: "",
          patientAddressDetail: "",

          patientPhone: "",

          patientKinRegion: "Amhara",
          patientKinWoreda: "unknow",
          patientKinKebele: "unknow",
          patientKinHouseNo: "",
          patientKinAddressDetail: "",
          patientKinPhone: "",
          patientKinMobile: "",
        };
        return payload;
      } else {
        return {};
      }
    }
  } catch (error) {
    console.error(
      "This is error of patient information get from OpenMRS: ",
      error
    );
    return error;
  }
};

export const fetchOrder = async (cardNumber, ordertype) => {
  try {
    if (!cardNumber || cardNumber.length === 0) {
      console.warn("Empty Card number provided.");
      return [];
    }

    const response = await api2.post("/r/orders", {
      cardNumber,
      orderType: ordertype,
    });

    if (response?.status === 200) {
      return response.data.orders;
    } else {
      console.warn("No orders found or invalid response.");
      return [];
    }
  } catch (error) {
    console.error(
      "Error fetching orders from OpenMRS:",
      error.response?.data?.error || error.message
    );
    return [];
  }
};

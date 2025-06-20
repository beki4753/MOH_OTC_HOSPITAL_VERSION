import api from "../utils/api";

export async function GetAllPaymentByDate(data) {
  try {
    const response = await api.put("/Payment/Get-all-Payment", data);
    const modData =
      response?.data?.length > 0
        ? response?.data?.map(({ rowId, ...rest }, index) => ({
            id: rowId,
            ...rest,
          }))
        : [];
    return modData;
  } catch (error) {
    console.error("This is GetAllPaymentByDate error: ", error);
    return null;
  }
}

export async function GetAllPaymentType() {
  try {
    const response = await api.get("/Lookup/payment-type");

    return response.data;
  } catch (error) {
    console.error("This is GetAllPaymentType error: ", error);
    return null;
  }
}

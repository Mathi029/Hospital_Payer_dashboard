// frontend/src/services/hospitalService.js
import api from "./api"; // Axios instance for API calls
import axios from "axios"; // Fallback to local JSON if API fails

// -------------------------
// Hospital Basic Information (OLD style, safe for existing pages)
// -------------------------
export const getHospitalsBasic = () => api.get("/hospitals/basic");

// -------------------------
// All Hospitals (Full JSON Data)
// -------------------------
export const getAllHospitals = () => api.get("/hospitals");

// -------------------------
// Single Hospital (Raw Data from hospitals.json)
// -------------------------
export const getHospitalById = (id) => api.get(`/hospitals/${id}`);

// -------------------------
// Single Hospital Profile (Detailed with contacts, specialties, address)
// -------------------------
export const getHospitalProfile = (id) => api.get(`/hospital/profile/${id}`);

// -------------------------
// Hospital Metrics (Placeholder, if backend provides)
// -------------------------
export const getHospitalMetrics = (id) => api.get(`/hospitals/${id}/metrics`);

// -------------------------
// Hospital Certifications (ALL hospitals)
// -------------------------
export const getAllHospitalCertifications = () =>
  api.get("/hospitals/certifications");

// -------------------------
// Hospital Certifications (Single Hospital by ID) → returns plain data
// -------------------------
export const getHospitalCertifications = async (hospitalId) => {
  try {
    const response = await getAllHospitalCertifications();
    const allHospitalsCerts = response.data;

    const hospitalData = allHospitalsCerts.find(
      (h) => String(h.hospital_id) === String(hospitalId)
    );

    if (!hospitalData) {
      console.warn(`No certifications found for hospital ${hospitalId}`);
      return [];
    }

    return Array.isArray(hospitalData.certifications)
      ? hospitalData.certifications
      : [];
  } catch (error) {
    console.error(
      `Error fetching certifications for hospital ${hospitalId}:`,
      error
    );
    return [];
  }
};

// -------------------------
// Hospital Equipment (Optional category filter)
// -------------------------
export const getHospitalEquipment = (id, category = null) =>
  api.get(`/hospitals/${id}/equipment`, {
    params: category ? { category } : {},
  });

// -------------------------
// Hospital Contacts (Standalone endpoint)
// -------------------------
export const getHospitalContacts = () => api.get("/hospitals/contacts");

// -------------------------
// Hospital Specialties (Standalone endpoint)
// -------------------------
export const getHospitalSpecialties = (params = {}) =>
  api.get("/hospitals/specialties", { params });

// -------------------------
// Hospital Addresses (Fallback to local JSON if API fails)
// -------------------------
export const getHospitalAddresses = async () => {
  try {
    const response = await api.get("/hospital_addresses");
    return response.data;
  } catch (error) {
    console.warn(
      "⚠️ API /hospital_addresses not found, loading local hospital_addresses.json instead..."
    );
    const localResponse = await axios.get("/hospital_addresses.json");
    return localResponse.data;
  }
};

// -------------------------
// ✅ NEW: Hospital Doctors with Specialties (Doctor Directory)
// Returns plain JSON data
// -------------------------
export const getHospitalDoctors = async (hospitalId) => {
  try {
    const response = await api.get(
      `/hospital/${hospitalId}/doctor-directory`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching hospital doctors:", error);
    return [];
  }
};

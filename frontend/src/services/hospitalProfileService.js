// frontend/src/services/hospitalDataService.js
import api from "./api";

// -------------------------
// All Hospitals (Full Profile - Single Endpoint)
// -------------------------
/**
 * Fetches a comprehensive list of all hospitals with their full profile,
 * including addresses, contacts, and specialties, in a single API call.
 * @returns {Promise<Object[]>} A promise that resolves to an array of hospital objects.
 */
export const getAllHospitalsFullProfile = () => {
  return api.get("/hospitals/full-profile");
};
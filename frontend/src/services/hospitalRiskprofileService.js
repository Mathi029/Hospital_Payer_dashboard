// hospitalRiskprofileService.js

/**
 * A service module to handle API calls related to hospital risk profiles.
 * This centralizes the fetching logic, making the UI components cleaner.
 */

// Define the base URL for the backend API.
// In a production environment, this would typically be an environment variable.
const API_BASE_URL = "http://localhost:8000";

/**
 * Fetches the comprehensive risk profile data for a given hospital.
 * @param {number} hospitalId The unique identifier of the hospital.
 * @returns {Promise<Object>} A promise that resolves with the hospital's risk profile data.
 * @throws {Error} Throws an error if the network request fails or the response is not ok.
 */
export async function getHospitalRiskProfile(hospitalId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hospitals/risk-profile/${hospitalId}`);

    // Check if the response was successful
    if (!response.ok) {
      // If the response is not OK, parse the error message and throw a new error
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch hospital risk profile:", error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}

/**
 * Fetches a list of all hospitals with their basic risk profile.
 * This is used for the initial dashboard view.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of hospital objects.
 * @throws {Error} Throws an error if the network request fails.
 */
export async function getAllHospitals() {
  try {
    // We'll assume a new backend endpoint exists at /api/hospitals/list
    const response = await fetch(`${API_BASE_URL}/api/hospitals/list`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch all hospitals:", error);
    throw error;
  }
}
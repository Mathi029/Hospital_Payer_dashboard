/**
 * @file hospitalISOService.js
 * @description Service file for fetching ISO certification data from the backend.
 * This file contains functions to interact with the FastAPI API related to hospital certifications.
 */

// Define the base URL for the backend API.
// In a real application, this should be an environment variable.
const API_BASE_URL = "http://localhost:8000";

/**
 * Fetches the ISO 9001 certification status for all hospitals.
 * This function calls the /hospitals/iso-certification endpoint.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects
 * containing certification data for each hospital, including their status (Valid/Expired).
 * @throws {Error} If the network request fails or the response is not ok.
 */
export const getISOCertificationStatus = async () => {
  try {
    // Construct the full URL for the API endpoint.
    const url = `${API_BASE_URL}/hospitals/iso-certification`;

    // Make the GET request to the backend.
    const response = await fetch(url);

    // Check if the response was successful.
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON data from the response.
    const data = await response.json();

    // Log the data for debugging purposes.
    console.log("ISO Certification Data:", data);

    return data;
  } catch (error) {
    // Log the error and re-throw it so the calling component can handle it.
    console.error("Failed to fetch ISO certification status:", error);
    throw error;
  }
};

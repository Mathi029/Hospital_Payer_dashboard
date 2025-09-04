/**
 * File: SurgicalCapacityComparisonService.js
 * Description: A service to handle API calls for surgical capacity data.
 */

// Define the base URL for your FastAPI backend
const API_URL = 'http://localhost:8000/api/hospitals/surgical-capacity';

/**
 * Fetches surgical capacity data from the backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of hospital data.
 */
export const fetchSurgicalCapacityData = async () => {
  try {
    const response = await fetch(API_URL);

    // If the response is not OK (e.g., a 404 or 500 status), throw an error
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`API call failed with status ${response.status}: ${errorDetails}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching surgical capacity data:", error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
};
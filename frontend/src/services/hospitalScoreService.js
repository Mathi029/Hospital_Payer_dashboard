/**
 * @file hospitalScoreService.js
 * @description Frontend service to fetch hospital quality scores from the backend API.
 */

// Define the base URL for the backend API.
// Note: In a real application, this should be an environment variable.
const API_BASE_URL = 'http://localhost:8000'; // Adjust the port if your backend runs on a different one

/**
 * Fetches the ranked list of hospitals and their quality scores from the backend.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of hospital score objects.
 * @throws {Error} If the network request fails or the server returns an error.
 */
export async function getHospitalQualityScores() {
  try {
    const response = await fetch(`${API_BASE_URL}/hospitals/quality-scores`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Could not fetch hospital quality scores:", error);
    // Propagate the error to the calling component for display
    throw error;
  }
}
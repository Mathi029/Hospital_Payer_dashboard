// src/services/hospitalService.js

/**
 * Fetches the list of hospitals with their quality scores from the backend API.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of hospital objects with quality scores.
 */
export const getHospitalQualityScores = async () => {
  try {
    const response = await fetch('http://localhost:8000/hospitals/quality-scores');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched quality scores data:", data);
    return data;
  } catch (error) {
    console.error("Could not fetch hospital quality scores:", error);
    return []; // Return an empty array on error
  }
};
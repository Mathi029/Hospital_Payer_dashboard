// src/services/HospitalFinancialsService.js

/**
 * Fetches the wards and rooms data from the backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of ward/room data.
 */
export const fetchHospitalFinancialsData = async () => {
  try {
    const response = await fetch("http://localhost:8000/api/wards-rooms");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched financial data:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch hospital financial data:", error);
    throw error;
  }
};
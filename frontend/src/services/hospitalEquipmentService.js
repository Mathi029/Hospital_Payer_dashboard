// src/services/hospitalEquipmentService.js

// The base URL for your FastAPI backend.
// Note: FastAPI typically runs on port 8000 by default.
// Change this if your backend is running on a different port or domain.
const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Fetches the equipment availability matrix from the backend API.
 * This function now handles data fetching and basic error handling.
 * @returns {Promise<Object>} A promise that resolves to an object containing data and equipment types.
 */
export const getEquipmentAvailabilityMatrix = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipment-data`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching data from backend:", error);
    // You can return a default or empty structure on failure
    return { data: [], equipmentTypes: [] };
  }
};

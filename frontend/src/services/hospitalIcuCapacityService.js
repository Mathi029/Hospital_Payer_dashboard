// src/services/hospitalIcuCapacityService.js

const API_BASE_URL = 'http://localhost:8000'; // Replace with your backend URL if different

/**
 * Fetches the network-wide summary of ICU capacity and utilization.
 * @returns {Promise<Object>} A promise that resolves to the summary data.
 */
export const getIcuCapacitySummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/icu-capacity/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ICU capacity summary:", error);
    throw error;
  }
};

/**
 * Fetches a detailed list of all hospitals with their individual ICU metrics.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of hospital data.
 */
export const getDetailedIcuCapacity = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/icu-capacity/hospitals`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch detailed ICU capacity data:", error);
    throw error;
  }
};
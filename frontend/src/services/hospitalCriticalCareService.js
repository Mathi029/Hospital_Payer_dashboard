/**
 * @file hospitalCriticalCareService.js
 * @description Service file for fetching critical care equipment data from the backend.
 * This file contains a function to interact with the FastAPI API related to hospital equipment.
 */

// Define the base URL for the backend API.
// In a production environment, this should be an environment variable.
const API_BASE_URL = "http://localhost:8000";

/**
 * Fetches the critical care equipment data for all hospitals.
 * This function calls the /equipment/critical-care endpoint.
 *
 * @returns {Promise<{data: Array, equipmentTypes: Array}>} A promise that resolves to an object
 * containing the equipment data and a list of unique equipment types.
 * @throws {Error} If the network request fails or the response is not ok.
 */
export const fetchCriticalCareEquipment = async () => {
    try {
        // Construct the full URL for the API endpoint.
        const url = `${API_BASE_URL}/equipment/critical-care`;

        // Make the GET request to the backend.
        const response = await fetch(url);

        // Check if the response was successful.
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON data from the response.
        const result = await response.json();

        return result;
    } catch (error) {
        // Log the error and re-throw it so the calling component can handle it.
        console.error("Failed to fetch critical care equipment data:", error);
        throw error;
    }
};
import axios from 'axios';

// Update the base URL to match the new root path of the FastAPI backend
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fetches all hospitals' data from the /hospitals endpoint.
 * @returns {Promise<Array>} A promise that resolves to an array of hospital objects.
 */
export const fetchAllHospitals = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals`);
        return response.data;
    } catch (error) {
        console.error("Error fetching hospitals:", error);
        throw new Error("Failed to fetch hospital data.");
    }
};

/**
 * Fetches equipment maintenance schedule with calculated next due dates and
 * enriched with hospital location data.
 * @returns {Promise<Array>} A promise that resolves to an array of enriched equipment maintenance items.
 */
export const fetchEquipmentMaintenanceSchedule = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/equipment/maintenance-schedule`);
        return response.data;
    } catch (error) {
        console.error("Error fetching equipment maintenance schedule:", error);
        throw new Error("Failed to fetch equipment maintenance data.");
    }
};
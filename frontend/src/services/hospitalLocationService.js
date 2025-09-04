import axios from 'axios';

// The base URL for your FastAPI backend
const API_BASE_URL = 'http://localhost:8000'; // Change this if your server is on a different address or port

/**
 * Fetches the location and address details for all hospitals.
 * @returns {Promise<Array>} A promise that resolves to an array of hospital location objects.
 */
export const fetchHospitalLocations = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/locations`);
        return response.data;
    } catch (error) {
        console.error("Error fetching hospital locations:", error);
        return [];
    }
};

/**
 * Fetches the full profile for a specific hospital by ID.
 * This is useful for displaying detailed information in a pop-up or sidebar.
 * @param {number} hospitalId The ID of the hospital.
 * @returns {Promise<Object|null>} A promise that resolves to the hospital profile object or null if not found.
 */
export const fetchHospitalProfile = async (hospitalId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospital/profile/${hospitalId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching profile for hospital ID ${hospitalId}:`, error);
        return null;
    }
};

/**
 * You can add more functions here to fetch data from other endpoints,
 * such as the list of all hospitals or equipment data.
 */
export const fetchAllHospitals = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all hospitals:", error);
        return [];
    }
};

// New function to fetch combined hospital name and address for the dashboard
export const fetchHospitalsForDashboard = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/dashboard`);
        return response.data;
    } catch (error) {
        console.error("Error fetching hospital data for dashboard:", error);
        return [];
    }
};
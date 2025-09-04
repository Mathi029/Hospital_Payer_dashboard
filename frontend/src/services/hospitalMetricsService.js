// A service file to handle API calls related to hospital metrics.
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Fetches the merged doctor-to-bed ratio data from the backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of hospital metrics objects.
 */
export const getMergedDoctorToBedRatio = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/metrics/doctor-to-bed-ratio`);
        // The API returns an object with a 'data' key, we need to return the value of that key.
        return response.data.data;
    } catch (error) {
        console.error("Failed to fetch merged doctor-to-bed ratio data:", error);
        throw error;
    }
};
// frontend/src/services/hospitalSizeService.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Ensure this matches your FastAPI backend URL

/**
 * Fetches the distribution of hospitals by size classification.
 * This data is used for the pie chart.
 *
 * @returns {Promise<Object>} A promise that resolves to an object with size distribution data.
 */
export const getHospitalSizeDistribution = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/size-distribution`);
        return response.data;
    } catch (error) {
        console.error('Error fetching hospital size distribution:', error);
        throw error;
    }
};

/**
 * Fetches a basic list of all hospitals with key details needed for the table/cards.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of hospital objects.
 */
export const getHospitalsBasic = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/basic`);
        return response.data;
    } catch (error) {
        console.error("Error fetching basic hospital data:", error);
        throw error;
    }
};
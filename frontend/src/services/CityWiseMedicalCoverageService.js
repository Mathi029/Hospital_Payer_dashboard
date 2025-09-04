import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Assuming your FastAPI server runs on this address

export const fetchCityWiseMedicalCoverageData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/city-wise-medical-coverage`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch city-wise medical coverage data:", error);
        return [];
    }
};

export const fetchHospitalsByCityData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/by-city`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch hospitals by city data:", error);
        return {};
    }
};
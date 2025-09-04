import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; 

export const fetchHospitalGeographicData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/geographic-coverage`);
        return response.data;
    } catch (error) {
        console.error("Error fetching hospital geographic data:", error);
        throw error;
    }
};
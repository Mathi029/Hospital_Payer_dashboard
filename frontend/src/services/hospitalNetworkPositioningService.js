import axios from 'axios';
import certificationsData from '../../../backend/data/hospital_certifications.json'; // The corrected import path

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchAllHospitalPositioning = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospitals/positioning/all`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all hospital positioning data:", error);
        throw error;
    }
};

export const fetchHospitalProfile = async (hospitalId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hospital/profile/${hospitalId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching hospital profile:", error);
        throw error;
    }
};

export const fetchAllHospitalProfiles = async () => {
    try {
        const [profilesResponse, positioningResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/hospitals/full-profile`),
            axios.get(`${API_BASE_URL}/hospitals/positioning/all`),
        ]);

        const profiles = profilesResponse.data;
        const positioningMetrics = positioningResponse.data;
        
        const metricsMap = new Map(positioningMetrics.map(item => [item.hospital_id, item.metrics]));
        const certificationsMap = new Map();
        certificationsData.forEach(cert => {
            if (!certificationsMap.has(cert.hospital_id)) {
                certificationsMap.set(cert.hospital_id, []);
            }
            certificationsMap.get(cert.hospital_id).push(cert);
        });

        const mergedData = profiles.map(profile => {
            const metrics = metricsMap.get(profile.id);
            const certifications = certificationsMap.get(profile.id) || [];
            return {
                ...profile,
                metrics: metrics || null,
                certifications: certifications,
            };
        });

        return mergedData;
    } catch (error) {
        console.error("Error fetching and merging hospital data:", error);
        throw error;
    }
};
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Replace with your actual backend URL

export const SpecialtyCoverageMatrixService = {
  async getSpecialtyCoverageMatrix() {
    try {
      const response = await axios.get(`${API_URL}/specialty_coverage_matrix`);
      return response.data;
    } catch (error) {
      console.error('Error fetching specialty coverage matrix:', error);
      throw error;
    }
  },
};
const API_URL = 'http://127.0.0.1:8000/api'; // Assuming your FastAPI runs on port 8000

export const HospitalDoctorsDirectoryService = {
  getHospitalsSummary: async () => {
    try {
      const response = await fetch(`${API_URL}/hospital-doctors-summary`);
      if (!response.ok) {
        throw new Error('Failed to fetch hospital summary');
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching hospital summary:", error);
      return [];
    }
  },

  getDoctorsByHospital: async (hospitalId) => {
    try {
      const response = await fetch(`${API_URL}/doctors/${hospitalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching doctors for hospital ${hospitalId}:`, error);
      return [];
    }
  },
};
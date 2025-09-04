import api from './api'; // ✅ lowercase

export const getAnalyticsSummary = () =>
  api.get('/analytics/summary');

export const getHospitalsByState = () =>
  api.get('/analytics/hospitals-by-state');

export const getHospitalRankings = (metric = 'doctor_bed_ratio', limit = 20) =>
  api.get('/analytics/hospital-rankings', {
    params: { metric, limit }
  });

export const getNetworkBenchmarks = () =>
  api.get('/analytics/benchmarks');

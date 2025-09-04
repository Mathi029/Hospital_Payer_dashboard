// ==============================================
// HEALTHCARE INDUSTRY CONSTANTS & CALCULATIONS
// ==============================================
// Use these constants and functions in your React dashboard components

// ==============================================
// 1. BENCHMARK CONSTANTS (Industry Standards)
// ==============================================

export const INDUSTRY_BENCHMARKS = {
  // Staffing Ratios (per bed)
  DOCTOR_TO_BED_RATIO: {
    EXCELLENT: 0.25,    // Above 0.25 is excellent
    GOOD: 0.20,         // 0.20-0.25 is good  
    AVERAGE: 0.15,      // 0.15-0.20 is average
    POOR: 0.10          // Below 0.15 is poor
  },
  
  NURSE_TO_BED_RATIO: {
    EXCELLENT: 1.5,     // Above 1.5 is excellent
    GOOD: 1.2,          // 1.2-1.5 is good
    AVERAGE: 1.0,       // 1.0-1.2 is average  
    POOR: 0.8           // Below 1.0 is poor
  },
  
  ICU_DOCTOR_TO_BED_RATIO: {
    EXCELLENT: 0.5,     // Above 0.5 is excellent
    GOOD: 0.4,          // 0.4-0.5 is good
    AVERAGE: 0.3,       // 0.3-0.4 is average
    POOR: 0.2           // Below 0.3 is poor
  },
  
  ICU_NURSE_TO_BED_RATIO: {
    EXCELLENT: 2.0,     // Above 2.0 is excellent
    GOOD: 1.5,          // 1.5-2.0 is good
    AVERAGE: 1.2,       // 1.2-1.5 is average
    POOR: 1.0           // Below 1.2 is poor
  },
  
  // Bed Utilization
  BED_OCCUPANCY: {
    OPTIMAL_MIN: 80,    // 80-90% is optimal
    OPTIMAL_MAX: 90,
    OVERUTILIZED: 95,   // Above 95% is overutilized
    UNDERUTILIZED: 70   // Below 70% is underutilized
  },
  
  // Quality Indicators
  CERTIFICATION_COVERAGE: {
    EXCELLENT: 80,      // 80%+ hospitals certified
    GOOD: 60,           // 60-80% hospitals certified
    AVERAGE: 40,        // 40-60% hospitals certified
    POOR: 20            // Below 40% hospitals certified
  }
};

// ==============================================
// 2. RISK SCORING FORMULA
// ==============================================

export const RISK_WEIGHTS = {
  EXPIRED_CERTIFICATIONS: 30,     // 30% weight
  LOW_DOCTOR_RATIO: 25,           // 25% weight  
  LOW_NURSE_RATIO: 25,            // 25% weight
  MISSING_DOCUMENTS: 20           // 20% weight
};

/**
 * Calculate comprehensive risk score for a hospital
 * @param {Object} hospital - Hospital data
 * @param {Array} certifications - Hospital certifications
 * @param {Object} metrics - Hospital metrics
 * @param {Array} documents - Hospital documents
 * @returns {Object} Risk assessment with score and breakdown
 */
export function calculateRiskScore(hospital, certifications, metrics, documents) {
  const riskFactors = {
    expiredCertifications: 0,
    lowDoctorRatio: 0,
    lowNurseRatio: 0,
    missingDocuments: 0
  };
  
  // 1. Check expired certifications
  const today = new Date();
  const expiredCerts = certifications.filter(cert => 
    new Date(cert.expiry_date) < today
  );
  riskFactors.expiredCertifications = Math.min((expiredCerts.length / certifications.length) * 100, 100);
  
  // 2. Check doctor ratio
  const doctorRatio = metrics.doctor_bed_ratio || 0;
  if (doctorRatio < INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO.POOR) {
    riskFactors.lowDoctorRatio = 100;
  } else if (doctorRatio < INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO.AVERAGE) {
    riskFactors.lowDoctorRatio = 60;
  } else if (doctorRatio < INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO.GOOD) {
    riskFactors.lowDoctorRatio = 30;
  }
  
  // 3. Check nurse ratio  
  const nurseRatio = metrics.nurse_bed_ratio || 0;
  if (nurseRatio < INDUSTRY_BENCHMARKS.NURSE_TO_BED_RATIO.POOR) {
    riskFactors.lowNurseRatio = 100;
  } else if (nurseRatio < INDUSTRY_BENCHMARKS.NURSE_TO_BED_RATIO.AVERAGE) {
    riskFactors.lowNurseRatio = 60;
  } else if (nurseRatio < INDUSTRY_BENCHMARKS.NURSE_TO_BED_RATIO.GOOD) {
    riskFactors.lowNurseRatio = 30;
  }
  
  // 4. Check document completeness
  const requiredDocTypes = ['Medical License', 'Fire NOC', 'NABH Certificate', 'ISO Certificate'];
  const verifiedDocs = documents.filter(doc => doc.is_verified).length;
  const completeness = (verifiedDocs / requiredDocTypes.length) * 100;
  riskFactors.missingDocuments = Math.max(100 - completeness, 0);
  
  // Calculate weighted risk score
  const totalRiskScore = (
    (riskFactors.expiredCertifications * RISK_WEIGHTS.EXPIRED_CERTIFICATIONS) +
    (riskFactors.lowDoctorRatio * RISK_WEIGHTS.LOW_DOCTOR_RATIO) +
    (riskFactors.lowNurseRatio * RISK_WEIGHTS.LOW_NURSE_RATIO) +
    (riskFactors.missingDocuments * RISK_WEIGHTS.MISSING_DOCUMENTS)
  ) / 100;
  
  // Determine risk level
  let riskLevel = 'LOW';
  let riskColor = '#22c55e'; // Green
  
  if (totalRiskScore > 70) {
    riskLevel = 'CRITICAL';
    riskColor = '#ef4444'; // Red
  } else if (totalRiskScore > 50) {
    riskLevel = 'HIGH';
    riskColor = '#f97316'; // Orange
  } else if (totalRiskScore > 30) {
    riskLevel = 'MEDIUM';
    riskColor = '#eab308'; // Yellow
  }
  
  return {
    totalScore: Math.round(totalRiskScore),
    riskLevel,
    riskColor,
    breakdown: riskFactors,
    recommendations: generateRiskRecommendations(riskFactors)
  };
}

function generateRiskRecommendations(riskFactors) {
  const recommendations = [];
  
  if (riskFactors.expiredCertifications > 50) {
    recommendations.push("Urgent: Renew expired certifications");
  }
  if (riskFactors.lowDoctorRatio > 60) {
    recommendations.push("Critical: Increase doctor staffing");
  }
  if (riskFactors.lowNurseRatio > 60) {
    recommendations.push("Critical: Increase nursing staff");
  }
  if (riskFactors.missingDocuments > 40) {
    recommendations.push("Action needed: Complete document verification");
  }
  
  return recommendations;
}

// ==============================================
// 3. MAINTENANCE DATE CALCULATIONS
// ==============================================

/**
 * Calculate next maintenance date based on equipment installation and schedule
 * @param {string} installationYear - Year equipment was installed
 * @param {string} maintenanceSchedule - Schedule: "Monthly", "Quarterly", "Bi-annual", "Annual"
 * @returns {Object} Maintenance information
 */
export function calculateMaintenanceDates(installationYear, maintenanceSchedule) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Calculate maintenance frequency in months
  const scheduleMonths = {
    'Monthly': 1,
    'Quarterly': 3,
    'Bi-annual': 6,
    'Annual': 12
  };
  
  const frequencyMonths = scheduleMonths[maintenanceSchedule] || 12;
  
  // Calculate last maintenance date (approximate)
  const monthsSinceInstallation = (currentYear - installationYear) * 12 + currentMonth;
  const maintenanceCycles = Math.floor(monthsSinceInstallation / frequencyMonths);
  
  const lastMaintenanceDate = new Date();
  lastMaintenanceDate.setMonth(currentMonth - (monthsSinceInstallation % frequencyMonths));
  
  // Calculate next maintenance date
  const nextMaintenanceDate = new Date(lastMaintenanceDate);
  nextMaintenanceDate.setMonth(lastMaintenanceDate.getMonth() + frequencyMonths);
  
  // Calculate days until next maintenance
  const daysUntilMaintenance = Math.ceil((nextMaintenanceDate - today) / (1000 * 60 * 60 * 24));
  
  // Determine maintenance status
  let status = 'upcoming';
  let statusColor = '#22c55e'; // Green
  
  if (daysUntilMaintenance < 0) {
    status = 'overdue';
    statusColor = '#ef4444'; // Red
  } else if (daysUntilMaintenance <= 30) {
    status = 'due_soon';
    statusColor = '#f97316'; // Orange
  } else if (daysUntilMaintenance <= 60) {
    status = 'upcoming';
    statusColor = '#eab308'; // Yellow
  }
  
  return {
    lastMaintenance: lastMaintenanceDate.toISOString().split('T')[0],
    nextMaintenance: nextMaintenanceDate.toISOString().split('T')[0],
    daysUntilMaintenance,
    status,
    statusColor,
    frequencyMonths,
    schedule: maintenanceSchedule
  };
}

// ==============================================
// 4. QUALITY SCORING ALGORITHM
// ==============================================

export const QUALITY_WEIGHTS = {
  CERTIFICATIONS: 40,      // 40% weight
  DOCTOR_RATIO: 30,        // 30% weight
  NURSE_RATIO: 30          // 30% weight
};

/**
 * Calculate hospital quality score
 * @param {Array} certifications - Hospital certifications
 * @param {Object} metrics - Hospital metrics
 * @returns {Object} Quality score and grade
 */
export function calculateQualityScore(certifications, metrics) {
  // 1. Certification Score (40%)
  const activeCerts = certifications.filter(cert => 
    cert.status === 'Active' && new Date(cert.expiry_date) > new Date()
  );
  
  let certificationScore = 0;
  activeCerts.forEach(cert => {
    if (cert.certification_type === 'NABH') certificationScore += 40;
    if (cert.certification_type === 'JCI') certificationScore += 35;
    if (cert.certification_type === 'ISO 9001') certificationScore += 25;
  });
  certificationScore = Math.min(certificationScore, 100);
  
  // 2. Doctor Ratio Score (30%)
  const doctorRatio = metrics.doctor_bed_ratio || 0;
  let doctorScore = 0;
  if (doctorRatio >= INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO.EXCELLENT) {
    doctorScore = 100;
  } else if (doctorRatio >= INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO.GOOD) {
    doctorScore = 80;
  } else if (doctorRatio >= INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO.AVERAGE) {
    doctorScore = 60;
  } else {
    doctorScore = 30;
  }
  
  // 3. Nurse Ratio Score (30%)
  const nurseRatio = metrics.nurse_bed_ratio || 0;
  let nurseScore = 0;
  if (nurseRatio >= INDUSTRY_BENCHMARKS.NURSE_TO_BED_RATIO.EXCELLENT) {
    nurseScore = 100;
  } else if (nurseRatio >= INDUSTRY_BENCHMARKS.NURSE_TO_BED_RATIO.GOOD) {
    nurseScore = 80;
  } else if (nurseRatio >= INDUSTRY_BENCHMARKS.NURSE_TO_BED_RATIO.AVERAGE) {
    nurseScore = 60;
  } else {
    nurseScore = 30;
  }
  
  // Calculate weighted quality score
  const totalQualityScore = (
    (certificationScore * QUALITY_WEIGHTS.CERTIFICATIONS) +
    (doctorScore * QUALITY_WEIGHTS.DOCTOR_RATIO) +
    (nurseScore * QUALITY_WEIGHTS.NURSE_RATIO)
  ) / 100;
  
  // Determine quality grade
  let grade = 'D';
  let gradeColor = '#ef4444'; // Red
  
  if (totalQualityScore >= 90) {
    grade = 'A+';
    gradeColor = '#22c55e'; // Green
  } else if (totalQualityScore >= 80) {
    grade = 'A';
    gradeColor = '#22c55e'; // Green
  } else if (totalQualityScore >= 70) {
    grade = 'B+';
    gradeColor = '#eab308'; // Yellow
  } else if (totalQualityScore >= 60) {
    grade = 'B';
    gradeColor = '#eab308'; // Yellow
  } else if (totalQualityScore >= 50) {
    grade = 'C';
    gradeColor = '#f97316'; // Orange
  }
  
  return {
    totalScore: Math.round(totalQualityScore),
    grade,
    gradeColor,
    breakdown: {
      certificationScore: Math.round(certificationScore),
      doctorScore: Math.round(doctorScore),
      nurseScore: Math.round(nurseScore)
    }
  };
}

// ==============================================
// 5. UTILITY FUNCTIONS FOR BENCHMARKING
// ==============================================

/**
 * Compare hospital metric against industry benchmark
 * @param {number} value - Hospital metric value
 * @param {Object} benchmark - Benchmark thresholds
 * @returns {Object} Comparison result
 */
export function compareToBenchmark(value, benchmark) {
  let performance = 'poor';
  let color = '#ef4444'; // Red
  let message = 'Below industry standards';
  
  if (value >= benchmark.EXCELLENT) {
    performance = 'excellent';
    color = '#22c55e'; // Green
    message = 'Exceeds industry standards';
  } else if (value >= benchmark.GOOD) {
    performance = 'good';
    color = '#22c55e'; // Green
    message = 'Meets industry standards';
  } else if (value >= benchmark.AVERAGE) {
    performance = 'average';
    color = '#eab308'; // Yellow
    message = 'Average performance';
  }
  
  return {
    performance,
    color,
    message,
    percentile: calculatePercentile(value, benchmark)
  };
}

function calculatePercentile(value, benchmark) {
  if (value >= benchmark.EXCELLENT) return 95;
  if (value >= benchmark.GOOD) return 75;
  if (value >= benchmark.AVERAGE) return 50;
  return 25;
}

// ==============================================
// 6. EXAMPLE USAGE IN REACT COMPONENTS
// ==============================================

/*
// Example 1: Risk Assessment Component
const hospitalRisk = calculateRiskScore(
  hospital, 
  certifications, 
  metrics, 
  documents
);

<div style={{backgroundColor: hospitalRisk.riskColor}}>
  Risk Level: {hospitalRisk.riskLevel} ({hospitalRisk.totalScore}%)
</div>

// Example 2: Equipment Maintenance Alert
const maintenanceInfo = calculateMaintenanceDates(
  equipment.installation_year,
  equipment.maintenance_schedule
);

{maintenanceInfo.status === 'overdue' && (
  <Alert severity="error">
    Maintenance overdue by {Math.abs(maintenanceInfo.daysUntilMaintenance)} days
  </Alert>
)}

// Example 3: Quality Score Display
const qualityScore = calculateQualityScore(certifications, metrics);

<div>
  <h3>Quality Grade: {qualityScore.grade}</h3>
  <div>Overall Score: {qualityScore.totalScore}/100</div>
</div>

// Example 4: Benchmark Comparison
const doctorComparison = compareToBenchmark(
  metrics.doctor_bed_ratio,
  INDUSTRY_BENCHMARKS.DOCTOR_TO_BED_RATIO
);

<div style={{color: doctorComparison.color}}>
  {doctorComparison.message} ({doctorComparison.percentile}th percentile)
</div>
*/
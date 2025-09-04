import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { BankOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';
// import './App.css';

import LandingPage from './pages/LandingPage';
import Q01_HospitalList from './pages/Mathi_1/file1/Q1_HospitalList';
import Q3_HospitalContacts from './pages/Mathi_1/file1/Q3_HospitalContacts';
import Q5_HospitalBedCapacity from './pages/Mathi_1/file1/Q5_HospitalBedCapacity';
import Q7_MedicalSpecialties from './pages/Mathi_1/file1/Q7_MedicalSpecialties';
import Q9_HospitalProfileDash from './pages/Mathi_1/file1/Q9_HospitalProfileDash';
import Q15_HospitalLocation from './pages/Mathi_1/file1/Q15_HospitalLocation';
import Q17_DoctorToBedRatio from './pages/Mathi_1/file1/Q17_DoctorToBedRatio';
import Q19_EquipmentAnalysis from './pages/Mathi_1/file1/Q19_EquipmentAnalysis';
import Q23_HospitalSize from './pages/Mathi_1/file1/Q23_HospitalSize';
import Q25_HospitalQualityScore from './pages/Mathi_1/file1/Q25_HospitalQualityScore';
import Q2_HospitalISOCertification from './pages/Mathi_1/file1/Q2_HospitalISOCertification';
import Q4_HospitalCriticalcare from './pages/Mathi_1/file1/Q4_HospitalCriticalcare';
import Q12_EquipmentMaintenanceCalendar from './pages/Mathi_1/file1/Q12_HospitalEquipmentMaintenance.jsx'; // New import
import Q14_HospitalNetworkPositioning from './pages/Mathi_1/file1/Q14_HospitalNetworkPositioning.jsx';
import Q16_HospitalRiskScoreProfile from './pages/Mathi_1/file1/Q16_HospitalRiskScoreProfile.jsx';
import Q18_SurgicalCapacityComparison from './pages/Mathi_1/file1/Q18_SurgicalCapacityComparison.jsx';
import CityWiseMedicalCoverage from './pages/Mathi_1/file1/Q6_CitywiseMedicalCoverage.jsx';
import Q10_HospitalFinancialProfile from './pages/Mathi_1/file1/Q10_HospitalFinancialProfile.jsx';
import Q20_GeographicalNetworkCoverage from './pages/Mathi_1/file1/Q20_GeographicalNetworkCoverage';
import Q22_HospitalIcuCapacity from './pages/Mathi_1/file1/Q22_HospitalIcuCapacity.jsx';
import Q11_HospitalDoctorsDirectory from './pages/Mathi_1/file1/Q11_HospitalDoctorsDirectory.jsx';
import Q21_SpecialtyCoverage from './pages/Mathi_1/file1/Q21_SpecialtyCoverageMatrix.jsx';

const { Header, Sider, Content } = Layout;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '48px', textAlign: 'center', color: 'red' }}>
                    <h2>Something went wrong.</h2>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleLogin = () => setIsAuthenticated(true);
    const handleLogout = () => setIsAuthenticated(false);

    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '24px', color: '#1890ff' }}>
                        <BankOutlined style={{ marginRight: '8px' }} />
                        Payer Dashboard Login
                    </h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin();
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                style={{ width: '100%', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                style={{ width: '100%', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{ width: '100%', padding: '12px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Router>
                <Layout style={{ minHeight: '100vh' }}>
                    <Header style={{ background: 'white', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: '#1890ff' }}>
                            <BankOutlined style={{ marginRight: '8px' }} />
                            Payer Dashboard
                        </h2>
                        <Button onClick={handleLogout} icon={<LogoutOutlined />} type="default">
                            Logout
                        </Button>
                    </Header>

                    <Layout>
                        <Sider width={280} style={{ background: 'white' }} collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                            <Menu mode="inline" style={{ height: '100%', border: 'none' }}>
                                <Menu.Item key="home" icon={<HomeOutlined />}>
                                    <Link to="/">Dashboard Home</Link>
                                </Menu.Item>
                                <Menu.SubMenu key="questions" title="Question Pages" icon={<BankOutlined />}>
                                    <Menu.Item key="q1">
                                        <Link to="/q1">Q1: Hospital List</Link>
                                    </Menu.Item>
                                    <Menu.Item key="hospital-iso-certification">
                                        <Link to="/hospital-iso-certification">Q2: Hospital ISO Certification</Link>
                                    </Menu.Item>
                                    <Menu.Item key="q3">
                                        <Link to="/q3">Q3: Hospital Contacts</Link>
                                    </Menu.Item>
                                     <Menu.Item key="hospital-criticalcare">
                                        <Link to="/hospital-criticalcare">Q4: Hospital Critical Care</Link>
                                    </Menu.Item>
                                    <Menu.Item key="q5">
                                        <Link to="/bed-capacity">Q5: Bed Capacity</Link>
                                    </Menu.Item>
                                    <Menu.Item key="city-wise-medical-coverage">
                                        <Link to="/city-wise-medical-coverage">Q6: City-wise Medical Coverage</Link>
                                    </Menu.Item>
                                    <Menu.Item key="q7">
                                        <Link to="/q7">Q7: Medical Specialties</Link>
                                    </Menu.Item>
                                    <Menu.Item key="q9">
                                        <Link to="/q9">Q9: Hospital Profile</Link>
                                    </Menu.Item>
                                    <Menu.Item key="hospital-financial-profile">
                                        <Link to="/hospital-financial-profile">Q10: Hospital Financial Profile</Link>
                                    </Menu.Item>
                                     <Menu.Item key="hospital-doctors-directory">
                                        <Link to="/hospital-doctors-directory">Q11: Hospital Doctors Directory</Link>
                                    </Menu.Item>
                                    <Menu.Item key="equipment-maintenance">
                                        <Link to="/equipment-maintenance">Q12: Equipment Maintenance</Link>     
                                    </Menu.Item> 
                                    <Menu.Item key="hospital-network-positioning">
                                        <Link to="/hospital-network-positioning">Q14: Hospital Network Positioning</Link>
                                    </Menu.Item>
                                    <Menu.Item key="hospital-locations">
                                        <Link to="/hospital-locations">Q15: Hospital Locations</Link>
                                    </Menu.Item>
                                    <Menu.Item key="risk-score-profile">
                                        <Link to="/risk-score-profile">Q16: Hospital Risk Score Profile</Link>
                                    </Menu.Item>
                                    <Menu.Item key="doctor-to-bed-ratio">
                                        <Link to="/doctor-to-bed-ratio">Q17: Doctor-Bed Ratio</Link>
                                    </Menu.Item>
                                    <Menu.Item key="surgical-capacity-comparison">
                                        <Link to="/surgical-capacity-comparison">Q18 Surgical Capacity Comparison</Link>
                                    </Menu.Item>
                                    <Menu.Item key="equipment-analysis">
                                        <Link to="/equipment-analysis">Q19: Equipment Analysis</Link>
                                    </Menu.Item>
                                    <Menu.Item key="geographical-network-coverage">
                                        <Link to="/geographical-network-coverage">Q20: Geographical Network Coverage</Link>
                                    </Menu.Item>
                                    <Menu.Item key="icu-capacity">
                                        <Link to="/icu-capacity">Q22: ICU Capacity</Link>
                                    </Menu.Item>
                                    <Menu.Item key="specialty-coverage">
                                        <Link to="/specialty-coverage">Q21: Specialty Coverage</Link>
                                    </Menu.Item>
                                    <Menu.Item key="hospital-size">
                                        <Link to="/hospital-size">Q23: Hospital Size</Link>
                                    </Menu.Item>
                                    <Menu.Item key="hospital-quality-score">
                                        <Link to="/hospital-quality-score">Q25: Hospital Quality Score</Link>
                                    </Menu.Item>    
                                </Menu.SubMenu>
                            </Menu>
                        </Sider>

                        <Content style={{ margin: 0, backgroundColor: '#f0f2f5', padding: 20 }}>
                            <Routes>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/q1" element={<Q01_HospitalList />} />
                                <Route path="/q3" element={<Q3_HospitalContacts />} />
                                <Route path="/bed-capacity" element={<Q5_HospitalBedCapacity />} />
                                <Route path="/q7" element={<Q7_MedicalSpecialties />} />
                                <Route path="/q9" element={<Q9_HospitalProfileDash />} />
                                <Route path="/hospital-locations" element={<Q15_HospitalLocation />} />
                                <Route path="/doctor-to-bed-ratio" element={<Q17_DoctorToBedRatio />} />
                                <Route path="/equipment-analysis" element={<Q19_EquipmentAnalysis />} />
                                <Route path="/hospital-size" element={<Q23_HospitalSize />} />
                                <Route path="/hospital-quality-score" element={<Q25_HospitalQualityScore />} />
                                <Route path="/hospital-iso-certification" element={<Q2_HospitalISOCertification />} />
                                <Route path="/hospital-criticalcare" element={<Q4_HospitalCriticalcare />} />
                                <Route path="/city-wise-medical-coverage" element={<CityWiseMedicalCoverage />} />
                                <Route path="/hospital-financial-profile" element={<Q10_HospitalFinancialProfile />} />
                                <Route path="/equipment-maintenance" element={<Q12_EquipmentMaintenanceCalendar />} />
                                <Route path="/hospital-network-positioning" element={<Q14_HospitalNetworkPositioning />} />
                                <Route path="/risk-score-profile" element={<Q16_HospitalRiskScoreProfile />} />
                                <Route path="/surgical-capacity-comparison" element={<Q18_SurgicalCapacityComparison />} />
                                <Route path="/geographical-network-coverage" element={<Q20_GeographicalNetworkCoverage />} />
                                <Route path="/icu-capacity" element={<Q22_HospitalIcuCapacity />} />
                                <Route path="/hospital-doctors-directory" element={<Q11_HospitalDoctorsDirectory />} />
                                <Route path="/specialty-coverage" element={<Q21_SpecialtyCoverage />} />
                            </Routes>
                        </Content>
                    </Layout>
                </Layout>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
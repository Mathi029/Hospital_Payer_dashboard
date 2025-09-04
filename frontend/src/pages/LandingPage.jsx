import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Statistic, Badge } from 'antd';
import { 
  BankOutlined, 
  BarChartOutlined, 
  SafetyOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  MedicineBoxOutlined 
} from '@ant-design/icons';
import { getAnalyticsSummary } from '../services/analyticsService';

const LandingPage = ({ onLogout }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await getAnalyticsSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const questionCategories = [
    {
      title: 'Hospital Network',
      icon: <BankOutlined />,
      description: 'Hospital listings, profiles, and basic information',
      questions: 'Questions 1-8',
      color: '#1890ff',
      path: '/network'
    },
    {
      title: 'Quality & Compliance', 
      icon: <SafetyOutlined />,
      description: 'Certifications, risk assessment, and compliance tracking',
      questions: 'Questions 9-16',
      color: '#52c41a',
      path: '/quality'
    },
    {
      title: 'Analytics & Insights',
      icon: <BarChartOutlined />,
      description: 'Performance metrics, comparisons, and rankings',
      questions: 'Questions 17-24',
      color: '#faad14',
      path: '/analytics'
    },
    {
      title: 'Geographic Coverage',
      icon: <EnvironmentOutlined />,
      description: 'Location analysis and coverage mapping',
      questions: 'Questions 25-26',
      color: '#722ed1',
      path: '/geographic'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '16px 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>
            <BankOutlined style={{ marginRight: '8px' }} />
            Payer Dashboard
          </h2>
          <Button onClick={onLogout} type="default">Logout</Button>
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* KPI Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Hospitals"
                value={summary?.total_hospitals || 0}
                prefix={<BankOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Doctors"
                value={summary?.total_doctors || 0}
                prefix={<TeamOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Medical Equipment"
                value={summary?.total_equipment || 0}
                prefix={<MedicineBoxOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Certified Hospitals"
                value={summary?.certified_hospitals || 0}
                prefix={<SafetyOutlined />}
                suffix={<Badge count={`${Math.round((summary?.certified_hospitals || 0) / (summary?.total_hospitals || 1) * 100)}%`} color="green" />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Navigation Cards */}
        <Row gutter={[24, 24]}>
          {questionCategories.map((category, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                style={{ 
                  height: '200px',
                  borderLeft: `4px solid ${category.color}`,
                  cursor: 'pointer'
                }}
                onClick={() => alert(`Navigate to ${category.title} section`)}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    color: category.color,
                    marginBottom: '16px'
                  }}>
                    {category.icon}
                  </div>
                  <h4 style={{ color: '#262626', marginBottom: '8px' }}>
                    {category.title}
                  </h4>
                  <p style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '12px' }}>
                    {category.description}
                  </p>
                  <Badge color={category.color} text={category.questions} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default LandingPage;
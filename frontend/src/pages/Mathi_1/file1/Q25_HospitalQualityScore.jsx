import React, { useState, useEffect, useMemo } from 'react';
import { getHospitalQualityScores } from '../../../services/hospitalQualityScoreService'; // Adjust the path as needed
import { Card, Table, Spin, Alert, Row, Col, Statistic, Empty, Modal, Button, Space, Input, Select, Tag, Tooltip } from 'antd';
import { BarChartOutlined, PieChartOutlined, TrophyOutlined, AimOutlined, DownloadOutlined, FilterOutlined, SearchOutlined, LineChartOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Search } = Input;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF0000'];

const HospitalRankingPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  useEffect(() => {
    const fetchQualityScores = async () => {
      try {
        setLoading(true);
        const data = await getHospitalQualityScores();
        const sortedData = data.sort((a, b) => b.qualityScore - a.qualityScore);
        setHospitals(sortedData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityScores();
  }, []);

  const uniqueCities = useMemo(() => {
    const cities = new Set(hospitals.map(item => item.city).filter(Boolean));
    return ["All", ...cities].sort();
  }, [hospitals]);

  const filteredData = useMemo(() => {
    let results = hospitals;
    if (selectedCity !== "All") {
      results = results.filter(item => item.city === selectedCity);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item => 
        item.name?.toLowerCase().includes(term) ||
        item.city?.toLowerCase().includes(term)
      );
    }
    return results;
  }, [hospitals, searchTerm, selectedCity]);

  const totalHospitals = filteredData.length;
  const averageScore = useMemo(() => {
    if (totalHospitals === 0) return 0;
    const total = filteredData.reduce((sum, h) => sum + h.qualityScore, 0);
    return (total / totalHospitals).toFixed(2);
  }, [filteredData, totalHospitals]);

  const topHospitalsForChart = useMemo(() => {
    return filteredData.slice(0, 5);
  }, [filteredData]);

  const scoreDistribution = useMemo(() => {
    const distribution = {
      'Excellent (90-100)': 0,
      'Very Good (80-89)': 0,
      'Good (70-79)': 0,
      'Fair (60-69)': 0,
      'Below 60': 0,
    };
    filteredData.forEach(h => {
      if (h.qualityScore >= 90) distribution['Excellent (90-100)']++;
      else if (h.qualityScore >= 80) distribution['Very Good (80-89)']++;
      else if (h.qualityScore >= 70) distribution['Good (70-79)']++;
      else if (h.qualityScore >= 60) distribution['Fair (60-69)']++;
      else distribution['Below 60']++;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      Alert.error({ message: "No data to export." });
      return;
    }
    const dataToExport = filteredData.map(h => ({
      'Hospital Name': h.name,
      'City': h.city,
      'Quality Score': h.qualityScore,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hospital Rankings");
    XLSX.writeFile(wb, "hospital_quality_rankings.xlsx");
  };

  const tableColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      sorter: (a, b) => a.city.localeCompare(b.city),
      render: (city) => <Tag color="geekblue">{city}</Tag>,
    },
    {
      title: 'Quality Score',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      sorter: (a, b) => a.qualityScore - b.qualityScore,
      render: (score) => {
        const getTagColor = (s) => {
          if (s >= 90) return 'green';
          if (s >= 80) return 'blue';
          if (s >= 70) return 'gold';
          return 'volcano';
        };
        return (
          <Tag color={getTagColor(score)} style={{ fontSize: '14px', padding: '4px 8px' }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            <span style={{ fontWeight: 'bold' }}>{score}</span>
          </Tag>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Loading hospital rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert message="Error" description={`Error: ${error}`} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: 20 }}>
        <LineChartOutlined style={{ marginRight: 8 }} />
        Hospital Quality Rankings
      </h2>
      <p>Analyze and compare the quality scores of various hospitals.</p>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={8}>
          <Card bordered={false}>
            <Statistic title="Total Hospitals" value={totalHospitals} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card bordered={false}>
            <Statistic title="Average Quality Score" value={averageScore} prefix={<AimOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card bordered={false}>
            <Space>
              <Button type="primary" icon={<BarChartOutlined />} onClick={() => setIsChartModalVisible(true)}>
                View Charts
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadExcel}>
                Export to Excel
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: 20, alignItems: 'center' }}>
          <Search
            placeholder="Search hospital or city..."
            allowClear
            enterButton={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <Space>
            <Tooltip title="Filter by City">
              <Select
                value={selectedCity}
                onChange={setSelectedCity}
                style={{ width: 150 }}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {uniqueCities.map(city => (
                  <Option key={city} value={city}>
                    {city}
                  </Option>
                ))}
              </Select>
            </Tooltip>
          </Space>
        </div>
        
        {filteredData.length > 0 ? (
          <Table
            rowKey="hospital_id"
            dataSource={filteredData.map((item, index) => ({...item, key: item.hospital_id || index }))}
            columns={tableColumns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty description="No hospital quality data available with the current filters." />
        )}
      </Card>

      {/* Charts Modal */}
      <Modal
        title="Quality Score Analytics"
        visible={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        footer={null}
        width={800}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <h4>Score Distribution by Category</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Col>
          <Col span={12}>
            <h4>Top 5 Hospitals by Quality Score</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topHospitalsForChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="qualityScore" fill="#8884d8" name="Quality Score" />
              </BarChart>
            </ResponsiveContainer>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default HospitalRankingPage;
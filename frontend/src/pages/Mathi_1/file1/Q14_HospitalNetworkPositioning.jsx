import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Spin,
  Empty,
  Typography,
  Row,
  Col,
  Space,
  Statistic,
  message,
  Input,
  Select,
  Button,
  Badge,
  Tooltip,
  Modal,
  Tag,
  Flex,
  Dropdown,
} from 'antd';
import {
  HomeOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { motion } from 'framer-motion';
import { CSVLink } from 'react-csv';
import { fetchAllHospitalProfiles } from '../../../services/hospitalNetworkPositioningService';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Custom tooltip for Recharts to show detailed information on hover
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>Metric: {data.name}</p>
        <p style={{ margin: 0 }}>
          Relative Value: <strong>{data.value.toFixed(2)}%</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '0.9em', color: '#666', margin: 0 }}>
          This hospital's {data.name} is {data.value.toFixed(2)}% of the network average.
        </p>
      </Card>
    );
  }
  return null;
};

const AllHospitalsPage = () => {
  const [hospitalsData, setHospitalsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [viewMode, setViewMode] = useState('card');
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const uniqueStates = useMemo(() => {
    const states = new Set(hospitalsData.map((item) => item.address?.state).filter(Boolean));
    return ['All', ...states].sort();
  }, [hospitalsData]);

  const uniqueCities = useMemo(() => {
    const cities = new Set(hospitalsData.map((item) => item.address?.city_town).filter(Boolean));
    return ['All', ...cities].sort();
  }, [hospitalsData]);

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        // Changed service function to fetch all profiles with address data
        const data = await fetchAllHospitalProfiles();
        setHospitalsData(data);
        message.success('Hospital data loaded successfully!');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        message.error('Failed to load hospital data.');
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

  // Memoize filtered data and fix the toLowerCase() error
  const filteredData = useMemo(() => {
    let results = hospitalsData;

    if (stateFilter !== 'All') {
      results = results.filter((item) => item.address?.state === stateFilter);
    }
    if (cityFilter !== 'All') {
      results = results.filter((item) => item.address?.city_town === cityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.address?.city_town?.toLowerCase().includes(term) ||
          item.address?.state?.toLowerCase().includes(term) ||
          // FIXED: Convert hospital_id to string to prevent TypeError
          String(item.id).toLowerCase().includes(term)
      );
    }

    return results;
  }, [hospitalsData, searchTerm, stateFilter, cityFilter]);

  // Data for Excel export
  const csvData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }

    const headers = [
      { label: 'Hospital Name', key: 'name' },
      { label: 'Hospital ID', key: 'id' },
      { label: 'Street', key: 'address.street' },
      { label: 'City', key: 'address.city_town' },
      { label: 'State', key: 'address.state' },
      { label: 'Pincode', key: 'address.pin_code' },
      { label: 'Operational Beds', key: 'beds_operational' },
    ];

    const data = filteredData.map(item => ({
      name: item.name,
      id: item.id,
      'address.street': item.address?.street,
      'address.city_town': item.address?.city_town,
      'address.state': item.address?.state,
      'address.pin_code': item.address?.pin_code,
      'beds_operational': item.beds_operational,
    }));

    return { headers, data };
  }, [filteredData]);

  // Memoize top hospitals for the chart
  const topHospitalsForChart = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.metrics?.selected_hospital_values?.total_doctors - a.metrics?.selected_hospital_values?.total_doctors)
      .slice(0, 5)
      .map((hospital, index) => ({
        ...hospital,
        rank: index + 1,
      }));
  }, [filteredData]);

  const handleCardClick = (hospital) => {
    setSelectedHospital(hospital);
    setIsDetailModalVisible(true);
  };

  const activeFiltersCount = (stateFilter !== 'All' ? 1 : 0) + (cityFilter !== 'All' ? 1 : 0);

  const filtersMenu = (
    <div
      style={{
        maxHeight: 250,
        overflowY: 'auto',
        padding: 12,
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 4,
        boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <label style={{ fontWeight: 'bold' }}>Filter by State</label>
        <Select
          value={stateFilter}
          onChange={(value) => {
            setStateFilter(value);
            setCityFilter('All');
          }}
          style={{ width: '100%' }}
          options={uniqueStates.map((s) => ({ label: s, value: s }))}
        />
        <label style={{ fontWeight: 'bold' }}>Filter by City</label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: '100%' }}
          disabled={stateFilter === 'All'}
          options={
            (stateFilter !== 'All'
              ? uniqueCities.filter((city) =>
                  hospitalsData.some((item) => item.address?.city_town === city && item.address?.state === stateFilter)
                )
              : uniqueCities
            ).map((c) => ({ label: c, value: c }))
          }
        />
      </Space>
    </div>
  );

  const columns = [
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <b>{text}</b>,
    },
    {
      title: 'Hospital ID',
      dataIndex: 'id',
      key: 'id',
      responsive: ['md'],
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (address ? `${address.street}, ${address.city_town}, ${address.state} - ${address.pin_code}` : 'N/A'),
    },
    {
      title: 'Total Doctors',
      dataIndex: 'metrics',
      key: 'total_doctors',
      render: (metrics) => metrics?.selected_hospital_values?.total_doctors,
      sorter: (a, b) => (a.metrics?.selected_hospital_values?.total_doctors || 0) - (b.metrics?.selected_hospital_values?.total_doctors || 0),
    },
    {
      title: 'Operational Beds',
      dataIndex: 'beds_operational',
      key: 'beds_operational',
      sorter: (a, b) => (a.beds_operational || 0) - (b.beds_operational || 0),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>Loading all hospital data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Empty description={`Error: ${error}`} />
      </div>
    );
  }

  if (!hospitalsData || hospitalsData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Empty description="No data available." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 20 }}
    >
      <Title level={2} style={{ marginBottom: 20 }}>
        <HomeOutlined style={{ marginRight: 8 }} />
        Hospital Network Positioning Report
      </Title>
      <p style={{ color: '#666', marginBottom: 40, textAlign: 'center' }}>
        This report provides a detailed view of each hospital's key metrics relative to the entire network's average.
      </p>

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Flex
          justify="space-between"
          align="center"
          wrap
          style={{ marginBottom: 20, gap: 12 }}
        >
          <Search
            placeholder="Search hospitals, city, state, or ID"
            allowClear
            enterButton={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 350, flexGrow: 1 }}
          />
          <Space wrap>
            <Button.Group>
              <Tooltip title="Card View">
                <Button
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('card')}
                  type={viewMode === 'card' ? 'primary' : 'default'}
                />
              </Tooltip>
              <Tooltip title="List View">
                <Button
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                  type={viewMode === 'list' ? 'primary' : 'default'}
                />
              </Tooltip>
            </Button.Group>
            <Dropdown
              overlay={filtersMenu}
              trigger={['click']}
              placement="bottomRight"
            >
              <Badge count={activeFiltersCount} offset={[10, 0]}>
                <Button icon={<FilterOutlined />} type="default">
                  Filters
                </Button>
              </Badge>
            </Dropdown>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setIsChartModalVisible(true)}
              type="default"
            >
              View Top Hospitals
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              type="primary"
              disabled={filteredData.length === 0}
            >
              <CSVLink
                data={csvData.data}
                headers={csvData.headers}
                filename={'hospitals-data.csv'}
                style={{ color: 'white' }}
              >
                Download as Excel
              </CSVLink>
            </Button>
          </Space>
        </Flex>

        {filteredData.length === 0 ? (
          <Empty description="No hospitals found with the selected filters." />
        ) : viewMode === 'list' ? (
          <Table
            rowKey="id"
            dataSource={filteredData}
            columns={columns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredData.map((hospital, index) => {
              const chartData = hospital.metrics?.relative_positioning_percent
                ? Object.keys(hospital.metrics.relative_positioning_percent).map((key) => ({
                    name: key.replace(/_/g, ' '),
                    value: hospital.metrics.relative_positioning_percent[key] || 0,
                  }))
                : [];
              return (
                <Col xs={24} lg={12} key={hospital.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      bordered={false}
                      hoverable
                      onClick={() => handleCardClick(hospital)}
                      style={{
                        borderRadius: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '2px solid #e0e0e0',
                          paddingBottom: 15,
                          marginBottom: 20,
                        }}
                      >
                        <Title level={3} style={{ margin: 0, color: '#1a73e8' }}>
                          {hospital.name}
                        </Title>
                        <span
                          style={{
                            backgroundColor: '#e8f0fe',
                            color: '#1a73e8',
                            padding: '5px 10px',
                            borderRadius: 8,
                            fontWeight: 'bold',
                          }}
                        >
                          ID: {hospital.id}
                        </span>
                      </div>
                      <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }}>
                        <p style={{ margin: 0, fontSize: '1rem', color: '#555' }}>
                          <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                          {hospital.address ?
                            `${hospital.address.street}, ${hospital.address.city_town}, ${hospital.address.state} - ${hospital.address.pin_code}`
                            : 'Address not available'
                          }
                        </p>
                      </Space>
                      <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                          <Title level={4} style={{ marginTop: 0 }}>
                            Key Metrics
                          </Title>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Statistic
                              title="Total Doctors"
                              value={hospital.metrics?.selected_hospital_values?.total_doctors}
                              prefix={<TeamOutlined />}
                              suffix={<span style={{ fontSize: '0.8em', color: '#999' }}>(Network Avg: {hospital.metrics?.network_averages?.total_doctors})</span>}
                            />
                            <Statistic
                              title="Operational Beds"
                              value={hospital.metrics?.selected_hospital_values?.beds_operational}
                              prefix={<MedicineBoxOutlined />}
                              suffix={<span style={{ fontSize: '0.8em', color: '#999' }}>(Network Avg: {hospital.metrics?.network_averages?.beds_operational})</span>}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Title level={4} style={{ marginTop: 0 }}>
                            Certifications
                          </Title>
                          <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {hospital.certifications?.length > 0 ? (
                              hospital.certifications.map((cert) => (
                                <li
                                  key={cert.id}
                                  style={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #eee',
                                    padding: '10px',
                                    borderRadius: 5,
                                    marginBottom: 8,
                                    fontSize: '0.95rem',
                                    color: '#444',
                                  }}
                                >
                                  <Space>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    <span>{cert.certification_type} - {cert.certification_level}</span>
                                  </Space>
                                </li>
                              ))
                            ) : (
                              <li>No certifications found.</li>
                            )}
                          </ul>
                        </Col>
                      </Row>
                    </Card>
                  </motion.div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Modal for Top Hospitals Chart */}
      <Modal
        title="Top 5 Hospitals by Total Doctors"
        visible={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginTop: 20, padding: 10 }}>
          {topHospitalsForChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topHospitalsForChart}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <ChartTooltip formatter={(value) => [`${value}`, 'Total Doctors']} />
                <Bar dataKey="metrics.selected_hospital_values.total_doctors" fill="#1890ff">
                  <LabelList
                    dataKey="metrics.selected_hospital_values.total_doctors"
                    position="top"
                    formatter={(value) => `${value}`}
                    style={{ fontSize: 12, fill: '#666' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No chart data available." />
          )}
        </div>
      </Modal>

      {/* Modal for Hospital Details */}
      <Modal
        title="Hospital Details"
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedHospital && (
          <Card bordered={false}>
            <Title level={4}>{selectedHospital.name}</Title>
            <p>
              <EnvironmentOutlined />
              {selectedHospital.address ?
                `${selectedHospital.address.street}, ${selectedHospital.address.city_town}, ${selectedHospital.address.state} - ${selectedHospital.address.pin_code}`
                : 'Address not available'
              }
            </p>
            <Flex gap="large" vertical style={{ marginTop: 20 }}>
              <Statistic
                title="Total Doctors"
                value={selectedHospital.metrics?.selected_hospital_values?.total_doctors}
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              />
              <Statistic
                title="Operational Beds"
                value={selectedHospital.beds_operational}
                prefix={<MedicineBoxOutlined style={{ color: '#52c41a' }} />}
              />
              <Statistic
                title="Relative Positioning"
                value="View Chart"
                prefix={<BarChartOutlined style={{ color: '#faad14' }} />}
              />
              <Statistic
                title="Certifications"
                value={selectedHospital.certifications?.length}
                prefix={<CheckCircleOutlined style={{ color: '#f5222d' }} />}
              />
            </Flex>
            <div style={{ marginTop: 20 }}>
                <Title level={5}>Relative Positioning to Network Average</Title>
                <ResponsiveContainer width="100%" height={200}>
                <BarChart
                    data={Object.keys(selectedHospital.metrics?.relative_positioning_percent || {}).map(key => ({
                    name: key.replace(/_/g, ' '),
                    value: selectedHospital.metrics?.relative_positioning_percent[key] || 0
                    }))}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8" name="Relative to Average (%)" />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </Card>
        )}
      </Modal>
    </motion.div>
  );
};

export default AllHospitalsPage;
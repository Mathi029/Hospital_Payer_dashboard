import React, { useEffect, useState, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Modal, 
  Button, 
  Spin, 
  Input, 
  Select, 
  Space, 
  Tooltip, 
  message, 
  Row, 
  Col,
  Statistic,
  Progress,
  Avatar,
  Divider,
  Badge,
  Empty,
  Dropdown,
} from 'antd';
import {
  EnvironmentOutlined,
  RadiusUprightOutlined,
  SearchOutlined,
  DownloadOutlined,
  GlobalOutlined,
  FilterOutlined,
  TeamOutlined,
  AimOutlined,
  LineChartOutlined,
  HeatMapOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { fetchHospitalGeographicData } from '../../../services/hospitalGeographicCoverageService';
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, LabelList } from 'recharts';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { Option } = Select;
const { Search } = Input;
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87d068'];

const Q20_GeographicalNetworkCoverage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All');

  const uniqueStates = useMemo(() => {
    const states = new Set(hospitals.map((item) => item.address?.state).filter(Boolean));
    return ["All", ...states].sort();
  }, [hospitals]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchHospitalGeographicData();
        setHospitals(data);
        message.success("Data loaded successfully!");
      } catch (error) {
        message.error('Failed to load geographic data. Please check the backend connection.');
        console.error('Error fetching geographic data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let results = hospitals;
    if (selectedState !== "All") {
      results = results.filter((item) => item.address?.state === selectedState);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.address?.city_town?.toLowerCase().includes(term) ||
          item.address?.state?.toLowerCase().includes(term) ||
          item.address?.street?.toLowerCase().includes(term)
      );
    }
    return results;
  }, [hospitals, searchTerm, selectedState]);

  const totalHospitals = filteredData.length;
  const averageRadius = filteredData.length > 0 
    ? Math.round(filteredData.reduce((sum, h) => sum + (h.service_radius_km || 0), 0) / filteredData.length)
    : 0;
  const maxRadius = Math.max(...filteredData.map(h => h.service_radius_km || 0), 0);

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) {
      message.info("No data to export.");
      return;
    }
    const headers = ['Hospital Name', 'City', 'State', 'Service Radius (km)', 'Latitude', 'Longitude'];
    const rows = filteredData.map(h => [
      h.name,
      h.address?.city_town || '',
      h.address?.state || '',
      h.service_radius_km,
      h.latitude,
      h.longitude
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'hospital_geographic_coverage.csv');
    message.success("Data exported to CSV successfully!");
  };

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      message.info("No data to export.");
      return;
    }
    const dataToExport = filteredData.map(h => ({
      'Hospital Name': h.name,
      'City': h.address?.city_town || '',
      'State': h.address?.state || '',
      'Service Radius (km)': h.service_radius_km,
      'Latitude': h.latitude,
      'Longitude': h.longitude
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Geographic Coverage");
    XLSX.writeFile(wb, "hospital_geographic_coverage.xlsx");
    message.success("Data exported to Excel successfully!");
  };

  const tableColumns = [
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<GlobalOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => {
              setSelectedHospital(record);
              setIsMapModalVisible(true);
            }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.address?.street}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'City',
      dataIndex: ['address', 'city_town'],
      key: 'city',
      sorter: (a, b) => (a.address?.city_town || '').localeCompare(b.address?.city_town || ''),
      render: (city) => (
        city ? <Tag color="cyan">{city}</Tag> : null
      ),
    },
    {
      title: 'State',
      dataIndex: ['address', 'state'],
      key: 'state',
      sorter: (a, b) => (a.address?.state || '').localeCompare(b.address?.state || ''),
      responsive: ['md'],
      render: (state) => (
        state ? <Tag color="geekblue">{state}</Tag> : null
      ),
    },
    {
      title: 'Service Radius',
      dataIndex: 'service_radius_km',
      key: 'service_radius_km',
      sorter: (a, b) => (a.service_radius_km || 0) - (b.service_radius_km || 0),
      render: (radius) => {
        if (radius === null || radius === undefined) return 'N/A';
        return (
          <Progress
            percent={Math.min((radius / 50) * 100, 100)}
            size="small"
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
            format={() => (
              <span style={{ whiteSpace: "nowrap" }}>
                {radius} km
              </span>
            )}
          />
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => {
            setSelectedHospital(record);
            setIsMapModalVisible(true);
          }}
          icon={<GlobalOutlined />}
        >
          View on Map
        </Button>
      ),
    },
  ];

  const stateDistribution = filteredData.reduce((acc, hospital) => {
    const state = hospital.address?.state;
    if (state) {
      acc[state] = (acc[state] || 0) + 1;
    }
    return acc;
  }, {});

  const pieChartData = Object.entries(stateDistribution).map(([state, count]) => ({
    name: state,
    value: count,
    percentage: ((count / totalHospitals) * 100).toFixed(1)
  }));
  
  const radiusRanges = {
    '0-10 km': filteredData.filter(h => (h.service_radius_km || 0) <= 10).length,
    '11-20 km': filteredData.filter(h => (h.service_radius_km || 0) > 10 && (h.service_radius_km || 0) <= 20).length,
    '21-30 km': filteredData.filter(h => (h.service_radius_km || 0) > 20 && (h.service_radius_km || 0) <= 30).length,
    '31-40 km': filteredData.filter(h => (h.service_radius_km || 0) > 30 && (h.service_radius_km || 0) <= 40).length,
    '40+ km': filteredData.filter(h => (h.service_radius_km || 0) > 40).length,
  };

  const barChartData = Object.entries(radiusRanges).map(([range, count]) => ({
    range,
    hospitals: count
  }));

  const topHospitalsForChart = useMemo(() => {
    return filteredData.slice(0, 5).sort((a, b) => (b.service_radius_km ?? 0) - (a.service_radius_km ?? 0));
  }, [filteredData]);

  const activeFiltersCount = (selectedState !== 'All' ? 1 : 0);

  const filtersMenu = (
    <div
      style={{
        maxHeight: 250,
        overflowY: "auto",
        padding: 12,
        width: 200,
        backgroundColor: "#fff",
        borderRadius: 4,
        boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <label style={{ fontWeight: "bold" }}>Filter by State</label>
        <Select
          value={selectedState}
          onChange={setSelectedState}
          style={{ width: "100%" }}
          options={uniqueStates.map((s) => ({ label: s, value: s }))}
        />
      </Space>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 20 }}
    >
      <h2 style={{ marginBottom: 20 }}>
        <LineChartOutlined style={{ marginRight: 8 }} />
        Hospital Geographic Network Coverage
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Total Hospitals"
              value={totalHospitals}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Average Coverage"
              value={averageRadius}
              suffix="km"
              prefix={<AimOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Max Coverage"
              value={maxRadius}
              suffix="km"
              prefix={<RadiusUprightOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Space>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => setIsChartModalVisible(true)}
                style={{ height: '40px' }}
              >
                View Charts
              </Button>
              <Button
                icon={<HeatMapOutlined />}
                onClick={() => {
                  setSelectedHospital(null);
                  setIsMapModalVisible(true);
                }}
                style={{ height: '40px' }}
              >
                View Map
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Search
            placeholder="Search hospitals, cities, states or addresses..."
            allowClear
            enterButton={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 300, flexGrow: 1 }}
          />
          <Space wrap>
            <Tooltip title="List View">
              <Button
                icon={<UnorderedListOutlined />}
                type="primary"
              />
            </Tooltip>
            <Dropdown
              overlay={filtersMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Badge count={activeFiltersCount} offset={[10, 0]}>
                <Button icon={<FilterOutlined />} type="default">
                  Filters
                </Button>
              </Badge>
            </Dropdown>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadCSV}
              type="default"
            >
              Export CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadExcel}
              type="primary"
            >
              Export Excel
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block" }}
            >
              <GlobalOutlined style={{ fontSize: "50px", color: "#1890ff" }} />
            </motion.div>
          </div>
        ) : filteredData.length === 0 ? (
          <Empty description="No hospitals found" />
        ) : (
          <Table
            rowKey="id"
            dataSource={filteredData}
            columns={tableColumns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>

      {/* Charts Modal */}
      <Modal
        title="Geographic Coverage Analytics"
        visible={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        footer={null}
        width={800}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <h4>State Distribution</h4>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No chart data available." />
            )}
          </Col>
          <Col span={12}>
            <h4>Service Radius Distribution</h4>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="hospitals" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No chart data available." />
            )}
          </Col>
        </Row>
        <Divider />
        <h4>Top 5 Hospitals by Service Coverage</h4>
        {topHospitalsForChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topHospitalsForChart}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <ChartTooltip formatter={(value) => [`${value} km`, 'Coverage']} />
              <Bar dataKey="service_radius_km" fill="#1890ff">
                <LabelList
                  dataKey="service_radius_km"
                  position="top"
                  formatter={(value) => `${value} km`}
                  style={{ fontSize: 12, fill: '#666' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No chart data available." />
        )}
      </Modal>

      {/* Map Modal */}
      <Modal
        title="Geographic Coverage Map"
        visible={isMapModalVisible}
        onCancel={() => setIsMapModalVisible(false)}
        footer={null}
        width={1000}
      >
        <div style={{ height: '600px', width: '100%' }}>
          {filteredData.length > 0 ? (
            <MapContainer
              key={isMapModalVisible}
              center={selectedHospital ? [selectedHospital.latitude, selectedHospital.longitude] : [filteredData[0].latitude, filteredData[0].longitude]}
              zoom={selectedHospital ? 12 : 4}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              {selectedHospital ? (
                <React.Fragment>
                  <Marker position={[selectedHospital.latitude, selectedHospital.longitude]}>
                    <Popup>{selectedHospital.name}</Popup>
                  </Marker>
                  <Circle
                    center={[selectedHospital.latitude, selectedHospital.longitude]}
                    pathOptions={{ color: '#1890ff', fillColor: '#1890ff', fillOpacity: 0.2 }}
                    radius={(selectedHospital.service_radius_km || 0) * 1000}
                  />
                </React.Fragment>
              ) : (
                filteredData.map((hospital) => (
                  <React.Fragment key={hospital.id}>
                    <Marker position={[hospital.latitude, hospital.longitude]}>
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <strong>{hospital.name}</strong><br />
                          <div style={{ margin: '4px 0' }}>
                            <EnvironmentOutlined /> {hospital.address?.city_town}, {hospital.address?.state}
                          </div>
                          <div style={{ margin: '4px 0' }}>
                            <RadiusUprightOutlined /> Service Radius: {hospital.service_radius_km} km
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[hospital.latitude, hospital.longitude]}
                      pathOptions={{
                        color: '#1890ff',
                        fillColor: '#1890ff',
                        fillOpacity: 0.2,
                      }}
                      radius={(hospital.service_radius_km || 0) * 1000}
                    />
                  </React.Fragment>
                ))
              )}
            </MapContainer>
          ) : (
            <Empty description="No map data available." />
          )}
        </div>
      </Modal>
    </motion.div>
  );
};

export default Q20_GeographicalNetworkCoverage;
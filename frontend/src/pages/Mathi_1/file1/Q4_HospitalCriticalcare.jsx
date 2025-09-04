// frontend/src/pages/HospitalCriticalCarePage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Badge,
  Tooltip,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Empty,
  Modal,
  Select,
  Spin,
  Input,
  Dropdown,
} from 'antd';
import {
  HeartOutlined,
  MonitorOutlined,
  DashboardOutlined,
  LineChartOutlined,
  BarChartOutlined,
  FilterOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  HomeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchCriticalCareEquipment } from '../../../services/hospitalCriticalCareService';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Search } = Input;

const HospitalCriticalCarePage = () => {
  const [data, setData] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('total');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'list'
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const { data: fetchedData, equipmentTypes: fetchedTypes } = await fetchCriticalCareEquipment();
        const dataWithTotal = fetchedData.map(hospital => {
          const total = fetchedTypes.reduce((sum, type) => sum + (hospital[type] || 0), 0);
          return { ...hospital, total };
        });
        setData(dataWithTotal);
        setEquipmentTypes(fetchedTypes);
        message.success("Critical care data loaded successfully!");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load critical care equipment data. Please check the API endpoint.");
        message.error("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const uniqueCities = useMemo(() => {
    const cities = new Set(data.map((item) => item.city).filter(Boolean));
    return ["All", ...cities].sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let results = data;

    // Filter by city
    if (cityFilter !== "All") {
      results = results.filter((item) => item.city === cityFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term) ||
          item.state?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    const sorted = [...results].sort((a, b) => b[sortKey] - a[sortKey]);
    return sorted;
  }, [data, searchTerm, cityFilter, sortKey]);

  const totalHospitals = filteredAndSortedData.length;
  const totalEquipment = useMemo(() => {
    return filteredAndSortedData.reduce((total, hospital) => total + (hospital.total || 0), 0);
  }, [filteredAndSortedData]);

  const averageEquipment = Math.round(totalEquipment / totalHospitals) || 0;

  const handleDownload = () => {
    if (filteredAndSortedData.length === 0) {
      message.info("No data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      filteredAndSortedData.map((item) => {
        const row = { 'Hospital Name': item.name };
        equipmentTypes.forEach(type => {
          row[type] = item[type] || 0;
        });
        row['Total Equipment'] = item.total;
        return row;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Critical Care Equipment");
    XLSX.writeFile(wb, "critical_care_equipment.xlsx");
    message.success("Data exported to Excel successfully!");
  };

  const showChartModal = (hospital) => {
    setSelectedHospital(hospital);
    setIsChartModalVisible(true);
  };

  const pieData = useMemo(() => {
    if (!selectedHospital) return [];
    return equipmentTypes.map(type => ({
      name: type,
      value: selectedHospital[type] || 0,
    })).filter(item => item.value > 0);
  }, [selectedHospital, equipmentTypes]);

  const PieChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label">{`${data.name}: ${data.value}`}</p>
          <p>{`Percentage: ${(data.value / selectedHospital.total * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  const columns = [
    {
      title: 'Hospital',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <b>{text}</b>,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      sorter: (a, b) => (a.city || '').localeCompare(b.city || ''),
      render: (city) => (city ? <Tag color="cyan">{city}</Tag> : null),
      responsive: ['md'],
    },
    ...equipmentTypes.map(type => ({
      title: type,
      dataIndex: type,
      key: type,
      sorter: (a, b) => (a[type] || 0) - (b[type] || 0),
      align: 'center',
    })),
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total,
      align: 'center',
      render: (total) => <Tag color="blue">{total}</Tag>,
    },
    {
      title: 'Breakdown',
      key: 'action',
      render: (_, record) => (
        <Button onClick={() => showChartModal(record)} icon={<BarChartOutlined />} type="default" />
      ),
      align: 'center',
    }
  ];

  const activeFiltersCount = (cityFilter !== 'All' ? 1 : 0);

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
            <label style={{ fontWeight: "bold" }}>Filter by City</label>
            <Select
                value={cityFilter}
                onChange={setCityFilter}
                style={{ width: "100%" }}
                options={uniqueCities.map((c) => ({ label: c, value: c }))}
            />
        </Space>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin tip="Loading critical care data..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#fffbe6', borderRadius: '8px' }}>
        <MonitorOutlined style={{ fontSize: '50px', color: '#faad14' }} />
        <h3 style={{ color: '#d46b08', marginTop: '16px' }}>Data Loading Error</h3>
        <p style={{ color: '#d46b08' }}>{error}</p>
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
      <h2 style={{ marginBottom: 20 }}>
        <LineChartOutlined style={{ marginRight: 8 }} />
        Critical Care Equipment Dashboard
      </h2>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Total Hospitals Analyzed"
              value={data.length}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Total Equipment Units"
              value={data.reduce((sum, h) => sum + h.total, 0).toLocaleString()}
              prefix={<MonitorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Average Per Hospital"
              value={Math.round(data.reduce((sum, h) => sum + h.total, 0) / data.length) || 0}
              prefix={<HeartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Equipment Types"
              value={equipmentTypes.length}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, justifyContent: "space-between", alignItems: "center" }}>
          <Space wrap>
            <Search
              placeholder="Search hospitals..."
              allowClear
              enterButton={<SearchOutlined />}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: 300, flexGrow: 1 }}
            />
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
            <Tooltip title="Sort by equipment type">
              <Select
                value={sortKey}
                onChange={setSortKey}
                style={{ width: 200 }}
              >
                <Option value="total">Total Equipment</Option>
                {equipmentTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Tooltip>
            <Button.Group>
              <Tooltip title="Card View">
                <Button
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("dashboard")}
                  type={viewMode === "dashboard" ? "primary" : "default"}
                />
              </Tooltip>
              <Tooltip title="List View">
                <Button
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode("list")}
                  type={viewMode === "list" ? "primary" : "default"}
                />
              </Tooltip>
            </Button.Group>
          </Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            type="primary"
          >
            Export to Excel
          </Button>
        </div>
        
        {filteredAndSortedData.length === 0 ? (
          <Empty description="No hospitals found." />
        ) : (
          <>
            {viewMode === 'list' ? (
              <Table
                rowKey="name"
                dataSource={filteredAndSortedData}
                columns={columns}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredAndSortedData.map((hospital, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={hospital.name}>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                            <HomeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            <Tooltip title={hospital.name}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.name}</span>
                            </Tooltip>
                          </div>
                        }
                        bordered
                        hoverable
                        style={{ borderRadius: 10, height: '100%' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {equipmentTypes.map((type, i) => (
                            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>
                                <Badge color={colors[i % colors.length]} /> {type}
                              </span>
                              <b>{hospital[type] || 0}</b>
                            </div>
                          ))}
                        </Space>
                        <div style={{ textAlign: 'right', marginTop: 16 }}>
                          <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Total: {hospital.total}
                          </Tag>
                        </div>
                        <Button
                          onClick={() => showChartModal(hospital)}
                          icon={<BarChartOutlined />}
                          type="link"
                          style={{ marginTop: 10 }}
                        >
                          View Breakdown
                        </Button>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Card>

      <Modal
        title={selectedHospital ? `Equipment Breakdown for ${selectedHospital.name}` : 'Equipment Breakdown'}
        visible={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <Row gutter={16}>
          <Col span={12}>
            <h3>Distribution by Type</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<PieChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Col>
          <Col span={12}>
            <h3>Detailed Quantities</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={pieData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Count">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>
        </Row>
      </Modal>
    </motion.div>
  );
};

export default HospitalCriticalCarePage;
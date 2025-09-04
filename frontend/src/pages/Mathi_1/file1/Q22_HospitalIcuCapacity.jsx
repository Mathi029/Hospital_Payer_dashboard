// frontend/src/pages/IcuCapacityDashboard.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Progress,
  Input,
  Select,
  Button,
  Space,
  Badge,
  Dropdown,
  Tooltip,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Empty,
  Modal,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  LineChartOutlined,
  HomeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getIcuCapacitySummary, getDetailedIcuCapacity } from "../../../services/hospitalIcuCapacityService";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, LabelList } from 'recharts';

const { Search } = Input;
const { Option } = Select;

const IcuCapacityDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [detailedData, setDetailedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [viewMode, setViewMode] = useState("card");
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);

  // Memoize the list of unique cities
  const uniqueCities = useMemo(() => {
    const cities = new Set(detailedData.map((item) => item.city).filter(Boolean));
    return ["All", ...cities].sort();
  }, [detailedData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, detailedIcuData] = await Promise.all([
          getIcuCapacitySummary(),
          getDetailedIcuCapacity(),
        ]);
        setSummary(summaryData);
        setDetailedData(detailedIcuData);
        message.success("ICU data loaded successfully!");
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to fetch ICU data. Please check the network connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize filtered data to prevent re-computation
  const filteredData = useMemo(() => {
    let results = detailedData;
    if (cityFilter !== "All") {
      results = results.filter((item) => item.city === cityFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term)
      );
    }
    return results;
  }, [detailedData, searchTerm, cityFilter]);

  // Memoize top hospitals for the chart
  const topHospitalsForChart = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => (b.icu_utilization ?? 0) - (a.icu_utilization ?? 0))
      .slice(0, 5);
  }, [filteredData]);

  const handleDownload = () => {
    if (filteredData.length === 0) {
      message.info("No data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        "Hospital Name": item.name,
        "City": item.city,
        "Total ICU Beds": item.total_icu_beds,
        "Available ICU Beds": item.available_icu_beds,
        "Utilization Rate": item.icu_utilization ? `${(item.icu_utilization * 100).toFixed(2)}%` : 'N/A',
        "Total Ventilators": item.icu_facilities.reduce((sum, f) => sum + (f.ventilators ?? 0), 0),
        "Total Monitors": item.icu_facilities.reduce((sum, f) => sum + (f.monitors ?? 0), 0),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ICU Capacity");
    XLSX.writeFile(wb, "icu_capacity_network_analysis.xlsx");
    message.success("Data exported to Excel successfully!");
  };

  const columns = [
    {
      title: "Hospital Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (city) => (city ? <Tag color="cyan">{city}</Tag> : null),
    },
    {
      title: "Total ICU Beds",
      dataIndex: "total_icu_beds",
      key: "total_icu_beds",
      sorter: (a, b) => (a.total_icu_beds ?? 0) - (b.total_icu_beds ?? 0),
    },
    {
      title: "Available ICU Beds",
      dataIndex: "available_icu_beds",
      key: "available_icu_beds",
      sorter: (a, b) => (a.available_icu_beds ?? 0) - (b.available_icu_beds ?? 0),
    },
    {
      title: "Utilization Rate",
      dataIndex: "icu_utilization",
      key: "icu_utilization",
      sorter: (a, b) => (a.icu_utilization ?? 0) - (b.icu_utilization ?? 0),
      render: (rate) => (
        <Progress
          percent={rate !== null ? Math.min((rate ?? 0) * 100, 100) : 0}
          size="small"
          strokeColor={{
            "0%": "#52c41a",
            "50%": "#faad14",
            "100%": "#ff4d4f",
          }}
          format={(percent) => (
            <span style={{ whiteSpace: "nowrap" }}>
              {rate !== null ? `${(rate * 100).toFixed(2)}%` : 'N/A'}
            </span>
          )}
        />
      ),
    },
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
        >
          {uniqueCities.map((c) => (
            <Option key={c} value={c}>
              {c}
            </Option>
          ))}
        </Select>
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
        ICU Capacity Network Analysis
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Total ICU Beds"
              value={summary?.total_icu_beds ?? 0}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Available ICU Beds"
              value={summary?.total_available_icu_beds ?? 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={() => setIsChartModalVisible(true)}
              style={{ padding: '0 24px', height: '40px' }}
            >
              View Top ICU Utilization
            </Button>
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
            placeholder="Search hospitals by name or city"
            allowClear
            enterButton={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 300, flexGrow: 1 }}
          />
          <Space wrap>
            <Button.Group>
              <Tooltip title="Card View">
                <Button
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("card")}
                  type={viewMode === "card" ? "primary" : "default"}
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
              onClick={handleDownload}
              type="primary"
            >
              Export to Excel
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
              <LineChartOutlined style={{ fontSize: "50px", color: "#1890ff" }} />
            </motion.div>
          </div>
        ) : filteredData.length === 0 ? (
          <Empty description="No hospitals found" />
        ) : viewMode === "list" ? (
          <Table
            rowKey="hospital_id"
            dataSource={filteredData}
            columns={columns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredData.map((hospital, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={hospital.hospital_id}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <Tooltip title={`${hospital.name}${hospital.city ? `, ${hospital.city}` : ''}`}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.name}</span>
                        </Tooltip>
                      </div>
                    }
                    bordered
                    hoverable
                    style={{
                      borderRadius: 10,
                      height: 200,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: 0
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ margin: 0, color: '#888' }}>
                        {hospital.city && <Tag color="cyan">{hospital.city}</Tag>}
                      </p>
                      <Space direction="vertical" style={{ width: '100%', marginTop: '12px' }}>
                        <Progress
                          percent={Math.min((hospital.icu_utilization ?? 0) * 100, 100)}
                          size="small"
                          showInfo={false}
                          strokeColor="#ff4d4f"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                          <span>Total Beds: {hospital.total_icu_beds ?? 'N/A'}</span>
                          <span>Available: {hospital.available_icu_beds ?? 'N/A'}</span>
                        </div>
                      </Space>
                    </div>
                    <div style={{ textAlign: "right", marginTop: '8px' }}>
                      <Tag color="red" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        Utilization: {hospital.icu_utilization !== null ? `${(hospital.icu_utilization * 100).toFixed(2)}%` : 'N/A'}
                      </Tag>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="Top 5 Hospitals by ICU Utilization Rate"
        open={isChartModalVisible}
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
                <ChartTooltip formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Utilization']} />
                <Bar dataKey="icu_utilization" fill="#ff4d4f">
                  <LabelList
                    dataKey="icu_utilization"
                    position="top"
                    formatter={(value) => `${(value * 100).toFixed(2)}%`}
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
    </motion.div>
  );
};

export default IcuCapacityDashboard;
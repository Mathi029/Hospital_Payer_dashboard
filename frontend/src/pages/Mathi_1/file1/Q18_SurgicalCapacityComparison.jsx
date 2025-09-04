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
  Flex,
  Typography,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  ToolOutlined,
  TeamOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchSurgicalCapacityData } from "../../../services/SurgicalCapacityComparisonService.js";
import { motion } from "framer-motion";

const { Search } = Input;
const { Title } = Typography;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5733', '#33FFBD', '#FF33A8'];

const SurgicalCapacityDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [viewMode, setViewMode] = useState("card");
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Memoize the list of unique cities and states
  const uniqueCities = useMemo(() => {
    const cities = new Set(data.map((item) => item.city_town).filter(Boolean));
    return ["All", ...cities].sort();
  }, [data]);

  const uniqueStates = useMemo(() => {
    const states = new Set(data.map((item) => item.state).filter(Boolean));
    return ["All", ...states].sort();
  }, [data]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const metrics = await fetchSurgicalCapacityData();
        setData(metrics);
        message.success("Data loaded successfully!");
      } catch (err) {
        console.error("Error fetching data:", err);
        message.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Memoize filtered data to prevent re-computation on every render
  const filteredData = useMemo(() => {
    let results = data;

    if (cityFilter !== "All") {
      results = results.filter((item) => item.city_town === cityFilter);
    }
    if (stateFilter !== "All") {
      results = results.filter((item) => item.state === stateFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.hospital_name?.toLowerCase().includes(term) ||
          item.city_town?.toLowerCase().includes(term) ||
          item.state?.toLowerCase().includes(term)
      );
    }
    // Sort by surgical capacity score in descending order
    results.sort((a, b) => (b.surgical_capacity_score ?? 0) - (a.surgical_capacity_score ?? 0));

    // Add a rank based on the sorted order
    return results.map((item, index) => ({
        ...item,
        rank: index + 1
    }));
  }, [data, searchTerm, cityFilter, stateFilter]);

  // Memoize top hospitals for the chart
  const topHospitalsForChart = useMemo(() => {
    return filteredData.slice(0, 5).sort((a, b) => (b.surgical_capacity_score ?? 0) - (a.surgical_capacity_score ?? 0));
  }, [filteredData]);

  // Memoize summary statistics for the top cards
  const summaryStats = useMemo(() => {
    const totalScore = data.reduce((sum, item) => sum + (item.surgical_capacity_score ?? 0), 0);
    const averageScore = data.length > 0 ? (totalScore / data.length) : 0;
    
    const stateCounts = data.reduce((acc, item) => {
        const stateName = item.state || 'Unknown';
        acc[stateName] = (acc[stateName] || 0) + 1;
        return acc;
    }, {});
    
    const pieChartData = Object.keys(stateCounts).map(state => ({
        name: state,
        value: stateCounts[state]
    }));

    return {
        totalHospitals: data.length,
        averageScore: averageScore,
        pieChartData
    };
  }, [data]);

  const handleCardClick = (hospital) => {
    setSelectedHospital(hospital);
    setIsDetailModalVisible(true);
  };

  const columns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      sorter: (a, b) => a.rank - b.rank,
      width: 80,
    },
    {
      title: "Hospital Name",
      dataIndex: "hospital_name",
      key: "hospital_name",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "City",
      dataIndex: "city_town",
      key: "city_town",
      sorter: (a, b) => (a.city_town || "").localeCompare(b.city_town || ""),
      render: (city) => (city ? <Tag color="cyan">{city}</Tag> : null),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      sorter: (a, b) => (a.state || "").localeCompare(b.state || ""),
      responsive: ["md"],
      render: (state) => (state ? <Tag color="geekblue">{state}</Tag> : null),
    },
    {
      title: "Surgical Specialties",
      dataIndex: "surgical_specialties_count",
      key: "surgical_specialties_count",
      sorter: (a, b) => a.surgical_specialties_count - b.surgical_specialties_count,
    },
    {
      title: "Surgical Equipment",
      dataIndex: "surgical_equipment_count",
      key: "surgical_equipment_count",
      sorter: (a, b) => a.surgical_equipment_count - b.surgical_equipment_count,
    },
    {
      title: "Surgeons",
      dataIndex: "surgeon_count",
      key: "surgeon_count",
      sorter: (a, b) => a.surgeon_count - b.surgeon_count,
    },
    {
      title: "Surgical Capacity Score",
      dataIndex: "surgical_capacity_score",
      key: "surgical_capacity_score",
      sorter: (a, b) => a.surgical_capacity_score - b.surgical_capacity_score,
      render: (score) => (
        <Progress
          percent={Math.min(score, 100)} // Using the score directly for simplicity, assuming a reasonable max.
          size="small"
          strokeColor="#52c41a"
          format={() => (
            <span style={{ whiteSpace: "nowrap" }}>
              {score !== null ? score : 'N/A'}
            </span>
          )}
        />
      ),
    },
  ];

  const activeFiltersCount = (stateFilter !== 'All' ? 1 : 0) + (cityFilter !== 'All' ? 1 : 0);

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
          value={stateFilter}
          onChange={setStateFilter}
          style={{ width: "100%" }}
          options={uniqueStates.map((s) => ({ label: s, value: s }))}
        />
        <label style={{ fontWeight: "bold" }}>Filter by City</label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: "100%" }}
          disabled={stateFilter === "All"}
          options={
            (stateFilter !== "All"
              ? uniqueCities.filter((city) =>
                  data.some(
                    (item) => item.city_town === city && item.state === stateFilter
                  )
                )
              : uniqueCities
            ).map((c) => ({ label: c, value: c }))
          }
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
      <Title level={2} style={{ marginBottom: 20 }}>
        <BarChartOutlined style={{ marginRight: 8 }} />
        Hospital Surgical Capacity Dashboard
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Total Hospitals Analyzed"
              value={summaryStats.totalHospitals}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Average Surgical Capacity Score"
              value={summaryStats.averageScore.toFixed(2)}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8} lg={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Title level={5} style={{ textAlign: 'center', margin: '0 0 16px' }}>Hospitals by State</Title>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="99%" height={120}>
                    <PieChart>
                        <Pie
                            data={summaryStats.pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {summaryStats.pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} Hospitals`, name]} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Flex
            justify="space-between"
            align="center"
            wrap
            style={{ marginBottom: 20, gap: 12 }}
        >
            <Search
                placeholder="Search hospitals, city, or state"
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
                    icon={<BarChartOutlined />}
                    onClick={() => setIsChartModalVisible(true)}
                    type="default"
                >
                    View Top Hospitals
                </Button>
            </Space>
        </Flex>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block" }}
            >
              <TeamOutlined style={{ fontSize: "50px", color: "#1890ff" }} />
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
                        <Tooltip title={`${hospital.hospital_name}, ${hospital.city_town}, ${hospital.state}`}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.hospital_name}</span>
                        </Tooltip>
                      </div>
                    }
                    bordered
                    hoverable
                    onClick={() => handleCardClick(hospital)}
                    style={{
                      borderRadius: 10,
                      height: 250,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: 0
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ margin: 0, color: '#888' }}>
                        {hospital.city_town && <Tag color="cyan">{hospital.city_town}</Tag>}
                        {hospital.state && <Tag color="geekblue">{hospital.state}</Tag>}
                      </p>
                      <div style={{ marginTop: '12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Flex align="center">
                            <MedicineBoxOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                            <span>{hospital.surgical_specialties_count} Specialties</span>
                          </Flex>
                          <Flex align="center">
                            <ToolOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                            <span>{hospital.surgical_equipment_count} Equipment</span>
                          </Flex>
                          <Flex align="center">
                            <TeamOutlined style={{ marginRight: '8px', color: '#f5222d' }} />
                            <span>{hospital.surgeon_count} Surgeons</span>
                          </Flex>
                        </Space>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginTop: '8px' }}>
                      <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        Score: {hospital.surgical_capacity_score !== null ? hospital.surgical_capacity_score : 'N/A'}
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
        title="Top 5 Hospitals by Surgical Capacity Score"
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
                <XAxis dataKey="hospital_name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <ChartTooltip formatter={(value) => [`${value}`, 'Score']} />
                <Bar dataKey="surgical_capacity_score" fill="#1890ff">
                  <LabelList
                    dataKey="surgical_capacity_score"
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

      <Modal
        title="Hospital Details"
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedHospital && (
          <Card bordered={false}>
            <Title level={4}>{selectedHospital.hospital_name}</Title>
            <p>
              <EnvironmentOutlined /> {selectedHospital.city_town}, {selectedHospital.state}
            </p>
            <Flex gap="large" vertical style={{ marginTop: 20 }}>
              <Statistic
                title="Surgical Specialties"
                value={selectedHospital.surgical_specialties_count}
                prefix={<MedicineBoxOutlined style={{ color: '#52c41a' }} />}
              />
              <Statistic
                title="Surgical Equipment"
                value={selectedHospital.surgical_equipment_count}
                prefix={<ToolOutlined style={{ color: '#faad14' }} />}
              />
              <Statistic
                title="Surgeons"
                value={selectedHospital.surgeon_count}
                prefix={<TeamOutlined style={{ color: '#f5222d' }} />}
              />
              <Statistic
                title="Surgical Capacity Score"
                value={selectedHospital.surgical_capacity_score}
                prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
              />
            </Flex>
          </Card>
        )}
      </Modal>
    </motion.div>
  );
};

export default SurgicalCapacityDashboard;

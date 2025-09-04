// frontend/src/pages/HospitalSizePage.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    Table,
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
    Spin
} from "antd";
import {
    SearchOutlined,
    FilterOutlined,
    DownloadOutlined,
    PieChartOutlined,
    HomeOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    EnvironmentOutlined,
    MedicineBoxOutlined,
    ApartmentOutlined
} from "@ant-design/icons";
import { getHospitalSizeDistribution, getHospitalsBasic } from "../../../services/HospitalSizeService";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';

const { Search } = Input;

// Define a color palette for the pie chart
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const HospitalSizePage = () => {
    const [hospitalData, setHospitalData] = useState([]);
    const [sizeDistribution, setSizeDistribution] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sizeFilter, setSizeFilter] = useState("All");
    const [viewMode, setViewMode] = useState("card");
    const [isChartModalVisible, setIsChartModalVisible] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [distData, hospitals] = await Promise.all([
                    getHospitalSizeDistribution(),
                    getHospitalsBasic()
                ]);
                
                setSizeDistribution(distData.distribution);
                setHospitalData(hospitals);
                message.success("Hospital data loaded successfully! 🎉");
            } catch (error) {
                console.error("Error fetching hospital data:", error);
                message.error("Failed to fetch data. Please check the network connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const classifyHospital = (bedCount) => {
        if (bedCount < 100) return "Small (<100 beds)";
        if (bedCount >= 100 && bedCount <= 300) return "Medium (100-300 beds)";
        return "Large (>300 beds)";
    };

    const filteredData = useMemo(() => {
        let results = hospitalData;

        if (sizeFilter !== "All") {
            results = results.filter((item) => classifyHospital(item.beds) === sizeFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (item) =>
                    item.name?.toLowerCase().includes(term) ||
                    item.city?.toLowerCase().includes(term) ||
                    item.state?.toLowerCase().includes(term)
            );
        }
        return results;
    }, [hospitalData, searchTerm, sizeFilter]);

    const handleDownload = () => {
        if (filteredData.length === 0) {
            message.info("No data to export.");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(
            filteredData.map((item) => ({
                "Hospital Name": item.name,
                "City": item.city,
                "State": item.state,
                "Beds Operational": item.beds,
                "Beds Registered": item.beds_registered,
                "Hospital Size": classifyHospital(item.beds),
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hospital Size");
        XLSX.writeFile(wb, "hospital_size_data.xlsx");
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
            sorter: (a, b) => (a.city || '').localeCompare(b.city || ''),
            render: (city) => (city ? <Tag color="cyan">{city}</Tag> : null),
        },
        {
            title: "State",
            dataIndex: "state",
            key: "state",
            sorter: (a, b) => (a.state || '').localeCompare(b.state || ''),
            responsive: ['md'],
            render: (state) => (state ? <Tag color="geekblue">{state}</Tag> : null),
        },
        {
            title: "Beds Operational",
            dataIndex: "beds",
            key: "beds",
            sorter: (a, b) => (a.beds || 0) - (b.beds || 0),
            responsive: ["lg"],
        },
        {
            title: "Hospital Size",
            key: "size",
            render: (_, record) => {
                const size = classifyHospital(record.beds);
                let color = "blue";
                if (size.startsWith("Small")) color = "green";
                else if (size.startsWith("Medium")) color = "gold";
                return <Tag color={color}>{size}</Tag>;
            },
            filters: [
                { text: 'Small', value: 'Small (<100 beds)' },
                { text: 'Medium', value: 'Medium (100-300 beds)' },
                { text: 'Large', value: 'Large (>300 beds)' },
            ],
            onFilter: (value, record) => classifyHospital(record.beds) === value,
        },
    ];

    const activeFiltersCount = sizeFilter !== 'All' ? 1 : 0;

    const filtersMenu = (
        <div
            style={{
                padding: 12,
                width: 200,
                backgroundColor: "#fff",
                borderRadius: 4,
                boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <label style={{ fontWeight: "bold" }}>Filter by Size</label>
                <Select
                    value={sizeFilter}
                    onChange={setSizeFilter}
                    style={{ width: "100%" }}
                    options={[
                        { label: "All", value: "All" },
                        { label: "Small (<100 beds)", value: "Small (<100 beds)" },
                        { label: "Medium (100-300 beds)", value: "Medium (100-300 beds)" },
                        { label: "Large (>300 beds)", value: "Large (>300 beds)" },
                    ]}
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
                <ApartmentOutlined style={{ marginRight: 8 }} />
                Hospital Size Classification
            </h2>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={12} lg={8}>
                    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                        <Card
                            bordered={false}
                            className="statistic-card"
                        >
                            <Statistic
                                title="Total Hospitals Analyzed"
                                value={hospitalData.length}
                                prefix={<HomeOutlined />}
                            />
                        </Card>
                    </motion.div>
                </Col>
                <Col xs={24} md={12} lg={8}>
                    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                        <Card
                            bordered={false}
                            className="statistic-card"
                        >
                            <Statistic
                                title="Average Bed Count"
                                value={hospitalData.length > 0 ? (hospitalData.reduce((sum, item) => sum + (item.beds || 0), 0) / hospitalData.length).toFixed(0) : 0}
                                prefix={<MedicineBoxOutlined />}
                            />
                        </Card>
                    </motion.div>
                </Col>
                <Col xs={24} md={24} lg={8}>
                    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                        <Card
                            bordered={false}
                            className="statistic-card"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <Button
                                type="primary"
                                icon={<PieChartOutlined />}
                                onClick={() => setIsChartModalVisible(true)}
                                style={{ padding: '0 24px', height: '40px' }}
                            >
                                View Size Distribution Chart
                            </Button>
                        </Card>
                    </motion.div>
                </Col>
            </Row>

            <Card
                bordered={false}
                className="main-content-card"
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
                        placeholder="Search hospitals by name, city or state"
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
                        <Spin size="large" />
                    </div>
                ) : filteredData.length === 0 ? (
                    <Empty description="No hospitals found matching the criteria." />
                ) : viewMode === "list" ? (
                    <Table
                        rowKey="id"
                        dataSource={filteredData}
                        columns={columns}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: "max-content" }}
                    />
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredData.map((hospital, index) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={hospital.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                                                <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                <Tooltip title={`${hospital.name}, ${hospital.city}, ${hospital.state}`}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.name}</span>
                                                </Tooltip>
                                            </div>
                                        }
                                        bordered
                                        hoverable
                                        className="hospital-card"
                                        style={{
                                            height: 200,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                        }}
                                        bodyStyle={{ padding: '16px' }}
                                    >
                                        <div style={{ flexGrow: 1 }}>
                                            <p style={{ margin: 0, color: '#888' }}>
                                                {hospital.city && <Tag color="cyan">{hospital.city}</Tag>}
                                                {hospital.state && <Tag color="geekblue">{hospital.state}</Tag>}
                                            </p>
                                            <Space direction="vertical" style={{ width: '100%', marginTop: '12px' }}>
                                                <Statistic
                                                    title="Beds Operational"
                                                    value={hospital.beds}
                                                    valueStyle={{ fontSize: 24, fontWeight: 'bold' }}
                                                />
                                            </Space>
                                        </div>
                                        <div style={{ textAlign: "right", marginTop: '8px' }}>
                                            <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                                {classifyHospital(hospital.beds)}
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
                title="Hospital Size Distribution"
                visible={isChartModalVisible}
                onCancel={() => setIsChartModalVisible(false)}
                footer={null}
                width={700}
                style={{ borderRadius: 10 }}
            >
                <div style={{ marginTop: 20, padding: 10 }}>
                    {sizeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={sizeDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {sizeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Empty description="No chart data available." />
                    )}
                </div>
            </Modal>
        </motion.div>
    );
};

export default HospitalSizePage;
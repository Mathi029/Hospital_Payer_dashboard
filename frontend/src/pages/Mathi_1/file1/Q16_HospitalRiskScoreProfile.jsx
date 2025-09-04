import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Space,
    Tooltip,
    Tag,
    Spin,
    message,
    Input,
    Select,
    Badge,
    Dropdown,
    Statistic,
    Empty,
    Table,
    Drawer,
    Divider,
    Descriptions,
    Modal,
} from "antd";
import {
    WarningOutlined,
    HomeOutlined,
    SearchOutlined,
    FilterOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    DownloadOutlined,
    InfoCircleOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    CalculatorOutlined,
    PieChartOutlined,
    TableOutlined
} from "@ant-design/icons";
import { getAllHospitals, getHospitalRiskProfile } from '../../../services/hospitalRiskprofileService';
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const { Search } = Input;
const { Option } = Select;

const riskColors = {
    Low: "green",
    Medium: "orange",
    High: "red",
};
const CHART_COLORS = ['#f5222d', '#fa8c16', '#52c41a']; // High, Medium, Low

const HospitalRiskScoreProfile = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [searchTerm, setSearchTerm] = useState("");
    const [riskCategoryFilter, setRiskCategoryFilter] = useState("All");

    const [selectedHospital, setSelectedHospital] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [isScoreModalVisible, setIsScoreModalVisible] = useState(false);
    const [isChartModalVisible, setIsChartModalVisible] = useState(false);
    const [isCompareModalVisible, setIsCompareModalVisible] = useState(false);

    useEffect(() => {
        const fetchAllHospitals = async () => {
            try {
                setLoading(true);
                const hospitalList = await getAllHospitals();
                setHospitals(hospitalList);
                message.success("Hospital risk data loaded successfully!");
            } catch (error) {
                console.error("Failed to fetch all hospitals:", error);
                message.error("Failed to fetch hospital risk data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllHospitals();
    }, []);

    const filteredHospitals = useMemo(() => {
        let results = hospitals;

        if (riskCategoryFilter !== "All") {
            results = results.filter((item) => item.risk_category === riskCategoryFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (item) =>
                    item.name?.toLowerCase().includes(term) ||
                    item.address?.toLowerCase().includes(term)
            );
        }
        return results;
    }, [hospitals, searchTerm, riskCategoryFilter]);

    const activeFiltersCount = (riskCategoryFilter !== 'All' ? 1 : 0);

    const riskCategoryCounts = useMemo(() => {
        return hospitals.reduce((acc, hospital) => {
            acc[hospital.risk_category] = (acc[hospital.risk_category] || 0) + 1;
            return acc;
        }, { High: 0, Medium: 0, Low: 0 });
    }, [hospitals]);

    const pieChartData = useMemo(() => {
        const categories = ['High', 'Medium', 'Low'];
        return categories.map((category, index) => ({
            name: `${category} Risk`,
            value: riskCategoryCounts[category],
            color: CHART_COLORS[index]
        })).filter(data => data.value > 0);
    }, [riskCategoryCounts]);

    const exportToExcel = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Hospitals");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const handleGlobalDownload = () => {
        const exportData = filteredHospitals.map(({ id, name, total_risk_score, risk_category, address, metrics, certifications, unverified_documents }) => ({
            "Hospital ID": id,
            "Hospital Name": name,
            "Total Risk Score": total_risk_score,
            "Risk Category": risk_category,
            "Address": address,
            "Metrics Score": metrics?.metrics_risk_score,
            "Certifications Score": certifications?.certification_risk_score,
            "Documents Score": unverified_documents?.document_risk_score,
        }));
        exportToExcel(exportData, "All_Hospitals_Report");
    };

    const handleHospitalDownload = () => {
        if (!selectedHospital) return;

        const data = [
            { "Metric": "Total Risk Score", "Value": selectedHospital.total_risk_score },
            { "Metric": "Risk Category", "Value": selectedHospital.risk_category },
            { "Metric": "Metrics Risk Score", "Value": selectedHospital.metrics.metrics_risk_score },
            { "Metric": "Doctor/Bed Ratio Score", "Value": selectedHospital.metrics.doctor_bed_ratio_score },
            { "Metric": "Nurse/Bed Ratio Score", "Value": selectedHospital.metrics.nurse_bed_ratio_score },
            { "Metric": "ICU Doctor/Bed Ratio Score", "Value": selectedHospital.metrics.icu_doctor_bed_ratio_score },
            { "Metric": "ICU Nurse/Bed Ratio Score", "Value": selectedHospital.metrics.icu_nurse_bed_ratio_score },
            { "Metric": "Certification Risk Score", "Value": selectedHospital.certification_risk_score },
            { "Metric": "Document Risk Score", "Value": selectedHospital.document_risk_score },
            { "Metric": "Certifications List", "Value": selectedHospital.certifications.map(c => `${c.certification_type} (${c.status})`).join(', ') },
            { "Metric": "Unverified Documents List", "Value": selectedHospital.unverified_documents.map(d => d.document_type).join(', ') },
        ];

        exportToExcel(data, `${selectedHospital.name}_Risk_Report`);
    };

    const fetchHospitalDetails = async (hospitalId) => {
        setDrawerLoading(true);
        setDrawerVisible(true);
        try {
            const details = await getHospitalRiskProfile(hospitalId);
            setSelectedHospital(details);
        } catch (error) {
            console.error("Failed to fetch hospital details:", error);
            message.error("Failed to load detailed report.");
            setSelectedHospital(null);
        } finally {
            setDrawerLoading(false);
        }
    };

    const onCloseDrawer = () => {
        setDrawerVisible(false);
        setSelectedHospital(null);
    };

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
                <label style={{ fontWeight: "bold" }}>Filter by Risk Category</label>
                <Select
                    value={riskCategoryFilter}
                    onChange={setRiskCategoryFilter}
                    style={{ width: "100%" }}
                >
                    <Option value="All">All</Option>
                    <Option value="Low">Low</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="High">High</Option>
                </Select>
            </Space>
        </div>
    );

    const columns = [
        {
            title: "Hospital Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <b>{text}</b>,
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: "Total Risk Score",
            dataIndex: "total_risk_score",
            key: "total_risk_score",
            sorter: (a, b) => (a.total_risk_score || 0) - (b.total_risk_score || 0),
            render: (score) => (
                <Tag color="blue" style={{ fontSize: 14, padding: "4px 8px" }}>
                    {score}
                </Tag>
            ),
        },
        {
            title: "Risk Category",
            dataIndex: "risk_category",
            key: "risk_category",
            sorter: (a, b) => (a.risk_category || '').localeCompare(b.risk_category || ''),
            render: (category) => (
                <Tag color={riskColors[category]} style={{ fontSize: 14, padding: "4px 8px" }}>
                    {category}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Button onClick={() => fetchHospitalDetails(record.id)}>
                    View Details
                </Button>
            ),
        },
    ];

    const renderDetailedView = () => {
        if (drawerLoading) {
            return (
                <div style={{ textAlign: "center", padding: 50 }}>
                    <Spin size="large" tip="Loading report..." />
                </div>
            );
        }

        if (!selectedHospital) {
            return <Empty description="No data found for this hospital." />;
        }

        return (
            <div style={{ padding: 12 }}>
                <Space style={{ marginBottom: 20 }} align="center">
                    <h3 style={{ margin: 0 }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        Overall Risk Summary
                    </h3>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleHospitalDownload}
                        size="small"
                    >
                        Download Report
                    </Button>
                </Space>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Total Risk Score">
                        <Tag color="blue" style={{ fontSize: 14 }}>{selectedHospital.total_risk_score}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Risk Category">
                        <Tag color={riskColors[selectedHospital.risk_category]} style={{ fontSize: 14 }}>
                            {selectedHospital.risk_category}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Risk Breakdown">
                        <Space direction="vertical">
                            <Tag color="#108ee9">Metrics: {selectedHospital.metrics_risk_score}</Tag>
                            <Tag color="#87d068">Certifications: {selectedHospital.certification_risk_score}</Tag>
                            <Tag color="#f50">Documents: {selectedHospital.document_risk_score}</Tag>
                        </Space>
                    </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">
                    <MedicineBoxOutlined /> Metrics Report
                </Divider>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Doctor/Bed Ratio Score">{selectedHospital.metrics.doctor_bed_ratio_score}</Descriptions.Item>
                    <Descriptions.Item label="Nurse/Bed Ratio Score">{selectedHospital.metrics.nurse_bed_ratio_score}</Descriptions.Item>
                    <Descriptions.Item label="ICU Doctor/Bed Ratio Score">{selectedHospital.metrics.icu_doctor_bed_ratio_score}</Descriptions.Item>
                    <Descriptions.Item label="ICU Nurse/Bed Ratio Score">{selectedHospital.metrics.icu_nurse_bed_ratio_score}</Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">
                    <FileTextOutlined /> Certifications & Documents
                </Divider>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Certifications">
                        {selectedHospital.certifications.length > 0 ? (
                            <Space wrap>
                                {selectedHospital.certifications.map(cert => (
                                    <Tag key={cert.id} color={cert.status === "Expired" ? "volcano" : "green"}>
                                        {cert.certification_type} ({cert.status})
                                    </Tag>
                                ))}
                            </Space>
                        ) : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Unverified Documents">
                        {selectedHospital.unverified_documents.length > 0 ? (
                            <Space wrap>
                                {selectedHospital.unverified_documents.map(doc => (
                                    <Tag key={doc.id} color="red">{doc.document_type}</Tag>
                                ))}
                            </Space>
                        ) : "None"}
                    </Descriptions.Item>
                </Descriptions>
            </div>
        );
    };

    const compareColumns = [
        {
            title: "Hospital Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: "Risk Score",
            dataIndex: "total_risk_score",
            key: "total_risk_score",
            sorter: (a, b) => (a.total_risk_score || 0) - (b.total_risk_score || 0),
            render: score => <Tag color="blue">{score}</Tag>,
        },
        {
            title: "Category",
            dataIndex: "risk_category",
            key: "risk_category",
            sorter: (a, b) => (a.risk_category || '').localeCompare(b.risk_category || ''),
            render: category => <Tag color={riskColors[category]}>{category}</Tag>,
        },
    ];

    if (loading) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <Spin tip="Loading hospitals..." size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 20 }}>
                <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Hospital Risk Score Dashboard
            </h2>
            {/* Tally Bar Section */}
            <div style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]} justify="center">
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} styles={{ body: { padding: '12px 24px' } }}>
                            <Statistic title="Total Hospitals Analyzed" value={hospitals.length} prefix={<HomeOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} styles={{ body: { padding: '12px 24px' } }}>
                            <Statistic title="High Risk" value={riskCategoryCounts.High} valueStyle={{ color: riskColors.High }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} styles={{ body: { padding: '12px 24px' } }}>
                            <Statistic title="Medium Risk" value={riskCategoryCounts.Medium} valueStyle={{ color: riskColors.Medium }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} styles={{ body: { padding: '12px 24px' } }}>
                            <Statistic title="Low Risk" value={riskCategoryCounts.Low} valueStyle={{ color: riskColors.Low }} />
                        </Card>
                    </Col>
                </Row>
            </div>
            {/* Control Bar Section */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
                justifyContent: "flex-start",
                alignItems: "center",
            }}>
                <Search
                    placeholder="Search hospitals by name or address..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: 300, flexGrow: 1 }}
                />
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
                    icon={<CalculatorOutlined />}
                    onClick={() => setIsScoreModalVisible(true)}
                >
                    How We Calculate Score
                </Button>
                <Button
                    icon={<PieChartOutlined />}
                    onClick={() => setIsChartModalVisible(true)}
                >
                    View Risk Distribution
                </Button>
                <Button
                    icon={<TableOutlined />}
                    onClick={() => setIsCompareModalVisible(true)}
                >
                    Quick Compare
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleGlobalDownload}
                >
                    Download All
                </Button>
            </div>
            {/* Main Content Area */}
            {filteredHospitals.length === 0 ? (
                <Empty description="No hospitals found" />
            ) : viewMode === "list" ? (
                <Table
                    rowKey="id"
                    dataSource={filteredHospitals}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: "max-content" }}
                />
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredHospitals.map((hospital) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={hospital.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 }}
                            >
                                <Card
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', minHeight: 40, width: '100%', overflow: 'hidden' }}>
                                            <WarningOutlined style={{ marginRight: 8, color: riskColors[hospital.risk_category] }} />
                                            <Tooltip title={hospital.name}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{hospital.name}</span>
                                            </Tooltip>
                                        </div>
                                    }
                                    hoverable
                                    bordered
                                    style={{ borderRadius: 10, height: 180, cursor: 'pointer', boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    bodyStyle={{ padding: '16px' }}
                                    onClick={() => fetchHospitalDetails(hospital.id)}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Space style={{ marginBottom: 8 }} wrap>
                                            <Tag color="blue" icon={<InfoCircleOutlined />} style={{ fontSize: 14 }}>
                                                Score: {hospital.total_risk_score}
                                            </Tag>
                                            <Tag color={riskColors[hospital.risk_category]} style={{ fontSize: 14 }}>
                                                {hospital.risk_category}
                                            </Tag>
                                        </Space>
                                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <Space>
                                                <HomeOutlined style={{ color: '#555' }} />
                                                <span style={{ color: '#888' }}>{hospital.address}</span>
                                            </Space>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            )}
            {/* Modals and Drawers */}
            <Drawer
                title={selectedHospital ? `${selectedHospital.name} Risk Report` : "Risk Report"}
                width={selectedHospital ? (window.innerWidth > 768 ? 600 : "100%") : 320}
                onClose={onCloseDrawer}
                open={drawerVisible}
                destroyOnClose
            >
                {renderDetailedView()}
            </Drawer>

            <Modal
                title="Risk Score Calculation"
                open={isScoreModalVisible}
                onCancel={() => setIsScoreModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsScoreModalVisible(false)}>
                        Close
                    </Button>,
                ]}
            >
                <p>
                    The total risk score is the sum of scores from three categories:
                    <br />
                    ➡️ **Metrics Score:** Based on key operational metrics.
                    <br />
                    ➡️ **Certifications Score:** Derived from the status and validity of hospital certifications.
                    <br />
                    ➡️ **Documents Score:** Assessed by the number of unverified or missing documents.
                </p>
            </Modal>

            <Modal
                title="Hospital Risk Distribution"
                open={isChartModalVisible}
                onCancel={() => setIsChartModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsChartModalVisible(false)}>
                        Close
                    </Button>,
                ]}
                width={500}
            >
                {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <Empty description="No data to display." />
                )}
            </Modal>

            <Modal
                title="Quick Compare Table"
                open={isCompareModalVisible}
                onCancel={() => setIsCompareModalVisible(false)}
                footer={null}
                width={800}
            >
                <Table
                    rowKey="id"
                    dataSource={filteredHospitals}
                    columns={compareColumns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: "max-content" }}
                />
            </Modal>
        </div>
    );
};

export default HospitalRiskScoreProfile;
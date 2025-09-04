import React, { useState, useEffect, useMemo } from 'react';
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
    Table
} from "antd";
import {
    HomeOutlined,
    SearchOutlined,
    FilterOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    DownloadOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { getISOCertificationStatus } from "../../../services/hospitalISOService";
import { fetchHospitalsForDashboard } from '../../../services/hospitalLocationService';

const { Search } = Input;

const HospitalISOCertification = () => {
    const [isoData, setIsoData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('card');
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(isoData.map((item) => item.status).filter(Boolean));
        return ["All", ...statuses].sort();
    }, [isoData]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [isoCertData, hospitalLocData] = await Promise.all([
                    getISOCertificationStatus(),
                    fetchHospitalsForDashboard()
                ]);

                const hospitalDetailsMap = new Map(
                    hospitalLocData.map(hospital => [hospital.hospital_id, hospital])
                );

                const mergedData = isoCertData.map(iso => {
                    const hospital = hospitalDetailsMap.get(iso.hospital_id);
                    return {
                        ...iso,
                        district: hospital?.address_details?.district || 'N/A',
                        state: hospital?.address_details?.state || 'N/A',
                        location: hospital?.full_address || 'N/A', // Adding full address for the tooltip
                    };
                });

                setIsoData(mergedData);
                message.success("ISO certification data loaded successfully!");
            } catch (err) {
                setError("Failed to load data. Please check the network and API endpoints.");
                console.error("Error fetching data:", err);
                message.error("Failed to fetch data.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        let results = isoData;

        if (statusFilter !== "All") {
            results = results.filter((item) => item.status === statusFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (item) =>
                    item.hospital_name?.toLowerCase().includes(term) ||
                    item.certificate_number?.toLowerCase().includes(term) ||
                    item.district?.toLowerCase().includes(term) ||
                    item.state?.toLowerCase().includes(term) ||
                    item.issued_date?.toLowerCase().includes(term) ||
                    item.expiry_date?.toLowerCase().includes(term) ||
                    item.status?.toLowerCase().includes(term)
            );
        }
        return results;
    }, [isoData, searchTerm, statusFilter]);

    const handleDownload = () => {
        if (filteredData.length === 0) {
            message.info("No data to export.");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(
            filteredData.map((item) => ({
                "Hospital Name": item.hospital_name,
                "District": item.district,
                "State": item.state,
                "Certificate Number": item.certificate_number,
                "Issued Date": item.issued_date,
                "Expiry Date": item.expiry_date,
                "Status": item.status,
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ISO Certifications");
        XLSX.writeFile(wb, "iso_certifications.xlsx");
        message.success("Data exported to Excel successfully!");
    };

    const activeFiltersCount = (statusFilter !== 'All' ? 1 : 0);

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
                <label style={{ fontWeight: "bold" }}>Filter by Status</label>
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: "100%" }}
                    options={uniqueStatuses.map((s) => ({ label: s, value: s }))}
                />
            </Space>
        </div>
    );

    const columns = [
        {
            title: "Hospital Name",
            dataIndex: "hospital_name",
            key: "hospital_name",
            sorter: (a, b) => (a.hospital_name || '').localeCompare(b.hospital_name || ''),
            render: (text, record) => (
                <Tooltip title={
                    <div>
                        <p style={{ margin: 0 }}>{record.hospital_name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#fff' }}>{record.location}</p>
                    </div>
                }>
                    <Space direction="vertical" size={2}>
                        <b>{text}</b>
                        <span style={{ color: '#888', fontSize: '12px' }}>
                            {record.district}, {record.state}
                        </span>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: "Certificate Number",
            dataIndex: "certificate_number",
            key: "certificate_number",
        },
        {
            title: "Issued Date",
            dataIndex: "issued_date",
            key: "issued_date",
            sorter: (a, b) => new Date(a.issued_date) - new Date(b.issued_date),
            responsive: ['md'],
        },
        {
            title: "Expiry Date",
            dataIndex: "expiry_date",
            key: "expiry_date",
            sorter: (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date),
            responsive: ['md'],
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
            render: (status) => (
                <Tag color={status === 'Valid' ? 'green' : 'red'}>
                    {status}
                </Tag>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <Spin tip="Loading certification data..." size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: "red" }}>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 20 }}>
                <HomeOutlined style={{ marginRight: 8 }} />
                ISO Certification Status Dashboard
            </h2>
            {/* Quick Stats */}
            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <Statistic
                                title="Total Certifications"
                                value={isoData.length}
                                prefix={<HomeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <Statistic
                                title="Valid Certifications"
                                value={isoData.filter(item => item.status === 'Valid').length}
                                prefix={<Tag color="green" style={{ border: 'none' }}>Valid</Tag>}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <Statistic
                                title="Expired Certifications"
                                value={isoData.filter(item => item.status === 'Expired').length}
                                prefix={<Tag color="red" style={{ border: 'none' }}>Expired</Tag>}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Action Bar */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
                justifyContent: "flex-start",
                alignItems: "center",
            }}>
                <Search
                    placeholder="Search for hospitals..."
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
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    type="primary"
                >
                    Export to Excel
                </Button>
            </div>

            {/* Main Content Area */}
            {filteredData.length === 0 ? (
                <Empty description="No ISO certification data found" />
            ) : viewMode === "list" ? (
                <Table
                    rowKey="certificate_number"
                    dataSource={filteredData}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: "max-content" }}
                />
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredData.map((item) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={item.certificate_number}>
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 }}
                            >
                                <Card
                                    title={
                                        <Tooltip title={
                                            <div>
                                                <p style={{ margin: 0 }}>{item.hospital_name}</p>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#fff' }}>{item.location}</p>
                                            </div>
                                        }>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Tag color={item.status === 'Valid' ? 'green' : 'red'}>{item.status}</Tag>
                                                <span style={{ marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.hospital_name}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    }
                                    bordered
                                    hoverable
                                    style={{ borderRadius: 10, height: 220 }}
                                    bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                >
                                    <div style={{ flexGrow: 1 }}>
                                        <p style={{ color: '#888', marginBottom: 4, marginTop: 0 }}>
                                            {item.district !== 'N/A' && `${item.district}, `}
                                            {item.state !== 'N/A' && `${item.state}`}
                                        </p>
                                        <p style={{ color: '#888', marginBottom: 4 }}>
                                            Certificate: <b>{item.certificate_number}</b>
                                        </p>
                                        <p style={{ color: '#888', marginBottom: 4 }}>
                                            Issued: <b>{item.issued_date}</b>
                                        </p>
                                        <p style={{ color: '#888' }}>
                                            Expires: <b>{item.expiry_date}</b>
                                        </p>
                                    </div>
                                    <Space wrap style={{ marginTop: 10 }}>
                                        {/* Tags removed as requested in previous responses */}
                                    </Space>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default HospitalISOCertification;
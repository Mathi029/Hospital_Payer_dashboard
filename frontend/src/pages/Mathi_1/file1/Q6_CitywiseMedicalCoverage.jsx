import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Space,
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
    Modal,
    Tooltip
} from "antd";
import {
    EnvironmentOutlined,
    HomeOutlined,
    SearchOutlined,
    FilterOutlined,
    DownloadOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    BarChartOutlined
} from "@ant-design/icons";
import { fetchCityWiseMedicalCoverageData, fetchHospitalsByCityData } from '../../../services/CityWiseMedicalCoverageService.js';
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    Legend
);

const { Search } = Input;

const CityWiseMedicalCoverage = () => {
    const [data, setData] = useState([]);
    const [hospitalsInCity, setHospitalsInCity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [hospitalLoading, setHospitalLoading] = useState(false);
    const [cityFilter, setCityFilter] = useState("All");
    const [viewMode, setViewMode] = useState("card");
    const [animatedStat, setAnimatedStat] = useState("hospitals"); // 'hospitals' or 'beds'

    const uniqueCities = useMemo(() => {
        const cities = new Set(data.map((item) => item.city).filter(Boolean));
        return ["All", ...cities].sort();
    }, [data]);

    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true);
                const fetchedData = await fetchCityWiseMedicalCoverageData();
                setData(fetchedData);
                message.success("City-wise data loaded successfully!");
            } catch (error) {
                console.error("Error fetching data:", error);
                message.error("Failed to fetch city-wise data.");
            } finally {
                setLoading(false);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedStat(prevStat => (prevStat === "hospitals" ? "beds" : "hospitals"));
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const filteredData = useMemo(() => {
        let results = data;
        if (cityFilter !== "All") {
            results = results.filter(item => item.city === cityFilter);
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(item =>
                item.city.toLowerCase().includes(term)
            );
        }
        return results;
    }, [data, searchTerm, cityFilter]);

    const totalHospitals = useMemo(() => {
        return data.reduce((sum, item) => sum + item.hospital_count, 0);
    }, [data]);

    const totalBeds = useMemo(() => {
        return data.reduce((sum, item) => sum + item.total_beds, 0);
    }, [data]);

    const top5Cities = useMemo(() => {
        return [...data].sort((a, b) => b.hospital_count - a.hospital_count).slice(0, 5);
    }, [data]);

    const chartData = {
        labels: top5Cities.map(city => city.city),
        datasets: [
            {
                label: 'Number of Hospitals',
                data: top5Cities.map(city => city.hospital_count),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Top 5 Cities by Hospital Count',
            },
        },
        maintainAspectRatio: false,
    };

    const handleViewHospitals = async (city) => {
        try {
            setHospitalLoading(true);
            const hospitals = await fetchHospitalsByCityData();
            setHospitalsInCity(hospitals[city] || []);
            setSelectedCity(city);
            setModalVisible(true);
        } catch (error) {
            console.error("Error fetching hospitals:", error);
            message.error("Failed to fetch hospitals for this city.");
        } finally {
            setHospitalLoading(false);
        }
    };

    const handleDownload = () => {
        if (filteredData.length === 0) {
            message.info("No data to export.");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(
            filteredData.map((item) => ({
                "City": item.city,
                "Number of Hospitals": item.hospital_count,
                "Total Bed Capacity": item.total_beds
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "City Medical Coverage");
        XLSX.writeFile(wb, "city_medical_coverage.xlsx");
        message.success("Data exported to Excel successfully!");
    };

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

    const columns = [
        {
            title: "City",
            dataIndex: "city",
            key: "city",
            sorter: (a, b) => a.city.localeCompare(b.city),
            render: (text) => <b>{text}</b>,
        },
        {
            title: "Number of Hospitals",
            dataIndex: "hospital_count",
            key: "hospital_count",
            sorter: (a, b) => a.hospital_count - b.hospital_count,
            responsive: ['md'],
        },
        {
            title: "Total Bed Capacity",
            dataIndex: "total_beds",
            key: "total_beds",
            sorter: (a, b) => a.total_beds - b.total_beds,
            responsive: ['md'],
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Button
                    onClick={() => handleViewHospitals(record.city)}
                    icon={<EnvironmentOutlined />}
                    type="primary"
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                    View Hospitals
                </Button>
            ),
        },
    ];

    const formatAddress = (address) => {
        if (!address) {
            return "Address not available";
        }
        const street = address.street || '';
        const area = address.area_locality || '';
        const city = address.city_town || '';
        const state = address.state || '';
        const pin = address.pin_code || '';
        return `${street}, ${area}, ${city}, ${state} - ${pin}`;
    };

    if (loading) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <Spin tip="Loading data..." size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 20 }}>
                <HomeOutlined style={{ marginRight: 8 }} />
                City-wise Medical Coverage Dashboard
            </h2>
            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Card
                                bordered={false}
                                style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                            >
                                <Statistic
                                    title="Total Cities"
                                    value={data.length}
                                    prefix={<HomeOutlined />}
                                />
                            </Card>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={animatedStat}
                                    initial={{ rotateY: -90, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: 90, opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Card
                                        bordered={false}
                                        style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                    >
                                        <Statistic
                                            title={animatedStat === "hospitals" ? "Total Hospitals" : "Total Beds"}
                                            value={animatedStat === "hospitals" ? totalHospitals : totalBeds}
                                            prefix={<BarChartOutlined />}
                                        />
                                    </Card>
                                </motion.div>
                            </AnimatePresence>
                        </Space>
                    </Col>
                    <Col xs={24} md={16} lg={18}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                            bodyStyle={{ height: '300px', padding: '16px' }}
                        >
                            <Bar data={chartData} options={chartOptions} />
                        </Card>
                    </Col>
                </Row>
            </div>
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
                justifyContent: "flex-start",
                alignItems: "center",
            }}>
                <Search
                    placeholder="Search for a city..."
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
            {filteredData.length === 0 ? (
                <Empty description="No cities found" />
            ) : viewMode === "list" ? (
                <Table
                    rowKey="city"
                    dataSource={filteredData}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: "max-content" }}
                />
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredData.map((cityData, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={cityData.city}>
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 * index }}
                            >
                                <Card
                                    bordered
                                    hoverable
                                    style={{ borderRadius: 10, height: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                    actions={[
                                        <Button
                                            onClick={() => handleViewHospitals(cityData.city)}
                                            icon={<EnvironmentOutlined />}
                                            type="primary"
                                            style={{ width: '90%', margin: 'auto' }}
                                        >
                                            View Hospitals
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta
                                        title={<div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{cityData.city}</div>}
                                        description={
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <p style={{ margin: 0 }}>
                                                    <span style={{ fontWeight: 'bold' }}>Hospitals:</span> {cityData.hospital_count}
                                                </p>
                                                <p style={{ margin: 0 }}>
                                                    <span style={{ fontWeight: 'bold' }}>Total Beds:</span> {cityData.total_beds}
                                                </p>
                                            </Space>
                                        }
                                    />
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            )}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EnvironmentOutlined />
                        Hospitals in {selectedCity}
                    </div>
                }
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
                centered
                bodyStyle={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}
            >
                <div style={{ minHeight: 300, padding: '16px 0' }}>
                    {hospitalLoading ? (
                        <div style={{ textAlign: "center", padding: 50 }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {hospitalsInCity.length > 0 ? (
                                hospitalsInCity.map((hospital, index) => (
                                    <Col xs={24} key={hospital.id}>
                                        <Card
                                            hoverable
                                            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                                        >
                                            <Card.Meta
                                                avatar={<EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                                title={hospital.name}
                                                description={
                                                    <div style={{ color: 'rgba(0,0,0,0.65)' }}>
                                                        <p style={{ margin: 0 }}>
                                                            <strong>Beds Registered:</strong> {hospital.beds_registered || 'N/A'}
                                                        </p>
                                                        <p style={{ margin: 0 }}>
                                                            <strong>Address:</strong> {formatAddress(hospital.address)}
                                                        </p>
                                                    </div>
                                                }
                                            />
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col span={24}>
                                    <Empty description="No hospitals found in this city." />
                                </Col>
                            )}
                        </Row>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default CityWiseMedicalCoverage;
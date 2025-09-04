import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    Row,
    Col,
    Spin,
    message,
    Select,
    Table,
    Empty,
    Space,
    Typography,
    Statistic,
    Button,
    Input,
    Badge,
    Dropdown,
    Tooltip,
    Tag
} from "antd";
import {
    DollarCircleOutlined,
    HomeOutlined,
    BarChartOutlined,
    ArrowLeftOutlined,
    SearchOutlined,
    FilterOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
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
import { fetchHospitalFinancialsData } from '../../../services/hospitalFinancialService';
import { motion } from "framer-motion";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    Legend
);

const { Title: Heading } = Typography;
const { Search } = Input;

const HospitalFinancialProfile = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [searchTerm, setSearchTerm] = useState("");
    const [cityFilter, setCityFilter] = useState("All");
    const [revenueCards, setRevenueCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    // Fetch data on component mount
    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true);
                const fetchedData = await fetchHospitalFinancialsData();
                setData(fetchedData);
                message.success("Financial data loaded successfully!");
            } catch (error) {
                console.error("Error fetching financial data:", error);
                message.error("Failed to fetch hospital financial data.");
            } finally {
                setLoading(false);
            }
        };
        getData();
    }, []);

    // Memoize the list of unique hospitals and calculate their total revenue
    const hospitalDataWithRevenue = useMemo(() => {
        const hospitals = new Map();
        data.forEach(item => {
            if (!hospitals.has(item.hospital_id)) {
                hospitals.set(item.hospital_id, {
                    id: item.hospital_id,
                    name: item.hospital_name,
                    address: item.hospital_address,
                    totalDailyRevenue: 0,
                    totalMonthlyRevenue: 0,
                    rooms: []
                });
            }
            const hospital = hospitals.get(item.hospital_id);
            const dailyRevenue = item.total_beds * item.daily_rate;
            hospital.totalDailyRevenue += dailyRevenue;
            hospital.totalMonthlyRevenue += dailyRevenue * 30; // Approximation
            hospital.rooms.push(item);
        });

        const hospitalList = Array.from(hospitals.values());
        // Sort by hospital name
        return hospitalList.sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    // Prepare revenue cards for scrolling display and set up interval
    useEffect(() => {
        if (hospitalDataWithRevenue.length > 0) {
            const totalRevenue = hospitalDataWithRevenue.reduce((sum, h) => sum + h.totalMonthlyRevenue, 0);
            const highestRevenueHospital = hospitalDataWithRevenue.reduce((highest, current) =>
                (highest.totalMonthlyRevenue > current.totalMonthlyRevenue ? highest : current),
                hospitalDataWithRevenue[0]
            );

            setRevenueCards([
                {
                    title: "Total Hospital Revenue Potential",
                    value: totalRevenue,
                    prefix: "₹",
                    precision: 0,
                    style: { color: '#3f8600' }
                },
                {
                    title: `Highest Revenue Hospital: ${highestRevenueHospital.name}`,
                    value: highestRevenueHospital.totalMonthlyRevenue,
                    prefix: "₹",
                    precision: 0,
                    style: { color: '#0050b3' }
                },
                {
                    title: "Total Number of Hospitals",
                    value: hospitalDataWithRevenue.length,
                    precision: 0,
                    style: { color: '#08979c' }
                }
            ]);

            const interval = setInterval(() => {
                setCurrentCardIndex(prevIndex => (prevIndex + 1) % 3);
            }, 5000); // Change card every 5 seconds

            return () => clearInterval(interval); // Clean up interval on unmount
        }
    }, [hospitalDataWithRevenue]);

    // Memoize the list of unique cities for the dropdown
    const uniqueCities = useMemo(() => {
        const cities = new Set(hospitalDataWithRevenue.map(item => item.address?.city).filter(Boolean));
        return ["All", ...Array.from(cities).sort()];
    }, [hospitalDataWithRevenue]);

    // Memoize filtered and searched data
    const filteredHospitals = useMemo(() => {
        let results = hospitalDataWithRevenue;

        if (cityFilter !== "All") {
            results = results.filter(item => item.address?.city === cityFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (item) =>
                    item.name?.toLowerCase().includes(term) ||
                    item.address?.street?.toLowerCase().includes(term) ||
                    item.address?.city?.toLowerCase().includes(term)
            );
        }
        return results;
    }, [hospitalDataWithRevenue, searchTerm, cityFilter]);

    // Memoize the data for the selected hospital's details
    const selectedHospitalData = useMemo(() => {
        if (!selectedHospitalId) return null;
        const hospital = hospitalDataWithRevenue.find(h => h.id === selectedHospitalId);
        if (!hospital) return null;

        let revenueByRoomType = {};
        hospital.rooms.forEach(room => {
            const revenue = room.total_beds * room.daily_rate;
            const roomType = room.room_category || room.ward_type;
            if (revenueByRoomType[roomType]) {
                revenueByRoomType[roomType] += revenue;
            } else {
                revenueByRoomType[roomType] = revenue;
            }
        });

        return {
            ...hospital,
            revenueByRoomType
        };
    }, [hospitalDataWithRevenue, selectedHospitalId]);

    const tableColumns = [
        {
            title: "Room Type",
            dataIndex: "room_category",
            key: "room_category",
            sorter: (a, b) => (a.room_category || a.ward_type).localeCompare(b.room_category || b.ward_type),
            render: (text, record) => record.room_category || record.ward_type,
        },
        {
            title: "Total Beds",
            dataIndex: "total_beds",
            key: "total_beds",
            sorter: (a, b) => a.total_beds - b.total_beds,
        },
        {
            title: "Available Beds",
            dataIndex: "available_beds",
            key: "available_beds",
            sorter: (a, b) => a.available_beds - b.available_beds,
        },
        {
            title: "Daily Rate (INR)",
            dataIndex: "daily_rate",
            key: "daily_rate",
            sorter: (a, b) => a.daily_rate - b.daily_rate,
            render: (text) => `₹${text.toLocaleString()}`,
        },
        {
            title: "Daily Revenue Potential (INR)",
            key: "daily_revenue_potential",
            sorter: (a, b) => (a.total_beds * a.daily_rate) - (b.total_beds * b.daily_rate),
            render: (_, record) => `₹${(record.total_beds * record.daily_rate).toLocaleString()}`,
        },
    ];

    const chartData = {
        labels: selectedHospitalData ? Object.keys(selectedHospitalData.revenueByRoomType) : [],
        datasets: [
            {
                label: 'Daily Revenue Potential (INR)',
                data: selectedHospitalData ? Object.values(selectedHospitalData.revenueByRoomType) : [],
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
                text: 'Daily Revenue Potential by Room Type',
            },
        },
        maintainAspectRatio: false,
    };

    const handleViewFinancialBreakdown = (hospitalId) => {
        setSelectedHospitalId(hospitalId);
        setViewMode('details');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedHospitalId(null);
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


    if (loading) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <Spin tip="Loading hospital financial data..." size="large" />
            </div>
        );
    }

    if (viewMode === 'details') {
        if (!selectedHospitalData) {
            return (
                <div style={{ padding: 20 }}>
                    <Button onClick={handleBackToList} icon={<ArrowLeftOutlined />} style={{ marginBottom: 20 }}>
                        Back to List
                    </Button>
                    <Empty description="No data found for this hospital." />
                </div>
            );
        }

        return (
            <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Heading level={2} style={{ margin: 0 }}>
                        <DollarCircleOutlined style={{ marginRight: 8 }} />
                        Financial Profile
                    </Heading>
                    <Button onClick={handleBackToList} icon={<ArrowLeftOutlined />} type="default">
                        Back to List
                    </Button>
                </div>
                <Card
                    bordered={false}
                    style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 20 }}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: 10 }}>
                                <HomeOutlined style={{ marginRight: 8 }} />
                                {selectedHospitalData.name}
                            </div>
                            <p style={{ margin: 0 }}>
                                {selectedHospitalData.address && `${selectedHospitalData.address.street}, ${selectedHospitalData.address.city}, ${selectedHospitalData.address.state} - ${selectedHospitalData.address.pin_code}`}
                            </p>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Statistic
                                title="Est. Daily Revenue Potential"
                                value={selectedHospitalData.totalDailyRevenue}
                                prefix="₹"
                                precision={0}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Statistic
                                title="Est. Monthly Revenue Potential"
                                value={selectedHospitalData.totalMonthlyRevenue}
                                prefix="₹"
                                precision={0}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: '100%' }}
                        >
                            <Heading level={4} style={{ marginBottom: 16 }}>
                                <BarChartOutlined style={{ marginRight: 8 }} />
                                Revenue Potential Chart
                            </Heading>
                            <div style={{ height: 300 }}>
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: '100%' }}
                        >
                            <Heading level={4} style={{ marginBottom: 16 }}>
                                <DollarCircleOutlined style={{ marginRight: 8 }} />
                                Room Pricing Structure
                            </Heading>
                            <Table
                                rowKey="id"
                                dataSource={selectedHospitalData.rooms}
                                columns={tableColumns}
                                pagination={{ pageSize: 5 }}
                                scroll={{ x: "max-content" }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <Heading level={2} style={{ marginBottom: 20 }}>
                <DollarCircleOutlined style={{ marginRight: 8 }} />
                Hospital Financial Profile
            </Heading>
            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 10,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                minHeight: 120,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}
                        >
                            {revenueCards.length > 0 && (
                                <motion.div
                                    key={currentCardIndex}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.5 }}
                                    style={{ width: '100%' }}
                                >
                                    <Statistic
                                        title={<span style={{ fontSize: '1.2em' }}>{revenueCards[currentCardIndex].title}</span>}
                                        value={revenueCards[currentCardIndex].value}
                                        prefix={revenueCards[currentCardIndex].prefix}
                                        precision={revenueCards[currentCardIndex].precision}
                                        valueStyle={{ ...revenueCards[currentCardIndex].style, fontSize: '2em' }}
                                    />
                                </motion.div>
                            )}
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
            </div>

            {filteredHospitals.length === 0 ? (
                <Empty description="No hospitals found" />
            ) : viewMode === "list" ? (
                <Table
                    rowKey="id"
                    dataSource={filteredHospitals}
                    columns={[
                        {
                            title: "Hospital Name",
                            dataIndex: "name",
                            key: "name",
                            render: (text) => <b>{text}</b>,
                            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
                        },
                        {
                            title: "City",
                            dataIndex: ["address", "city"],
                            key: "city",
                            sorter: (a, b) => (a.address?.city || '').localeCompare(b.address?.city || ''),
                            render: (city) => (
                                city ? <Tag color="cyan">{city}</Tag> : null
                            ),
                        },
                        {
                            title: "Est. Monthly Revenue",
                            dataIndex: "totalMonthlyRevenue",
                            key: "totalMonthlyRevenue",
                            sorter: (a, b) => a.totalMonthlyRevenue - b.totalMonthlyRevenue,
                            render: (value) => `₹${value.toLocaleString()}`,
                            responsive: ['md'],
                        },
                        {
                            title: "Actions",
                            key: "actions",
                            render: (_, record) => (
                                <Button
                                    onClick={() => handleViewFinancialBreakdown(record.id)}
                                    type="primary"
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    View Financial Breakdown
                                </Button>
                            ),
                        },
                    ]}
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
                                        <Tooltip title={hospital.name}>
                                            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                                <HomeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {hospital.name}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    }
                                    bordered
                                    hoverable
                                    style={{ borderRadius: 10, height: 250 }}
                                    bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                >
                                    <div style={{ flexGrow: 1 }}>
                                        <p style={{ color: '#888' }}>
                                            {hospital.address && `${hospital.address.street}, ${hospital.address.city}`}
                                        </p>
                                        <Space wrap style={{ marginTop: 10 }}>
                                            {hospital.address?.city && <Tag color="cyan">{hospital.address.city}</Tag>}
                                            {hospital.address?.state && <Tag color="geekblue">{hospital.address.state}</Tag>}
                                        </Space>
                                        <Statistic
                                            title="Monthly Revenue Potential"
                                            value={hospital.totalMonthlyRevenue}
                                            prefix="₹"
                                            precision={0}
                                            valueStyle={{ fontSize: '1.2em', marginTop: 10 }}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleViewFinancialBreakdown(hospital.id)}
                                        type="primary"
                                        block
                                        style={{ marginTop: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    >
                                        View Financial Breakdown
                                    </Button>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default HospitalFinancialProfile;
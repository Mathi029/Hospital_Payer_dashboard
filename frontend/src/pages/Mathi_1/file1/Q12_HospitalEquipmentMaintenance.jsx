import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Space,
    Spin,
    Typography,
    Table,
    Tag,
    Empty,
    message,
    Progress,
    Tooltip,
    Input,
    Select,
    Badge,
    Dropdown,
    Statistic
} from 'antd';
import {
    EnvironmentOutlined,
    ArrowLeftOutlined,
    CalendarOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
    DownloadOutlined,
    SearchOutlined,
    FilterOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { fetchEquipmentMaintenanceSchedule } from "../../../services/equipmentMaintenanceService";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const EquipmentMaintenanceCalendar = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [cityFilter, setCityFilter] = useState("All");

    useEffect(() => {
        const getData = async () => {
            setLoading(true);
            try {
                const equipmentData = await fetchEquipmentMaintenanceSchedule();
                setEquipment(equipmentData);
                message.success("Equipment data loaded successfully!", 1.5);
            } catch (err) {
                console.error(err);
                message.error("Failed to fetch equipment data.");
            } finally {
                setLoading(false);
            }
        };
        getData();
    }, []);

    const hospitalsGrouped = useMemo(() => {
        if (!equipment || equipment.length === 0) return {};

        const groups = {};
        equipment.forEach(item => {
            if (!groups[item.hospital_id]) {
                groups[item.hospital_id] = {
                    name: item.hospital_name,
                    id: item.hospital_id,
                    city: item.city,
                    state: item.state,
                    equipment: [],
                };
            }
            groups[item.hospital_id].equipment.push(item);
        });
        return groups;
    }, [equipment]);

    const uniqueCities = useMemo(() => {
        const cities = new Set(equipment.map((item) => item.city).filter(Boolean));
        return ["All", ...cities].sort();
    }, [equipment]);

    const filteredHospitals = useMemo(() => {
        let results = Object.values(hospitalsGrouped);

        if (cityFilter !== "All") {
            results = results.filter((item) => item.city === cityFilter);
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
    }, [hospitalsGrouped, searchTerm, cityFilter]);


    const handleViewSchedule = (hospital) => {
        setSelectedHospital(hospital);
    };

    const handleBack = () => {
        setSelectedHospital(null);
    };

    const isUpcoming = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        const nextDueDate = new Date(dateString);
        const daysUntil = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30 && daysUntil > 0;
    };

    const maintenanceColumns = [
        {
            title: 'Equipment Name',
            dataIndex: 'equipment_name',
            key: 'equipment_name',
            render: (text) => <Text strong>{text}</Text>,
            fixed: 'left',
            width: 180,
        },
        {
            title: 'Details',
            dataIndex: 'equipment_details',
            key: 'equipment_details',
            width: 250,
            responsive: ['md'],
            ellipsis: true,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            responsive: ['lg'],
            render: (text) => <Tag color="blue">{text}</Tag>,
            width: 120,
        },
        {
            title: 'Schedule',
            dataIndex: 'maintenance_schedule',
            key: 'maintenance_schedule',
            width: 140,
            render: (text) => <Tag color="green">{text}</Tag>,
        },
        {
            title: 'Next Due Date',
            dataIndex: 'next_due_date',
            key: 'next_due_date',
            width: 160,
            render: (date) => {
                const dateObj = new Date(date);
                const isLate = dateObj < new Date();
                const isSoon = isUpcoming(date);

                let color = 'default';
                let icon = null;
                if (isLate) {
                    color = 'red';
                    icon = <ExclamationCircleOutlined />;
                } else if (isSoon) {
                    color = 'orange';
                    icon = <WarningOutlined />;
                } else {
                    icon = <CheckCircleOutlined />;
                }

                return (
                    <Tag icon={icon} color={color}>
                        {dateObj.toLocaleDateString()}
                    </Tag>
                );
            },
            sorter: (a, b) => new Date(a.next_due_date) - new Date(b.next_due_date),
        },
        {
            title: 'Availability',
            dataIndex: 'is_available',
            key: 'is_available',
            width: 120,
            render: (isAvailable) => (
                <Tag color={isAvailable ? 'success' : 'red'}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                </Tag>
            ),
        },
        {
            title: 'Active Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 120,
            responsive: ['lg'],
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
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
                    options={uniqueCities.map((c) => ({ label: c, value: c }))}
                />
            </Space>
        </div>
    );
    
    const handleDownload = () => {
        if (filteredHospitals.length === 0) {
            message.info("No data to export.");
            return;
        }

        const dataToExport = filteredHospitals.flatMap(hospital =>
            hospital.equipment.map(equip => ({
                "Hospital Name": hospital.name,
                "City": hospital.city,
                "State": hospital.state,
                "Equipment Name": equip.equipment_name,
                "Category": equip.category,
                "Maintenance Schedule": equip.maintenance_schedule,
                "Next Due Date": new Date(equip.next_due_date).toLocaleDateString(),
                "Availability": equip.is_available ? 'Available' : 'Unavailable',
            }))
        );

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipment Maintenance");
        XLSX.writeFile(wb, "equipment_maintenance_schedule.xlsx");
        message.success("Data exported to Excel successfully!");
    };

    const getProgressColor = (upcomingPercentage) => {
        if (upcomingPercentage === 0) {
            return "#52c41a"; // Green for no upcoming maintenance
        } else if (upcomingPercentage < 25) {
            return "#ffc53d"; // Light orange for a few upcoming
        } else if (upcomingPercentage < 50) {
            return "#fa8c16"; // Darker orange for more upcoming
        } else {
            return "#f5222d"; // Red for high number of upcoming
        }
    };


    if (loading) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <Spin tip="Loading equipment data..." size="large" />
            </div>
        );
    }
    
    if (selectedHospital) {
        const hospitalEquipment = selectedHospital.equipment;
        const totalEquipment = hospitalEquipment.length;
        const upcomingMaintenance = hospitalEquipment.filter(item => isUpcoming(item.next_due_date)).length;

        return (
            <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0 }}>
                        <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Equipment Maintenance Schedule
                    </h2>
                    <Button onClick={handleBack} icon={<ArrowLeftOutlined />} type="default">
                        Back to Hospitals
                    </Button>
                </div>
                <Card
                    title={
                        <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Title level={4} style={{ margin: 0 }}>{selectedHospital.name}</Title>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                <EnvironmentOutlined /> {selectedHospital.city}, {selectedHospital.state}
                            </Text>
                        </Space>
                    }
                    extra={
                        <Space size="large">
                            <Text>Total Equipment: <Text strong>{totalEquipment}</Text></Text>
                            <Text>Upcoming Maintenance: <Text strong style={{ color: upcomingMaintenance > 0 ? '#faad14' : 'inherit' }}>{upcomingMaintenance}</Text></Text>
                        </Space>
                    }
                    bordered={false}
                    style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 20 }}
                >
                    <Table
                        dataSource={hospitalEquipment}
                        columns={maintenanceColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 20 }}>
                <HomeOutlined style={{ marginRight: 8 }} />
                Hospital Equipment Overview Dashboard
            </h2>
            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        >
                            <Statistic
                                title="Total Hospitals"
                                value={filteredHospitals.length}
                                prefix={<HomeOutlined />}
                            />
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
            {filteredHospitals.length === 0 ? (
                <Empty description="No hospitals found" />
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredHospitals.map((hospital) => {
                        const totalEquipment = hospital.equipment.length;
                        const upcomingMaintenance = hospital.equipment.filter(item => isUpcoming(item.next_due_date)).length;
                        const upcomingPercentage = totalEquipment > 0 ? (upcomingMaintenance / totalEquipment) * 100 : 0;
                        const progressPercentage = 100 - upcomingPercentage;
                        const progressColor = getProgressColor(upcomingPercentage);

                        return (
                            <Col xs={24} sm={12} md={8} lg={6} key={hospital.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                >
                                    <Card
                                        hoverable
                                        onClick={() => handleViewSchedule(hospital)}
                                        title={
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 40 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                    <Tooltip title={hospital.name}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.name}</span>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        }
                                        bordered
                                        style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 200 }}
                                        bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                    >
                                        <div style={{ flexGrow: 1 }}>
                                            <Space wrap style={{ marginBottom: 10 }}>
                                                {hospital.city && <Tag color="cyan">{hospital.city}</Tag>}
                                                {hospital.state && <Tag color="geekblue">{hospital.state}</Tag>}
                                            </Space>
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <Text>
                                                    <ToolOutlined style={{ marginRight: 8 }} />
                                                    Total Equipment: <Text strong>{totalEquipment}</Text>
                                                </Text>
                                                <Text type={upcomingMaintenance > 0 ? "danger" : "secondary"}>
                                                    <WarningOutlined style={{ marginRight: 8 }} />
                                                    Upcoming Maintenance: <Text strong>{upcomingMaintenance}</Text>
                                                </Text>
                                                {totalEquipment > 0 && (
                                                    <Progress
                                                        percent={progressPercentage}
                                                        size="small"
                                                        strokeColor={progressColor}
                                                        format={() => null}
                                                    />
                                                )}
                                            </Space>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
};

export default EquipmentMaintenanceCalendar;
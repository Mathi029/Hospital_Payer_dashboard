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
    Table
} from "antd";
import {
    EnvironmentOutlined,
    HomeOutlined,
    ArrowLeftOutlined,
    SearchOutlined,
    FilterOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    DownloadOutlined
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchHospitalProfile, fetchHospitalsForDashboard } from '../../../services/hospitalLocationService';
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

const { Search } = Input;

// Fix for default marker icon not appearing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A temporary geocoding service to generate coordinates for each hospital.
// This version uses a much larger offset to ensure each marker is clearly visible.
const geocodeAddress = (address, index) => {
    // Base coordinates are set to a central point in India to keep the map centered.
    const baseLat = 22.3072;
    const baseLng = 73.1812;

    // We generate a unique, noticeable offset for each hospital.
    // The offsets are multiplied by a larger number to spread the markers out.
    const latOffset = (index % 5) * 0.5;
    const lngOffset = Math.floor(index / 5) * 0.5;

    return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
};

const HospitalLocationPage = () => {
    const [hospitalLocations, setHospitalLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [viewMode, setViewMode] = useState('dashboard'); // Changed 'card' to 'dashboard'
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [mapLoading, setMapLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [cityFilter, setCityFilter] = useState("All");

    // Memoize the list of unique cities to prevent recalculation on every render
    const uniqueCities = useMemo(() => {
        const cities = new Set(hospitalLocations.map((item) => item.address_details?.city_town).filter(Boolean));
        return ["All", ...cities].sort();
    }, [hospitalLocations]);

    // Fetch all hospital locations on component mount
    useEffect(() => {
        const getHospitalData = async () => {
            try {
                setLoading(true);
                const locations = await fetchHospitalsForDashboard();
                const locationsWithCoords = locations.map((loc, index) => ({
                    ...loc,
                    coords: geocodeAddress(loc.full_address, index),
                }));
                setHospitalLocations(locationsWithCoords);
                message.success("Hospital data loaded successfully!");
            } catch (error) {
                console.error("Error fetching data:", error);
                message.error("Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };

        getHospitalData();
    }, []);

    // Memoize filtered data to prevent re-computation on every render
    const filteredData = useMemo(() => {
        let results = hospitalLocations;

        if (cityFilter !== "All") {
            results = results.filter((item) => item.address_details?.city_town === cityFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (item) =>
                    item.name?.toLowerCase().includes(term) ||
                    item.full_address?.toLowerCase().includes(term) ||
                    item.address_details?.city_town?.toLowerCase().includes(term) ||
                    item.address_details?.state?.toLowerCase().includes(term) ||
                    item.address_details?.district?.toLowerCase().includes(term)
            );
        }
        return results;
    }, [hospitalLocations, searchTerm, cityFilter]);

    const handleDownload = () => {
        if (filteredData.length === 0) {
            message.info("No data to export.");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(
            filteredData.map((item) => ({
                "Hospital Name": item.name,
                "Address": item.full_address,
                "City": item.address_details?.city_town,
                "District": item.address_details?.district,
                "State": item.address_details?.state,
                "Operational Beds": item.beds_operational,
                "Registered Beds": item.beds_registered
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hospital Locations");
        XLSX.writeFile(wb, "hospital_locations.xlsx");
        message.success("Data exported to Excel successfully!");
    };

    const fetchHospitalDetails = async (id) => {
        setMapLoading(true);
        try {
            const profile = await fetchHospitalProfile(id);
            setSelectedHospital(profile);
            const hospital = hospitalLocations.find(loc => loc.hospital_id === id);
            if (hospital && hospital.coords) {
                setMapCenter([hospital.coords.lat, hospital.coords.lng]);
            }
            setViewMode('map');
        } catch (error) {
            console.error("Error fetching hospital profile:", error);
            message.error("Failed to fetch hospital details.");
        } finally {
            setMapLoading(false);
        }
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
            title: "Hospital Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <b>{text}</b>,
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: "City",
            dataIndex: ["address_details", "city_town"],
            key: "city_town",
            sorter: (a, b) => (a.address_details?.city_town || '').localeCompare(b.address_details?.city_town || ''),
            render: (city) => (
                city ? <Tag color="cyan">{city}</Tag> : null
            ),
        },
        {
            title: "District",
            dataIndex: ["address_details", "district"],
            key: "district",
            sorter: (a, b) => (a.address_details?.district || '').localeCompare(b.address_details?.district || ''),
            responsive: ['md'],
            render: (district) => (
                district ? <Tag color="purple">{district}</Tag> : null
            ),
        },
        {
            title: "State",
            dataIndex: ["address_details", "state"],
            key: "state",
            sorter: (a, b) => (a.address_details?.state || '').localeCompare(b.address_details?.state || ''),
            responsive: ['md'],
            render: (state) => (
                state ? <Tag color="geekblue">{state}</Tag> : null
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Button
                    onClick={() => fetchHospitalDetails(record.hospital_id)}
                    icon={<EnvironmentOutlined />}
                    type="primary"
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                    View on Map
                </Button>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <Spin tip="Loading hospitals..." size="large" />
            </div>
        );
    }

    if (viewMode === 'dashboard' || viewMode === 'list') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 20 }}>
                    <HomeOutlined style={{ marginRight: 8 }} />
                    Hospital Locations Dashboard
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
                                    value={hospitalLocations.length}
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
                    <Button
                        onClick={() => setViewMode('map')}
                        icon={<EnvironmentOutlined />}
                        type="primary"
                    >
                        View All on Map
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        type="primary"
                    >
                        Export to Excel
                    </Button>
                </div>
                {filteredData.length === 0 ? (
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
                        {filteredData.map((hospital) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={hospital.hospital_id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                >
                                    <Card
                                        title={
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 40 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                    <Tooltip title={hospital.name}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.name}</span>
                                                    </Tooltip>
                                                </div>
                                                <Button
                                                    onClick={() => fetchHospitalDetails(hospital.hospital_id)}
                                                    icon={<EnvironmentOutlined />}
                                                    type="primary"
                                                    size="small"
                                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                                >
                                                    View on Map
                                                </Button>
                                            </div>
                                        }
                                        bordered
                                        hoverable
                                        style={{ borderRadius: 10, height: 200 }}
                                        bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                    >
                                        <div style={{ flexGrow: 1 }}>
                                            <p style={{ color: '#888' }}>{hospital.full_address}</p>
                                            <Space wrap style={{ marginTop: 10 }}>
                                                {hospital.address_details?.city_town && <Tag color="cyan">{hospital.address_details.city_town}</Tag>}
                                                {hospital.address_details?.district && <Tag color="purple">{hospital.address_details.district}</Tag>}
                                                {hospital.address_details?.state && <Tag color="geekblue">{hospital.address_details.state}</Tag>}
                                            </Space>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        );
    }

    // This part of the code renders when viewMode is 'map'
    return (
        <div style={{ padding: 20, minHeight: "100vh" }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    Hospital Locations on Map
                </h2>
                <Button
                    onClick={() => setViewMode('dashboard')}
                    icon={<ArrowLeftOutlined />}
                    type="default"
                >
                    Back to Dashboard
                </Button>
            </div>
            <Card
                bordered={false}
                style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                bodyStyle={{ padding: 0 }}
            >
                <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {mapLoading ? (
                        <Spin tip="Loading map..." size="large" />
                    ) : (
                        <MapContainer
                            key={mapCenter.toString()}
                            center={mapCenter}
                            zoom={mapCenter[0] === 20.5937 ? 5 : 13}
                            style={{ height: '600px', width: '100%', borderRadius: 10 }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {hospitalLocations.map((hospital) => (
                                <Marker
                                    key={hospital.hospital_id}
                                    position={[hospital.coords.lat, hospital.coords.lng]}
                                    eventHandlers={{
                                        click: () => fetchHospitalDetails(hospital.hospital_id),
                                    }}
                                >
                                    <Popup>
                                        <div className="font-sans">
                                            <h4 className="font-semibold text-lg">{hospital.name}</h4>
                                            <p className="text-sm text-gray-600 mb-2">
                                                <strong>Address:</strong> {hospital.full_address}
                                            </p>
                                            {selectedHospital && selectedHospital.id === hospital.hospital_id && (
                                                <div className="mt-2 text-sm">
                                                    <p><strong>Operational Beds:</strong> {selectedHospital.beds_operational}</p>
                                                    <p><strong>Registered Beds:</strong> {selectedHospital.beds_registered}</p>
                                                    <p className="mt-1">
                                                        <strong>Nearest Landmark:</strong> {hospital.address_details.nearest_landmark}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default HospitalLocationPage;
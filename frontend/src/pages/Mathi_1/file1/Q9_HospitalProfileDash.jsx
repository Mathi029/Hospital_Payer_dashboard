import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Input,
  Button,
  Row,
  Col,
  Descriptions,
  Table,
  Tag,
  Modal,
  Space,
  Select,
  message,
  Spin,
  Tooltip,
  Badge,
  Dropdown,
  Empty,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  HomeOutlined,
  FilterOutlined,
  LineChartOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { getAllHospitalsFullProfile } from "../../../services/hospitalProfileService";
import { motion } from "framer-motion";

const { Search } = Input;
const { Option } = Select;

// A utility function to safely normalize API responses to an array
function normalizeToArray(apiResp) {
  if (apiResp === null || apiResp === undefined) return [];
  const data = apiResp.data || apiResp;
  if (Array.isArray(data)) return data;
  if (typeof data === "object") return [data];
  return [];
}

const tagColors = [
  "#0d9488", "#0369a1", "#14b8a6", "#0284c7",
  "#10b981", "#2563eb", "#047857", "#1d4ed8",
];

const renderAddress = (addr) => {
  if (!addr) return "N/A";
  const addressParts = [
    addr.area_locality,
    addr.street,
    addr.city_town,
    addr.taluka,
    addr.district,
    addr.state,
    addr.pin_code,
    addr.nearest_landmark,
  ];
  return addressParts.filter(Boolean).join(", ");
};

export default function HospitalProfileDash() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ type: null, status: null, category: null });

  // Fetch all hospital data on component mount
  useEffect(() => {
    async function fetchHospitals() {
      setLoading(true);
      try {
        const res = await getAllHospitalsFullProfile();
        const arr = normalizeToArray(res);
        setHospitals(arr);
        message.success("Hospital data loaded successfully!");
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        message.error("Failed to load hospitals.");
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHospitals();
  }, []);

  const filteredHospitals = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return hospitals.filter((h) => {
      const matchesSearch =
        !lower ||
        (h.name?.toLowerCase() || "").includes(lower) ||
        (h.hospital_type?.toLowerCase() || "").includes(lower) ||
        (h.category?.toLowerCase() || "").includes(lower);

      const matchesType = !filters.type || (h.hospital_type === filters.type);
      const matchesStatus = !filters.status || (h.status === filters.status);
      const matchesCategory = !filters.category || (h.category === filters.category);

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
  }, [hospitals, searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleViewProfile = (hospital) => {
    setSelectedHospital(hospital);
    setModalVisible(true);
  };

  const exportToExcel = (data, filename = "export") => {
    if (!data.length) {
      message.warning("No data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportProfile = () => {
    if (!selectedHospital) return;
    const full = { ...selectedHospital };
    exportToExcel([full], `${selectedHospital.name || "hospital"}_profile`);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "hospital_type",
      key: "hospital_type",
      responsive: ["md"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val) => (
        val === "Active" ? <Tag color="green">{val}</Tag> : <Tag color="red">{val || "N/A"}</Tag>
      ),
      responsive: ["sm"],
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (val) => <Tag color="blue">{val || "N/A"}</Tag>,
    },
    {
      title: "Beds (Operational/Registered)",
      key: "beds",
      render: (record) => `${record.beds_operational ?? 0} / ${record.beds_registered ?? 0}`,
      responsive: ["lg"],
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewProfile(record)}
        >
          View Profile
        </Button>
      ),
    },
  ];

  const contactColumns = [
    { title: "Name", dataIndex: "person_name", key: "person_name" },
    { title: "Designation", dataIndex: "designation", key: "designation" },
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Mobile", dataIndex: "mobile", key: "mobile" },
    { title: "Email", dataIndex: "email", key: "email" },
  ];

  const activeFiltersCount = [filters.type, filters.status, filters.category].filter(Boolean).length;

  const filterMenu = (
    <div style={{ padding: 12, width: 200, backgroundColor: "#fff", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.15)" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <p style={{ margin: 0 }}>Filter by Type</p>
        <Select
          allowClear
          style={{ width: "100%" }}
          onChange={(val) => handleFilterChange("type", val)}
          value={filters.type}
        >
          {[...new Set(hospitals.map((h) => h.hospital_type).filter(Boolean))].map((t) => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <p style={{ margin: "8px 0 0" }}>Filter by Status</p>
        <Select
          allowClear
          style={{ width: "100%" }}
          onChange={(val) => handleFilterChange("status", val)}
          value={filters.status}
        >
          {[...new Set(hospitals.map((h) => h.status).filter(Boolean))].map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <p style={{ margin: "8px 0 0" }}>Filter by Category</p>
        <Select
          allowClear
          style={{ width: "100%" }}
          onChange={(val) => handleFilterChange("category", val)}
          value={filters.category}
        >
          {[...new Set(hospitals.map((h) => h.category).filter(Boolean))].map((c) => (
            <Option key={c} value={c}>{c}</Option>
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
        <HomeOutlined style={{ marginRight: 8 }} />
        Hospital Profiles Dashboard
      </h2>

      {/* Stats Card - Added to match DoctorBedRatioPage */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Total Hospitals Analyzed"
              value={hospitals.length}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Space wrap>
          <Search
            placeholder="Search hospitals..."
            onSearch={setSearchTerm}
            enterButton={<SearchOutlined />}
            allowClear
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
          <Dropdown overlay={filterMenu} trigger={["click"]}>
            <Badge count={activeFiltersCount} offset={[10, 0]}>
              <Button icon={<FilterOutlined />}>
                Filters
              </Button>
            </Badge>
          </Dropdown>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={() => exportToExcel(filteredHospitals, "Hospitals_Filtered")}
          >
            Export Current View
          </Button>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : filteredHospitals.length === 0 ? (
        <Empty description="No hospitals found matching your criteria." style={{ padding: 40 }} />
      ) : viewMode === "list" ? (
        <Table
          dataSource={filteredHospitals}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredHospitals.map((h, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={h.id}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  hoverable
                  style={{ borderRadius: 10, minHeight: 200 }} // Increased minHeight to fit the new button style
                  bodyStyle={{ padding: 16 }}
                >
                  <Card.Meta
                    title={
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                          <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                          <Tooltip title={h.name}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                          </Tooltip>
                        </div>
                      </>
                    }
                    description={
                      <>
                        <div style={{ marginTop: 8 }}>
                          <div><strong>Type:</strong> {h.hospital_type || "N/A"}</div>
                          <div><strong>Beds:</strong> {h.beds_operational ?? 0} / {h.beds_registered ?? 0}</div>
                          <div><strong>Category:</strong> <Tag color="blue">{h.category || "N/A"}</Tag></div>
                          <div style={{ textAlign: 'right', marginTop: 12 }}>
                            <Button
                              type="primary"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewProfile(h)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={selectedHospital?.name}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={1000}
        footer={
          <Space>
            <Button onClick={exportProfile} icon={<FileExcelOutlined />}>Export Profile (Excel)</Button>
            <Button type="primary" onClick={() => setModalVisible(false)}>Close</Button>
          </Space>
        }
      >
        {selectedHospital ? (
          <>
            <h3>General Information</h3>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              {Object.entries(selectedHospital).map(([k, v]) => {
                // Exclude specific nested objects and metadata
                if (["address", "contacts", "specialties", "created_at", "updated_at", "is_active", "id"].includes(k) || v === null || v === undefined) {
                  return null;
                }
                return (
                  <Descriptions.Item key={k} label={k.replace(/_/g, " ").toUpperCase()}>
                    {String(v)}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>
            
            <h3 style={{ marginTop: 24 }}>Addresses</h3>
            {selectedHospital.address ? (
              <div style={{ padding: "8px 16px", backgroundColor: "#f9f9f9", borderRadius: 8, marginBottom: 16 }}>
                <div>
                  <strong>{selectedHospital.address.address_type || "Address"}:</strong> {renderAddress(selectedHospital.address)}
                </div>
              </div>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No addresses available" />}

            <h3 style={{ marginTop: 24 }}>Contacts</h3>
            {selectedHospital.contacts && selectedHospital.contacts.length > 0 ? (
              <Table dataSource={selectedHospital.contacts} columns={contactColumns} rowKey="id" pagination={false} size="small" style={{ marginBottom: 16 }} />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No contacts available" />}

            <h3 style={{ marginTop: 24 }}>Specialties</h3>
            {selectedHospital.specialties && selectedHospital.specialties.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: 8 }}>
                {selectedHospital.specialties.map((s, i) => (
                  <Tooltip
                    key={s.id || i}
                    title={s.established_year ? `Established in ${s.established_year}` : "Year not available"}
                  >
                    <Tag
                      color={tagColors[i % tagColors.length]}
                      style={{ color: "#fff", fontWeight: "500", fontSize: "12px", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                    >
                      {s.specialty_name}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No specialties available" />}
          </>
        ) : (
          <Empty description="No profile data to display." />
        )}
      </Modal>
    </motion.div>
  );
}

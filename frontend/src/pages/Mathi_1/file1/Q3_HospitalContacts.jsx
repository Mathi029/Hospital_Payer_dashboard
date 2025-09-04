import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Input,
  Tag,
  Modal,
  Button,
  Tooltip,
  Dropdown,
  Menu,
  Badge,
  Select,
  Space
} from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  ContactsOutlined,
  UserOutlined,
  AimOutlined,
  FilterOutlined
} from "@ant-design/icons";
import { getHospitalContacts } from "../../../services/hospitalService";
import { motion } from "framer-motion";

const { Search } = Input;
const { Option } = Select;

const roleColors = {
  "TPA Coordinator": "purple",
  "Medical Director": "red",
  "Accounts Manager": "orange",
  "Emergency Contact": "volcano",
  "Administrator": "blue",
  "Insurance Manager": "green"
};

const Q3_HospitalContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHospitalContacts, setSelectedHospitalContacts] = useState([]);
  const [selectedHospitalName, setSelectedHospitalName] = useState("");
  const [selectedHospitalCity, setSelectedHospitalCity] = useState("");
  const [selectedHospitalState, setSelectedHospitalState] = useState("");
  const [cityFilter, setCityFilter] = useState("All");

  // Fetch and group contacts by hospital
  useEffect(() => {
    setLoading(true);
    getHospitalContacts()
      .then((res) => {
        const grouped = res.data.reduce((acc, c) => {
          const hospId = c.hospital_id;
          if (!acc[hospId]) {
            acc[hospId] = {
              hospital_id: hospId,
              hospital_name: c.hospital_name,
              city: c.city,
              state: c.state,
              contacts: []
            };
          }
          acc[hospId].contacts.push(c);
          return acc;
        }, {});
        const groupedArray = Object.values(grouped);
        setContacts(groupedArray);
        setFilteredHospitals(groupedArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching contacts:", err);
        setLoading(false);
      });
  }, []);

  // Unique roles and cities for filter dropdowns
  const uniqueRoles = ["All", ...new Set(contacts.flatMap((h) => h.contacts.map((c) => c.contact_type)))];
  const uniqueCities = ["All", ...new Set(contacts.map((h) => h.city).filter(Boolean))];

  // Apply filters and search
  useEffect(() => {
    let results = contacts;

    if (roleFilter && roleFilter !== "All") {
      results = results
        .map((h) => ({
          ...h,
          contacts: h.contacts.filter((c) => c.contact_type === roleFilter)
        }))
        .filter((h) => h.contacts.length > 0);
    }

    if (cityFilter && cityFilter !== "All") {
      results = results.filter((h) => h.city === cityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (h) =>
          h.hospital_name.toLowerCase().includes(term) ||
          h.city?.toLowerCase().includes(term) ||
          h.contacts.some(
            (c) =>
              c.person_name?.toLowerCase().includes(term) ||
              c.contact_type?.toLowerCase().includes(term)
          )
      );
    }

    setFilteredHospitals(results);
  }, [roleFilter, cityFilter, searchTerm, contacts]);

  const openContactsModal = (hospital) => {
    setSelectedHospitalContacts(hospital.contacts);
    setSelectedHospitalName(hospital.hospital_name);
    setSelectedHospitalCity(hospital.city);
    setSelectedHospitalState(hospital.state);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedHospitalContacts([]);
    setSelectedHospitalName("");
    setSelectedHospitalCity("");
    setSelectedHospitalState("");
  };

  const getMapLink = (city, state) => {
    if (!city && !state) return "";
    const query = encodeURIComponent(`${city || ""} ${state || ""}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Count active filters for badge
  const activeFiltersCount =
    (roleFilter !== "All" ? 1 : 0) + (cityFilter !== "All" ? 1 : 0);

  // Dropdown menu content for filters
  const filtersMenu = (
    <div
      style={{
        maxHeight: 250,
        overflowY: "auto",
        padding: 12,
        width: 240,
        backgroundColor: "#fff",
        borderRadius: 4,
        boxShadow: "0 3px 6px rgba(0,0,0,0.15)"
      }}
      onClick={e => e.stopPropagation()} // Prevent closing dropdown when clicking inside
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <label style={{ fontWeight: "bold" }}>Filter by Role</label>
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          style={{ width: "100%" }}
          options={uniqueRoles.map((role) => ({ label: role, value: role }))}
        />

        <label style={{ fontWeight: "bold", marginTop: 12 }}>Filter by City</label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: "100%" }}
          options={uniqueCities.map((city) => ({ label: city, value: city }))}
        />
      </Space>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>
        <ContactsOutlined style={{ marginRight: 8 }} />
        Hospital Contact Directory
      </h2>

      {/* Top bar: Search + Filters dropdown */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap"
        }}
      >
        <Search
          placeholder="Search hospitals, city, or contacts"
          allowClear
          enterButton={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 300, flexGrow: 1 }}
          size="middle"
        />

        <Dropdown
          overlay={filtersMenu}
          trigger={["click"]}
          placement="bottomRight"
          overlayStyle={{ zIndex: 1000 }}
        >
          <Badge count={activeFiltersCount} offset={[10, 0]}>
            <Button icon={<FilterOutlined />} type="default">
              Filters
            </Button>
          </Badge>
        </Dropdown>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : filteredHospitals.length === 0 ? (
        <Empty description="No hospitals found" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredHospitals.map((hospital, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={hospital.hospital_id}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  title={hospital.hospital_name}
                  bordered
                  hoverable
                  style={{
                    borderRadius: 10,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  extra={<EnvironmentOutlined />}
                >
                  <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <EnvironmentOutlined />
                    {hospital.city}, {hospital.state}
                  </p>

                  <Button
                    type="primary"
                    onClick={() => openContactsModal(hospital)}
                  >
                    See Contacts ({hospital.contacts.length})
                  </Button>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontWeight: "bold", fontSize: 18 }}>
              Contacts for {selectedHospitalName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                color: "#555"
              }}
            >
              <EnvironmentOutlined />
              <span>
                {selectedHospitalCity}, {selectedHospitalState}
              </span>
              {(selectedHospitalCity || selectedHospitalState) && (
                <Tooltip title="View location on map">
                  <Button
                    size="small"
                    type="default"
                    icon={<AimOutlined />}
                    onClick={() =>
                      window.open(
                        getMapLink(selectedHospitalCity, selectedHospitalState),
                        "_blank"
                      )
                    }
                  >
                    View Map
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        }
        visible={modalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="close" onClick={closeModal}>
            Close
          </Button>
        ]}
        bodyStyle={{ maxHeight: "60vh", overflowY: "auto" }}
      >
        {selectedHospitalContacts.length === 0 ? (
          <Empty description="No contacts found" />
        ) : (
          selectedHospitalContacts.map((c, i) => (
            <Card
              key={i}
              size="small"
              style={{ marginBottom: 8, borderRadius: 8, background: "#fafafa" }}
            >
              <Tag color={roleColors[c.contact_type] || "default"}>
                {c.contact_type}
              </Tag>
              <p>
                <UserOutlined /> {c.person_name}
              </p>
              <p>
                <strong>Designation:</strong> {c.designation}
              </p>
              <p>
                <PhoneOutlined /> {c.phone || "N/A"}
              </p>
              <p>
                <MailOutlined /> {c.email || "N/A"}
              </p>
            </Card>
          ))
        )}
      </Modal>
    </div>
  );
};

export default Q3_HospitalContacts;

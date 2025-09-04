import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Input,
  Select,
  Badge,
  Button,
  Dropdown,
  Space,
  Tag,
  Tooltip
} from "antd";
import {
  EnvironmentOutlined,
  SearchOutlined,
  FilterOutlined,
  MedicineBoxOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { getHospitalSpecialties } from "../../../services/hospitalService";
import { motion } from "framer-motion";

const { Search } = Input;

const Q7_MedicalSpecialties = () => {
  const [specialtiesData, setSpecialtiesData] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const tagColors = [
    "#0d9488", "#0369a1", "#14b8a6", "#0284c7",
    "#10b981", "#2563eb", "#047857", "#1d4ed8",
  ];

  useEffect(() => {
    setLoading(true);
    getHospitalSpecialties()
      .then((res) => {
        setSpecialtiesData(res.data);
        setFilteredHospitals(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching specialties:", err);
        setLoading(false);
      });
  }, []);

  const uniqueSpecialties = [
    "All",
    ...new Set(
      specialtiesData.flatMap((h) =>
        h.specialties.map((s) => s.specialty_name)
      )
    )
  ];
  const uniqueCities = [
    "All",
    ...new Set(specialtiesData.map((h) => h.city).filter(Boolean))
  ];

  useEffect(() => {
    let results = specialtiesData;

    if (specialtyFilter !== "All") {
      results = results.filter((h) =>
        h.specialties.some((s) => s.specialty_name === specialtyFilter)
      );
    }

    if (cityFilter !== "All") {
      results = results.filter((h) => h.city === cityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (h) =>
          h.hospital_name.toLowerCase().includes(term) ||
          h.city?.toLowerCase().includes(term) ||
          h.specialties.some((s) =>
            s.specialty_name.toLowerCase().includes(term)
          )
      );
    }

    setFilteredHospitals(results);
  }, [specialtyFilter, cityFilter, searchTerm, specialtiesData]);

  const activeFiltersCount =
    (specialtyFilter !== "All" ? 1 : 0) + (cityFilter !== "All" ? 1 : 0);

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
      onClick={(e) => e.stopPropagation()}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <label style={{ fontWeight: "bold" }}>Filter by Specialty</label>
        <Select
          value={specialtyFilter}
          onChange={setSpecialtyFilter}
          style={{ width: "100%" }}
          options={uniqueSpecialties.map((s) => ({ label: s, value: s }))}
        />

        <label style={{ fontWeight: "bold", marginTop: 12 }}>Filter by City</label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: "100%" }}
          options={uniqueCities.map((c) => ({ label: c, value: c }))}
        />
      </Space>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>
        <MedicineBoxOutlined style={{ marginRight: 8 }} />
        Medical Specialties
      </h2>

      {/* Search + Filters */}
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
          placeholder="Search hospitals, city, or specialties"
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
                    height: 380,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start"
                  }}
                  extra={<EnvironmentOutlined />}
                >
                  <p style={{ marginBottom: 4 }}>
                    <EnvironmentOutlined /> {hospital.city}, {hospital.state}
                  </p>
                  {hospital.established_year && (
                    <p style={{ marginBottom: 8, color: "#555" }}>
                      <CalendarOutlined /> Established: {hospital.established_year}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginTop: 4
                    }}
                  >
                    {hospital.specialties.map((s, i) => (
                      <Tooltip
                        key={i}
                        title={
                          s.established_year
                            ? `Established in ${s.established_year}`
                            : "Year not available"
                        }
                      >
                        <Tag
                          color={tagColors[i % tagColors.length]}
                          style={{
                            color: "#fff",
                            fontWeight: "500",
                            fontSize: "12px",
                            padding: "2px 6px",
                            borderRadius: 4,
                            cursor: "pointer"
                          }}
                        >
                          {s.specialty_name}
                        </Tag>
                      </Tooltip>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Q7_MedicalSpecialties;

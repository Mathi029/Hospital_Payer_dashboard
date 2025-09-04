import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  Dropdown,
  Badge,
  Select,
  Space
} from "antd";
import {
  SearchOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  FilterOutlined
} from "@ant-design/icons";
import { getHospitalsBasic } from "../../../services/hospitalService";

const { Search } = Input;
const { Option } = Select;

const Q1_HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");

  useEffect(() => {
    getHospitalsBasic()
      .then((res) => setHospitals(res.data))
      .catch((err) => console.error("Error fetching hospitals:", err))
      .finally(() => setLoading(false));
  }, []);

  const cityOptions = ["All", ...new Set(hospitals.map((h) => h.city))];
  const typeOptions = ["All", ...new Set(hospitals.map((h) => h.type))];

  const filteredHospitals = hospitals.filter((h) => {
    return (
      (typeFilter === "All" || h.type === typeFilter) &&
      (cityFilter === "All" || h.city === cityFilter) &&
      Object.values(h).some((val) =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  });

  const totalHospitals = filteredHospitals.length;
  const totalBeds = filteredHospitals.reduce(
    (sum, h) => sum + (h.beds || 0),
    0
  );

  const activeFiltersCount =
    (typeFilter !== "All" ? 1 : 0) + (cityFilter !== "All" ? 1 : 0);

  const filterMenu = (
    <div
      style={{
        padding: 12,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 10px rgba(0,0,0,0.12)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <label style={{ fontWeight: "bold" }}>Hospital Type</label>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: "100%" }}
        >
          {typeOptions.map((type, idx) => (
            <Option key={idx} value={type}>
              {type}
            </Option>
          ))}
        </Select>

        <label style={{ fontWeight: "bold", marginTop: 10 }}>City</label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: "100%" }}
        >
          {cityOptions.map((city, idx) => (
            <Option key={idx} value={city}>
              {city}
            </Option>
          ))}
        </Select>

        <Button
          type="link"
          style={{ padding: 0, marginTop: 8 }}
          onClick={() => {
            setTypeFilter("All");
            setCityFilter("All");
            setSearchText("");
          }}
        >
          Reset Filters
        </Button>
      </Space>
    </div>
  );

  const columns = [
    {
      title: "Hospital Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span style={{ fontWeight: "500" }}>
          <HomeOutlined style={{ color: "#1890ff", marginRight: 6 }} />
          {text}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        let color = "blue";
        if (type?.toLowerCase().includes("government")) color = "volcano";
        if (type?.toLowerCase().includes("super")) color = "purple";
        if (type?.toLowerCase().includes("district")) color = "green";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Beds",
      dataIndex: "beds",
      key: "beds",
      sorter: (a, b) => a.beds - b.beds,
      render: (beds) => (
        <Tooltip title="Total Operational Beds">
          <UsergroupAddOutlined style={{ color: "#52c41a", marginRight: 6 }} />
          {beds}
        </Tooltip>
      ),
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (city) => (
        <span>
          <EnvironmentOutlined style={{ color: "#fa8c16", marginRight: 6 }} />
          {city}
        </span>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: 20,
        background: "#f4f6f8",
        minHeight: "100vh",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <AppstoreOutlined style={{ color: "#1890ff", marginRight: 8 }} />
        Hospital List
      </h2>

      {/* Search + Filter moved to top */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <Search
          placeholder="Search hospitals, city, or type"
          allowClear
          enterButton={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            maxWidth: 300,
            flexGrow: 1,
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
          }}
          size="medium"
          className="custom-search"
        />

        <Dropdown overlay={filterMenu} trigger={["click"]}>
          <Badge count={activeFiltersCount} offset={[10, 0]}>
            <Button
              icon={<FilterOutlined />}
              style={{
                borderRadius: 50,
                padding: "0 16px",
                height: 40,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
              }}
            >
              Filters
            </Button>
          </Badge>
        </Dropdown>
      </div>

      {/* Summary Cards moved down */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h3>Total Hospitals</h3>
            <p style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>
              {totalHospitals}
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h3>Total Beds</h3>
            <p style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>
              {totalBeds}
            </p>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredHospitals}
        rowKey={(record, index) => index}
        loading={loading}
        bordered
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
        }}
        scroll={{ y: 450 }}
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      />
    </div>
  );
};

export default Q1_HospitalList;

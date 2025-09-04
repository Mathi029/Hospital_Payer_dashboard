import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  message,
  Empty,
  Tooltip,
  Modal,
  Row,
  Col,
  Statistic,
  Dropdown,
  Badge,
  Popover,
  Checkbox,
  List,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FilterOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { getEquipmentAvailabilityMatrix } from "../../../services/hospitalEquipmentService";

const { Search } = Input;
const { Option } = Select;

const EquipmentAnalysisPage = () => {
  // State variables for data, UI loading, and filtering
  const [data, setData] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [isCompareModalVisible, setIsCompareModalVisible] = useState(false);
  const [selectedHospitalsForComparison, setSelectedHospitalsForComparison] = useState([]);

  const uniqueCities = useMemo(() => {
    const cities = new Set(data.map((item) => item.city).filter(Boolean));
    return ["All", ...cities].sort();
  }, [data]);

  const uniqueEquipmentTypes = useMemo(() => {
    const equipmentList = new Set(equipmentTypes);
    return ["All", ...equipmentList].sort();
  }, [equipmentTypes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getEquipmentAvailabilityMatrix();
        setData(result.data);
        setEquipmentTypes(result.equipmentTypes);
        message.success("Equipment data loaded successfully!");
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to fetch equipment data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let results = data;
    const term = searchTerm.toLowerCase();

    if (cityFilter !== "All") {
      results = results.filter((item) => item.city === cityFilter);
    }
    if (equipmentFilter !== "All") {
      results = results.filter(
        (item) => item.equipment[equipmentFilter] && item.equipment[equipmentFilter] > 0
      );
    }
    if (searchTerm) {
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term) ||
          item.state?.toLowerCase().includes(term) ||
          item.district?.toLowerCase().includes(term)
      );
    }
    return results;
  }, [data, searchTerm, cityFilter, equipmentFilter]);

  const handleViewEquipment = (hospital) => {
    setSelectedHospital(hospital);
    setIsModalVisible(true);
  };

  const handleModalDownload = () => {
    if (!selectedHospital) {
      message.info("No data to export.");
      return;
    }
    const equipmentList = Object.keys(selectedHospital.equipment)
      .filter((key) => selectedHospital.equipment[key] > 0)
      .map((key) => ({
        "Hospital Name": selectedHospital.name,
        Equipment: key,
        Quantity: selectedHospital.equipment[key],
      }));

    const ws = XLSX.utils.json_to_sheet(equipmentList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedHospital.name}_Equipment`);
    XLSX.writeFile(wb, `${selectedHospital.name}_equipment.xlsx`);
    message.success(`Equipment data for ${selectedHospital.name} exported.`);
  };

  const handleDownload = () => {
    if (filteredData.length === 0) {
      message.info("No data to export.");
      return;
    }
    const exportData = filteredData.map((item) => {
      const row = {
        "Hospital Name": item.name,
        City: item.city,
        District: item.district,
        State: item.state,
      };
      equipmentTypes.forEach((type) => {
        row[type] = item.equipment[type] ? `${item.equipment[type]} units` : "Not Available";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipment Availability");
    XLSX.writeFile(wb, "hospital_equipment_availability.xlsx");
    message.success("All data exported to Excel successfully!");
  };

  const handleToggleComparison = (hospital) => {
    setSelectedHospitalsForComparison((prevSelected) => {
      const isSelected = prevSelected.some((h) => h.id === hospital.id);
      if (isSelected) {
        return prevSelected.filter((h) => h.id !== hospital.id);
      } else {
        if (prevSelected.length >= 4) {
          message.warning("You can only compare up to 4 hospitals at a time.");
          return prevSelected;
        }
        return [...prevSelected, hospital];
      }
    });
  };

  const handleCompare = () => {
    if (selectedHospitalsForComparison.length < 2) {
      message.warning("Please select at least 2 hospitals to compare.");
      return;
    }
    setIsCompareModalVisible(true);
  };

  const comparisonColumns = useMemo(() => {
    if (selectedHospitalsForComparison.length === 0) return [];
    const baseColumns = [{
      title: "Equipment",
      dataIndex: "equipment_name",
      key: "equipment_name",
      fixed: "left",
      width: 150,
      render: (text) => <b>{text}</b>,
    }];
    const hospitalColumns = selectedHospitalsForComparison.map(hospital => ({
      title: (
        <Space>
          <Tooltip title={hospital.name}>
            <span>{hospital.name}</span>
          </Tooltip>
          <Button
            type="text"
            icon={<MinusCircleOutlined />}
            size="small"
            onClick={() => handleToggleComparison(hospital)}
            danger
          />
        </Space>
      ),
      dataIndex: hospital.id,
      key: hospital.id,
      align: 'center',
      width: 120,
      render: (count) => (
        count > 0 ? (
          <Tooltip title={`${count} available`}>
            <Tag color="green" icon={<CheckCircleOutlined />}>
              {count}
            </Tag>
          </Tooltip>
        ) : (
          <Tooltip title="Not available">
            <Tag color="red" icon={<CloseCircleOutlined />} />
          </Tooltip>
        )
      ),
    }));
    return [...baseColumns, ...hospitalColumns];
  }, [selectedHospitalsForComparison]);

  const comparisonDataSource = useMemo(() => {
    const allEquipment = new Set();
    selectedHospitalsForComparison.forEach(hospital => {
      Object.keys(hospital.equipment).forEach(eq => allEquipment.add(eq));
    });

    return Array.from(allEquipment).sort().map(eqType => {
      const row = {
        key: eqType,
        equipment_name: eqType,
      };
      selectedHospitalsForComparison.forEach(hospital => {
        row[hospital.id] = hospital.equipment[eqType] || 0;
      });
      return row;
    });
  }, [selectedHospitalsForComparison]);

  const columns = [
    {
      title: "Hospital Name",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 250,
      render: (text, record) => (
        <Tooltip title={`Select for comparison`}>
          <Checkbox
            checked={selectedHospitalsForComparison.some((h) => h.id === record.id)}
            onChange={() => handleToggleComparison(record)}
            style={{ marginRight: 8 }}
          />
          <b>{text}</b>
        </Tooltip>
      ),
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      width: 120,
      render: (text) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: 120,
    },
    ...equipmentTypes.map((type) => ({
      title: type,
      dataIndex: ["equipment", type],
      key: type,
      align: "center",
      width: 100,
      render: (count) =>
        count > 0 ? (
          <Tooltip title={`${count} available`}>
            <Tag color="green" icon={<CheckCircleOutlined />}>
              {count}
            </Tag>
          </Tooltip>
        ) : (
          <Tooltip title="Not available">
            <Tag color="red" icon={<CloseCircleOutlined />} />
          </Tooltip>
        ),
    })),
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => handleViewEquipment(record)}>
          View
        </Button>
      ),
    },
  ];

  const totalHospitals = filteredData.length;
  const activeFiltersCount =
    (cityFilter !== 'All' ? 1 : 0) + (equipmentFilter !== 'All' ? 1 : 0);

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
        <label style={{ fontWeight: "bold" }}>Filter by City</label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: "100%" }}
          options={uniqueCities.map((c) => ({ label: c, value: c }))}
        />
        <label style={{ fontWeight: "bold", marginTop: 8 }}>Filter by Equipment</label>
        <Select
          value={equipmentFilter}
          onChange={setEquipmentFilter}
          style={{ width: "100%" }}
          placeholder="Select equipment"
          options={uniqueEquipmentTypes.map((e) => ({ label: e, value: e }))}
        />
      </Space>
    </div>
  );

  const comparisonOverlay = (
    <div style={{ padding: 16, maxWidth: 300 }}>
      <List
        size="small"
        header={<div>Selected Hospitals ({selectedHospitalsForComparison.length}/4)</div>}
        bordered
        dataSource={selectedHospitalsForComparison}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Tooltip title="Remove">
                <Button
                  icon={<MinusCircleOutlined />}
                  size="small"
                  type="text"
                  danger
                  onClick={() => handleToggleComparison(item)}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              title={<Tooltip title={item.name}>{item.name}</Tooltip>}
              description={<Tag color="cyan">{item.city}</Tag>}
            />
          </List.Item>
        )}
        style={{ marginBottom: 16 }}
      />
      <Button
        onClick={handleCompare}
        type="primary"
        block
        disabled={selectedHospitalsForComparison.length < 2}
        icon={<BarChartOutlined />}
      >
        Compare
      </Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 20, backgroundColor: "#f0f2f5", minHeight: "100vh" }}
    >
      <h2 style={{ marginBottom: 20, color: "#2c3e50", fontWeight: 600 }}>
        <LineChartOutlined style={{ marginRight: 8, fontSize: "1.2em" }} />
        Hospital Equipment Analysis 📊
      </h2>

      {/* Summary Card - Only Total Hospitals */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}
          >
            <Statistic
              title="Total Hospitals"
              value={totalHospitals}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <Search
            placeholder="Search hospitals, city, state"
            allowClear
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 300, minWidth: 200 }}
          />
          <Space wrap>
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
            <Popover
              content={comparisonOverlay}
              trigger="click"
              placement="bottom"
            >
              <Badge count={selectedHospitalsForComparison.length}>
                <Button
                  icon={<BarChartOutlined />}
                  type="default"
                >
                  Compare Hospitals
                </Button>
              </Badge>
            </Popover>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              type="primary"
            >
              Export All Data
            </Button>
          </Space>
        </div>

        {loading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Loading data..." />
        ) : filteredData.length === 0 ? (
          <Empty description="No hospitals found with the current filters." />
        ) : viewMode === "card" ? (
          <Row gutter={[16, 16]}>
            {filteredData.map((hospital, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={hospital.id}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    hoverable
                    style={{
                      borderRadius: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      height: 180,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    bodyStyle={{ padding: "16px" }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: "bold",
                        }}
                      >
                        <Tooltip title={hospital.name}>
                          <Checkbox
                            checked={selectedHospitalsForComparison.some((h) => h.id === hospital.id)}
                            onChange={() => handleToggleComparison(hospital)}
                            style={{ marginRight: 8 }}
                          />
                          {hospital.name}
                        </Tooltip>
                      </h4>
                      <div style={{ marginTop: 8 }}>
                        {hospital.city && (
                          <Tag icon={<EnvironmentOutlined />} color="cyan">
                            {hospital.city}
                          </Tag>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 16,
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#888" }}>
                        {Object.values(hospital.equipment).filter(Boolean).length} Equipment Types
                      </span>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewEquipment(hospital)}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>

      {/* Modal for Viewing Equipment Details */}
      <Modal
        title={selectedHospital?.name ? `Equipment for ${selectedHospital.name}` : "Equipment Details"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={handleModalDownload}
            icon={<DownloadOutlined />}
          >
            Download Equipment List
          </Button>,
        ]}
        width={800}
      >
        {selectedHospital && (
          <Table
            columns={[
              { title: "Equipment Name", dataIndex: "equipment_name", key: "equipment_name" },
              { title: "Quantity", dataIndex: "quantity", key: "quantity", align: "center" },
            ]}
            dataSource={Object.keys(selectedHospital.equipment)
              .filter((key) => selectedHospital.equipment[key] > 0)
              .map((key) => ({
                key,
                equipment_name: key,
                quantity: selectedHospital.equipment[key],
              }))}
            pagination={false}
            rowKey="equipment_name"
          />
        )}
      </Modal>

      {/* Modal for Cross-Hospital Comparison */}
      <Modal
        title="Cross-Hospital Equipment Comparison"
        open={isCompareModalVisible}
        onCancel={() => setIsCompareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsCompareModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        <Table
          dataSource={comparisonDataSource}
          columns={comparisonColumns}
          rowKey="equipment_name"
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: <Empty description="No hospitals selected for comparison." /> }}
        />
      </Modal>
    </motion.div>
  );
};

export default EquipmentAnalysisPage;
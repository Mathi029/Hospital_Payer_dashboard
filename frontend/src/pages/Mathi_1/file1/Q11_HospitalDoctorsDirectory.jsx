import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Modal,
  Button,
  Spin,
  Input,
  Select,
  Space,
  Tooltip,
  message,
  Row,
  Col,
  Statistic,
  Empty,
  Badge,
  Tag,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  UsergroupAddOutlined,
  GlobalOutlined,
  BarChartOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { HospitalDoctorsDirectoryService } from '../../../services/hospitalDoctorsDirectoryService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  LabelList,
} from 'recharts';
import { motion } from 'framer-motion';

const { Search } = Input;
const { Option } = Select;

const Q11_HospitalDoctorsDirectory = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDoctorModalVisible, setIsDoctorModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('All');
  const [allSpecialties, setAllSpecialties] = useState([]);
  const [selectedState, setSelectedState] = useState('All');
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await HospitalDoctorsDirectoryService.getHospitalsSummary();
        setHospitals(data);
        message.success('Hospital summary data loaded successfully!');
      } catch (error) {
        message.error('Failed to load data. Please check the backend connection.');
        console.error('Error fetching hospital summary:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchAndShowDoctors = async (hospitalId) => {
    const hospital = hospitals.find((h) => h.id === hospitalId);
    if (!hospital) return;
    setSelectedHospital(hospital);
    setLoadingDoctors(true);
    try {
      const doctorsData = await HospitalDoctorsDirectoryService.getDoctorsByHospital(hospitalId);
      setDoctors(doctorsData);
      const uniqueSpecialties = [...new Set(doctorsData.map((d) => d.specialty_name))].sort();
      setAllSpecialties(uniqueSpecialties);
      setIsDoctorModalVisible(true);
    } catch (error) {
      message.error('Failed to load doctors for this hospital.');
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const uniqueStates = useMemo(() => {
    const states = new Set(hospitals.map((item) => item.address?.state).filter(Boolean));
    return ["All", ...states].sort();
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    let results = hospitals;
    const term = searchTerm.toLowerCase();

    if (selectedState !== "All") {
      results = results.filter((item) => item.address?.state === selectedState);
    }

    if (term) {
      results = results.filter(
        (h) =>
          h.name?.toLowerCase().includes(term) ||
          h.address?.city_town?.toLowerCase().includes(term) ||
          h.address?.state?.toLowerCase().includes(term)
      );
    }
    return results;
  }, [hospitals, searchTerm, selectedState]);

  const filteredDoctors = useMemo(() => {
    let result = doctors;
    const term = searchTerm.toLowerCase();
    if (term) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.designation.toLowerCase().includes(term) ||
          d.specialty_name.toLowerCase().includes(term)
      );
    }
    if (searchSpecialty !== 'All') {
      result = result.filter((d) => d.specialty_name === searchSpecialty);
    }
    return result;
  }, [doctors, searchTerm, searchSpecialty]);

  const top5Hospitals = useMemo(() => {
    return [...hospitals]
      .sort((a, b) => b.total_doctors - a.total_doctors)
      .slice(0, 5);
  }, [hospitals]);

  const handleDownloadExcel = () => {
    if (filteredDoctors.length === 0) {
      message.info('No doctors to export.');
      return;
    }
    const dataToExport = filteredDoctors.map((doc) => ({
      'Doctor Name': doc.name,
      'Specialty': doc.specialty_name,
      'Designation': doc.designation,
      'Qualification': doc.qualification,
      'Experience (Years)': doc.experience_years,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
    XLSX.writeFile(wb, `Doctors_of_${selectedHospital.name}.xlsx`);
    message.success('Doctor list exported to Excel successfully!');
  };

  const tableColumns = [
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <span>
          {address?.street}, {address?.city_town}, {address?.state}
        </span>
      ),
    },
    {
      title: 'Total Doctors',
      dataIndex: 'total_doctors',
      key: 'total_doctors',
      sorter: (a, b) => a.total_doctors - b.total_doctors,
      render: (count) => (
        <Tag color={count > 50 ? 'green' : count > 20 ? 'blue' : 'geekblue'}>
          {count} Doctors
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => fetchAndShowDoctors(record.id)}
          icon={<UsergroupAddOutlined />}
        >
          View All Doctors
        </Button>
      ),
    },
  ];

  const doctorTableColumns = [
    {
      title: 'Doctor Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Specialty',
      dataIndex: 'specialty_name',
      key: 'specialty_name',
      sorter: (a, b) => a.specialty_name.localeCompare(b.specialty_name),
      render: (specialty) => <Tag color="cyan">{specialty}</Tag>,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Experience (Years)',
      dataIndex: 'experience_years',
      key: 'experience_years',
      sorter: (a, b) => a.experience_years - b.experience_years,
    },
  ];

  const activeFiltersCount = (selectedState !== 'All' ? 1 : 0);

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
        <label style={{ fontWeight: "bold" }}>Filter by State</label>
        <Select
          value={selectedState}
          onChange={setSelectedState}
          style={{ width: "100%" }}
          options={uniqueStates.map((s) => ({ label: s, value: s }))}
        />
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
        <GlobalOutlined style={{ marginRight: 8 }} />
        Hospital Doctor Directory
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 20 }}>Loading hospital data...</p>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} md={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Statistic
                  title="Total Hospitals"
                  value={filteredHospitals.length}
                  prefix={<UsergroupAddOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={16}>
              <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h4>Top Hospitals by Doctor Count</h4>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Button
                    type="primary"
                    icon={<BarChartOutlined />}
                    onClick={() => setIsChartModalVisible(true)}
                  >
                    View Top Hospitals Chart
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>

          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, justifyContent: "flex-start", alignItems: "center" }}>
              <Search
                placeholder="Search hospitals by name, city, or state..."
                allowClear
                enterButton={<SearchOutlined />}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: 400, flexGrow: 1 }}
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
            </div>
            {filteredHospitals.length === 0 ? (
              <Empty description="No hospitals found." />
            ) : (
              <Table
                rowKey="id"
                dataSource={filteredHospitals}
                columns={tableColumns}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </>
      )}

      {/* Doctor List Modal */}
      <Modal
        title={selectedHospital ? `Doctors at ${selectedHospital.name}` : 'Doctors'}
        visible={isDoctorModalVisible}
        onCancel={() => {
          setIsDoctorModalVisible(false);
          setSearchTerm('');
          setSearchSpecialty('All');
        }}
        width={1000}
        footer={null}
      >
        <Space style={{ marginBottom: 16, width: '100%' }}>
          <Search
            placeholder="Search doctors by name or designation..."
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            style={{ width: 200 }}
            value={searchSpecialty}
            onChange={setSearchSpecialty}
            placeholder="Filter by Specialty"
          >
            <Option value="All">All Specialties</Option>
            {allSpecialties.map((specialty) => (
              <Option key={specialty} value={specialty}>
                {specialty}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadExcel}
          >
            Download as Excel
          </Button>
        </Space>

        {loadingDoctors ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Empty description="No doctors found for this hospital with the applied filters." />
        ) : (
          <Table
            rowKey="id"
            dataSource={filteredDoctors}
            columns={doctorTableColumns}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Modal>

      {/* Vertical Chart Modal */}
      <Modal
        title="Top 5 Hospitals by Doctor Count"
        visible={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        width={700}
        footer={null}
      >
        {top5Hospitals.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5Hospitals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis />
              <ChartTooltip />
              <Bar dataKey="total_doctors" fill="#82ca9d">
                <LabelList dataKey="total_doctors" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No chart data" style={{ height: 300 }} />
        )}
      </Modal>
    </motion.div>
  );
};

export default Q11_HospitalDoctorsDirectory;
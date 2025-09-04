// frontend/src/pages/DoctorBedRatioPage.jsx



import React, { useState, useEffect, useMemo } from "react";

import {

  Card,

  Table,

  Progress,

  Input,

  Select,

  Button,

  Space,

  Badge,

  Dropdown,

  Tooltip,

  Tag,

  Row,

  Col,

  Statistic,

  message,

  Empty,

  Modal,

} from "antd";

import {

  SearchOutlined,

  FilterOutlined,

  DownloadOutlined,

  LineChartOutlined,

  UserOutlined,

  HomeOutlined,

  AppstoreOutlined,

  UnorderedListOutlined,

  EnvironmentOutlined,

  BarChartOutlined,

} from "@ant-design/icons";

import { getMergedDoctorToBedRatio } from "../../../services/hospitalMetricsService";

import { motion } from "framer-motion";

import * as XLSX from "xlsx";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, LabelList } from 'recharts';



const { Search } = Input;



const DoctorBedRatioPage = () => {

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [cityFilter, setCityFilter] = useState("All");

  const [viewMode, setViewMode] = useState("card");

  const [isChartModalVisible, setIsChartModalVisible] = useState(false);



  // Memoize the list of unique cities to prevent recalculation on every render

  const uniqueCities = useMemo(() => {

    const cities = new Set(data.map((item) => item.city).filter(Boolean));

    return ["All", ...cities].sort();

  }, [data]);



  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);

        const metrics = await getMergedDoctorToBedRatio();

        setData(metrics);

        message.success("Data loaded successfully!");

      } catch (error) {

        console.error("Error fetching data:", error);

        message.error("Failed to fetch data. Please check the network connection.");

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, []); // Empty dependency array ensures this effect runs only once on mount



  // Memoize filtered data to prevent re-computation on every render

  const filteredData = useMemo(() => {

    let results = data;



    if (cityFilter !== "All") {

      results = results.filter((item) => item.city === cityFilter);

    }



    if (searchTerm) {

      const term = searchTerm.toLowerCase();

      results = results.filter(

        (item) =>

          item.hospital_name?.toLowerCase().includes(term) ||

          item.city?.toLowerCase().includes(term) ||

          item.state?.toLowerCase().includes(term) ||

          item.district?.toLowerCase().includes(term)

      );

    }

    return results;

  }, [data, searchTerm, cityFilter]);



  // Memoize top hospitals for the chart to improve chart rendering performance

  const topHospitalsForChart = useMemo(() => {

    return filteredData.slice(0, 5).sort((a, b) => (b.doctor_bed_ratio ?? 0) - (a.doctor_bed_ratio ?? 0));

  }, [filteredData]);



  const handleDownload = () => {

    if (filteredData.length === 0) {

        message.info("No data to export.");

        return;

    }

    const ws = XLSX.utils.json_to_sheet(

      filteredData.map((item) => ({

        Rank: item.rank,

        "Hospital Name": item.hospital_name,

        "City": item.city,

        "District": item.district,

        "State": item.state,

        "Total Doctors": item.total_doctors,

        "Total Beds": item.total_beds,

        "Doctor-Bed Ratio": item.doctor_bed_ratio ? item.doctor_bed_ratio.toFixed(2) : 'N/A',

      }))

    );

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Doctor-Bed Ratio");

    XLSX.writeFile(wb, "doctor_bed_ratio.xlsx");

    message.success("Data exported to Excel successfully!");

  };



  const columns = [

    {

      title: "Rank",

      dataIndex: "rank",

      key: "rank",

      sorter: (a, b) => a.rank - b.rank,

      width: 80,

    },

    {

      title: "Hospital Name",

      dataIndex: "hospital_name",

      key: "hospital_name",

      render: (text) => <b>{text}</b>,

    },

    {

      title: "City",

      dataIndex: "city",

      key: "city",

      sorter: (a, b) => (a.city || '').localeCompare(b.city || ''),

      render: (city) => (

        city ? <Tag color="cyan">{city}</Tag> : null

      ),

    },

    {

      title: "District",

      dataIndex: "district",

      key: "district",

      sorter: (a, b) => (a.district || '').localeCompare(b.district || ''),

      responsive: ['md'],

      render: (district) => (

        district ? <Tag color="purple">{district}</Tag> : null

      ),

    },

    {

      title: "State",

      dataIndex: "state",

      key: "state",

      sorter: (a, b) => (a.state || '').localeCompare(b.state || ''),

      responsive: ['md'],

      render: (state) => (

        state ? <Tag color="geekblue">{state}</Tag> : null

      ),

    },

    {

      title: "Total Doctors",

      dataIndex: "total_doctors",

      key: "total_doctors",

      sorter: (a, b) => a.total_doctors - b.total_doctors,

      responsive: ["lg"],

    },

    {

      title: "Total Beds",

      dataIndex: "total_beds",

      key: "total_beds",

      sorter: (a, b) => a.total_beds - b.total_beds,

      responsive: ["lg"],

    },

    {

      title: "Doctor-Bed Ratio",

      dataIndex: "doctor_bed_ratio",

      key: "doctor_bed_ratio",

      sorter: (a, b) => a.doctor_bed_ratio - b.doctor_bed_ratio,

      render: (ratio) => (

        <Progress

          percent={Math.min((ratio ?? 0) * 100, 100)}

          size="small"

          strokeColor={{

            "0%": "#108ee9",

            "100%": "#87d068",

          }}

          format={(percent) => (

            <span style={{ whiteSpace: "nowrap" }}>

              {ratio !== null ? ratio.toFixed(2) : 'N/A'}:1

            </span>

          )}

        />

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



  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.5 }}

      style={{ padding: 20 }}

    >

      <h2 style={{ marginBottom: 20 }}>

        <LineChartOutlined style={{ marginRight: 8 }} />

        Doctor-to-Bed Ratio Comparison

      </h2>



      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>

        <Col xs={24} md={12} lg={8}>

          <Card

            bordered={false}

            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}

          >

            <Statistic

              title="Total Hospitals Analyzed"

              value={data.length}

              prefix={<HomeOutlined />}

            />

          </Card>

        </Col>

        <Col xs={24} md={12} lg={8}>

          <Card

            bordered={false}

            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}

          >

            <Statistic

              title="Average Doctor-Bed Ratio"

              value={data.length > 0 ? (data.reduce((sum, item) => sum + (item.doctor_bed_ratio ?? 0), 0) / data.length).toFixed(2) : 0}

              prefix={<UserOutlined />}

            />

          </Card>

        </Col>

        <Col xs={24} md={24} lg={8}>

          <Card

            bordered={false}

            style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}

          >

            <Button

              type="primary"

              icon={<BarChartOutlined />}

              onClick={() => setIsChartModalVisible(true)}

              style={{ padding: '0 24px', height: '40px' }}

            >

              View Top Hospital Ratios

            </Button>

          </Card>

        </Col>

      </Row>



      <Card

        bordered={false}

        style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}

      >

        <div

          style={{

            display: "flex",

            flexWrap: "wrap",

            gap: 12,

            marginBottom: 20,

            justifyContent: "flex-start", // Moved buttons to the left

            alignItems: "center",

          }}

        >

          <Search

            placeholder="Search hospitals, city, district or state"

            allowClear

            enterButton={<SearchOutlined />}

            onChange={(e) => setSearchTerm(e.target.value)}

            style={{ maxWidth: 300, flexGrow: 1 }}

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

            <Button

              icon={<DownloadOutlined />}

              onClick={handleDownload}

              type="primary"

            >

              Export to Excel

            </Button>

          </Space>

        </div>



        {loading ? (

          <div style={{ textAlign: "center", padding: "50px 0" }}>

            <motion.div

              initial={{ rotate: 0 }}

              animate={{ rotate: 360 }}

              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}

              style={{ display: "inline-block" }}

            >

              <UserOutlined style={{ fontSize: "50px", color: "#1890ff" }} />

            </motion.div>

          </div>

        ) : filteredData.length === 0 ? (

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

            {filteredData.map((hospital, index) => (

              <Col xs={24} sm={12} md={8} lg={6} key={hospital.hospital_id}>

                <motion.div

                  initial={{ opacity: 0, y: 15 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{ duration: 0.3, delay: index * 0.05 }}

                >

                  <Card

                    title={

                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>

                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />

                        <Tooltip title={`${hospital.hospital_name}${hospital.city ? `, ${hospital.city}` : ''}${hospital.district ? `, ${hospital.district}` : ''}${hospital.state ? `, ${hospital.state}` : ''}`}>

                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.hospital_name}</span>

                        </Tooltip>

                      </div>

                    }

                    bordered

                    hoverable

                    style={{

                      borderRadius: 10,

                      height: 200,

                      display: "flex",

                      flexDirection: "column",

                      justifyContent: "space-between",

                      padding: 0

                    }}

                    bodyStyle={{ padding: '16px' }}

                  >

                    <div style={{ flexGrow: 1 }}>

                      <p style={{ margin: 0, color: '#888' }}>

                        {hospital.city && <Tag color="cyan">{hospital.city}</Tag>}

                        {hospital.district && <Tag color="purple">{hospital.district}</Tag>}

                        {hospital.state && <Tag color="geekblue">{hospital.state}</Tag>}

                      </p>

                      <Space direction="vertical" style={{ width: '100%', marginTop: '12px' }}>

                        <Progress

                          percent={Math.min((hospital.doctor_bed_ratio ?? 0) * 100, 100)}

                          size="small"

                          showInfo={false}

                          strokeColor="#87d068"

                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>

                          <span>Doctors: {hospital.total_doctors ?? 'N/A'}</span>

                          <span>Beds: {hospital.total_beds ?? 'N/A'}</span>

                        </div>

                      </Space>

                    </div>

                    <div style={{ textAlign: "right", marginTop: '8px' }}>

                      <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>

                        Ratio: {hospital.doctor_bed_ratio !== null ? hospital.doctor_bed_ratio.toFixed(2) : 'N/A'}:1

                      </Tag>

                    </div>

                  </Card>

                </motion.div>

              </Col>

            ))}

          </Row>

        )}

      </Card>



      <Modal

        title="Top 5 Hospitals by Doctor-Bed Ratio"

        visible={isChartModalVisible}

        onCancel={() => setIsChartModalVisible(false)}

        footer={null}

        width={700}

      >

        <div style={{ marginTop: 20, padding: 10 }}>

          {topHospitalsForChart.length > 0 ? (

            <ResponsiveContainer width="100%" height={300}>

              <BarChart

                data={topHospitalsForChart}

                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}

              >

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="hospital_name" angle={-45} textAnchor="end" height={80} interval={0} />

                <YAxis />

                <ChartTooltip formatter={(value) => [`${value.toFixed(2)}:1`, 'Ratio']} />

                <Bar dataKey="doctor_bed_ratio" fill="#1890ff">

                    <LabelList

                        dataKey="doctor_bed_ratio"

                        position="top"

                        formatter={(value) => `${value.toFixed(2)}:1`}

                        style={{ fontSize: 12, fill: '#666' }}

                    />

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <Empty description="No chart data available." />

          )}

        </div>

      </Modal>

    </motion.div>

  );

};



export default DoctorBedRatioPage;
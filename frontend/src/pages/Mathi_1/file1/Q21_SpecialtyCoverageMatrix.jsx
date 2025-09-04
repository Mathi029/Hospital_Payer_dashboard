import React, { useState, useEffect, useMemo } from 'react';
import { Card, Spin, Table, Tooltip, message, Row, Col, Input, Select, Badge, Button, Dropdown, Space, Statistic, Empty } from 'antd';
import {
  HeatMapOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { SpecialtyCoverageMatrixService } from '../../../services/SpecialtyCoverageMatrixService';

const { Search } = Input;
const { Option } = Select;

const Q21_SpecialtyCoverageMatrix = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        setLoading(true);
        const matrixData = await SpecialtyCoverageMatrixService.getSpecialtyCoverageMatrix();
        setData(matrixData);
        message.success('Specialty coverage matrix loaded successfully!');
      } catch (error) {
        message.error('Failed to load specialty coverage data.');
        console.error('Error fetching matrix data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrixData();
  }, []);

  const getHeatmapColumns = (specialties) => {
    return specialties.map(specialty => ({
      title: specialty,
      dataIndex: ['coverage', specialty],
      key: specialty,
      align: 'center',
      render: (isAvailable) => (
        <Tooltip title={isAvailable ? 'Available' : 'Not Available'}>
          <div
            className="coverage-cell"
            style={{ backgroundColor: isAvailable ? '#52c41a' : '#ff4d4f' }}
          />
        </Tooltip>
      ),
    }));
  };

  const { filteredData, uniqueCities, uniqueSpecialties, stats } = useMemo(() => {
    if (!data) return { filteredData: [], uniqueCities: ['All'], uniqueSpecialties: ['All'], stats: {} };

    const term = (searchTerm || '').toLowerCase();
    const citySet = new Set(['All']);
    const specialtySet = new Set(['All']);
    let coveredSpecialtiesCount = 0;
    let totalSpecialtyEntries = 0;

    const filtered = data.matrix_data.filter(d => {
      citySet.add(d.city);
      let cityMatches = cityFilter === 'All' || d.city.toLowerCase() === cityFilter.toLowerCase();
      let specialtyMatches = specialtyFilter === 'All' || d.coverage[specialtyFilter];
      let termMatches = d.city.toLowerCase().includes(term) || (d.specialties && d.specialties.some(s => s.toLowerCase().includes(term)));

      return cityMatches && specialtyMatches && (term ? termMatches : true);
    });

    data.specialties.forEach(s => specialtySet.add(s));
    
    // Calculate stats on all data, not just filtered
    const specialtyCounts = {};
    data.specialties.forEach(s => specialtyCounts[s] = 0);

    data.matrix_data.forEach(cityData => {
      data.specialties.forEach(specialty => {
        if (cityData.coverage && cityData.coverage[specialty]) {
          coveredSpecialtiesCount++;
          specialtyCounts[specialty]++;
        }
        totalSpecialtyEntries++;
      });
    });

    const overallCoverage = totalSpecialtyEntries > 0 ? Math.round((coveredSpecialtiesCount / totalSpecialtyEntries) * 100) : 0;
    const specialtyCoverageData = Object.entries(specialtyCounts).map(([name, value]) => ({ name, value }));
    const uncoveredSpecialtyCount = data.specialties.length - specialtyCoverageData.filter(s => s.value > 0).length;

    return {
      filteredData: filtered,
      uniqueCities: Array.from(citySet).sort(),
      uniqueSpecialties: Array.from(specialtySet).sort(),
      stats: {
        totalCities: data.matrix_data.length,
        totalSpecialties: data.specialties.length,
        overallCoverage,
        specialtyCoverageData,
        uncoveredSpecialtyCount,
      }
    };
  }, [data, searchTerm, cityFilter, specialtyFilter]);

  const columns = [
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>,
    },
    ...(data ? getHeatmapColumns(data.specialties) : []),
  ];

  const filterMenu = (
    <div style={{ maxHeight: 250, overflowY: "auto", padding: 12, width: 240, backgroundColor: "#fff", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <label style={{ fontWeight: "bold" }}>Filter by City</label>
        <Select
          value={cityFilter}
          onChange={(v) => {
            setCityFilter(v);
          }}
          style={{ width: "100%" }}
        >
          {uniqueCities.map(c => <Option key={c} value={c}>{c}</Option>)}
        </Select>

        <label style={{ fontWeight: "bold", marginTop: 12 }}>Filter by Specialty</label>
        <Select
          value={specialtyFilter}
          onChange={setSpecialtyFilter}
          style={{ width: "100%" }}
        >
          {uniqueSpecialties.map(s => <Option key={s} value={s}>{s}</Option>)}
        </Select>
      </Space>
    </div>
  );

  const activeFiltersCount = (cityFilter !== 'All' ? 1 : 0) + (specialtyFilter !== 'All' ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 20 }}
    >
      <style>
        {`
        .coverage-cell {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          margin: 0 auto;
        }
        .ant-card-head {
          border-radius: 10px 10px 0 0;
        }
        .ant-card-body {
          border-radius: 0 0 10px 10px;
        }
        `}
      </style>
      <h2 style={{ marginBottom: 20 }}>
        <HomeOutlined style={{ marginRight: 8 }} />
        Specialty Service Coverage Dashboard
      </h2>
      ---
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Cities"
              value={stats.totalCities}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Specialties"
              value={stats.totalSpecialties}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Overall Coverage"
              value={stats.overallCoverage}
              suffix="%"
              valueStyle={{ color: stats.overallCoverage >= 50 ? '#52c41a' : '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
      ---
      {/* Search and Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Search
          placeholder="Search by city or specialty..."
          allowClear
          enterButton={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 300, flexGrow: 1 }}
          size="middle"
        />
        <Dropdown
          overlay={filterMenu}
          trigger={['click']}
          placement="bottomRight"
          overlayStyle={{ zIndex: 1000 }}
        >
          <Badge count={activeFiltersCount} offset={[10, 0]}>
            <Button icon={<FilterOutlined />} type="default">
              Filters
            </Button>
          </Badge>
        </Dropdown>
        <Button icon={<DownloadOutlined />} type="primary">
          Download Report
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 20 }}>Loading coverage data...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <Empty description="No data found matching your filters." />
      ) : (
        <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p>
            This matrix displays the availability of different medical specialties across various cities.
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}> Green cells </span> indicate that a specialty is available,
            while <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}> red cells </span> highlight a **coverage gap**.
          </p>
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="city"
            pagination={false}
            scroll={{ x: 'max-content' }}
            bordered
            style={{ marginTop: 20 }}
          />
        </Card>
      )}
    </motion.div>
  );
};

export default Q21_SpecialtyCoverageMatrix;

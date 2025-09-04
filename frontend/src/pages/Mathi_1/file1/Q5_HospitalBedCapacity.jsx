import React, { useEffect, useMemo, useState } from "react";
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
  Progress,
  Statistic
} from "antd";
import {
  EnvironmentOutlined,
  SearchOutlined,
  FilterOutlined,
  HomeOutlined
} from "@ant-design/icons";
import {
  getHospitalsBasic,
  getHospitalAddresses
} from "../../../services/hospitalService";
import { motion } from "framer-motion";

const { Search } = Input;

const capacityColor = (pct) => {
  if (pct >= 90) return "#cf1322";
  if (pct >= 75) return "#fa8c16";
  if (pct >= 50) return "#fadb14";
  return "#52c41a";
};

const normalizeBeds = (h) => {
  let op = Number(h.beds_operational ?? h.operational_beds ?? h.beds ?? 0) || 0;
  let reg =
    Number(h.beds_registered ?? h.registered_beds ?? h.beds_total ?? 0) || 0;
  if (reg === 0 && op > 0) reg = op;
  const pct = reg === 0 ? 0 : Math.round((op / reg) * 100);
  return { operational: op, registered: reg, pct };
};

export default function Q5_HospitalBedCapacity() {
  const [loading, setLoading] = useState(true);
  const [allHospitals, setAllHospitals] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        let baseRes = await getHospitalsBasic();
        let base = Array.isArray(baseRes.data) ? baseRes.data : [];

        try {
          const addrRes = await getHospitalAddresses();
          const addresses = Array.isArray(addrRes.data)
            ? addrRes.data
            : addrRes.data?.addresses || [];

          const addrById = new Map(
            addresses
              .filter((a) => a?.hospital_id)
              .map((a) => [a.hospital_id, a])
          );

          base = base.map((h) => {
            const a = addrById.get(h.id);
            return {
              ...h,
              city: h.city || a?.city_town || "Unknown",
              state: h.state || a?.state || "Unknown"
            };
          });
        } catch {
          base = base.map((h) => ({
            ...h,
            city: h.city || "Unknown",
            state: h.state || "Unknown"
          }));
        }

        if (mounted) setAllHospitals(base);
      } catch (e) {
        console.error("Failed to load hospitals:", e);
        if (mounted) setAllHospitals([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { states, cities } = useMemo(() => {
    const s = new Set();
    const c = new Set();
    allHospitals.forEach((h) => {
      if (h.state && h.state !== "Unknown") s.add(h.state);
      if (h.city && h.city !== "Unknown") c.add(h.city);
    });
    return {
      states: ["All", ...Array.from(s).sort()],
      cities: ["All", ...Array.from(c).sort()]
    };
  }, [allHospitals]);

  const filtered = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    return allHospitals.filter((h) => {
      const inState =
        stateFilter === "All"
          ? true
          : (h.state || "").toLowerCase() === stateFilter.toLowerCase();
      const inCity =
        cityFilter === "All"
          ? true
          : (h.city || "").toLowerCase() === cityFilter.toLowerCase();
      const matches =
        h.name?.toLowerCase().includes(term) ||
        h.city?.toLowerCase().includes(term) ||
        h.state?.toLowerCase().includes(term) ||
        h.type?.toLowerCase().includes(term);

      return inState && inCity && (term ? matches : true);
    });
  }, [allHospitals, searchTerm, stateFilter, cityFilter]);

  // Total Beds
  const { totalRegistered, totalOperational, utilization } = useMemo(() => {
    let reg = 0,
      op = 0;
    allHospitals.forEach((h) => {
      const { registered, operational } = normalizeBeds(h);
      reg += registered;
      op += operational;
    });
    return {
      totalRegistered: reg,
      totalOperational: op,
      utilization: reg ? Math.round((op / reg) * 100) : 0
    };
  }, [allHospitals]);

  // Filter menu
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
        <label style={{ fontWeight: "bold" }}>Filter by State</label>
        <Select
          value={stateFilter}
          onChange={(v) => {
            setStateFilter(v);
            setCityFilter("All");
          }}
          style={{ width: "100%" }}
          options={states.map((s) => ({ label: s, value: s }))}
        />

        <label style={{ fontWeight: "bold", marginTop: 12 }}>
          Filter by City
        </label>
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          style={{ width: "100%" }}
          options={cities.map((c) => ({ label: c, value: c }))}
        />
      </Space>
    </div>
  );

  const activeFiltersCount =
    (stateFilter !== "All" ? 1 : 0) + (cityFilter !== "All" ? 1 : 0);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>
        <HomeOutlined style={{ marginRight: 8 }} />
        Hospital Bed Capacity
      </h2>

      {/* ✅ Summary Cards (smaller + top-left aligned) */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20, maxWidth: 600 }}>
        <Col xs={24} sm={8}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Registered Beds"
              value={totalRegistered}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Operational Beds"
              value={totalOperational}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Utilization"
              value={utilization}
              suffix="%"
              valueStyle={{ color: capacityColor(utilization) }}
            />
          </Card>
        </Col>
      </Row>

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
          placeholder="Search by hospital name, state, city..."
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
      ) : filtered.length === 0 ? (
        <Empty description="No hospitals found" />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((h, index) => {
              const { operational, registered, pct } = normalizeBeds(h);
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={h.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      hoverable
                      bordered
                      style={{
                        borderRadius: 10,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                      title={h.name}
                      extra={<EnvironmentOutlined />}
                    >
                      <p>
                        <EnvironmentOutlined /> {h.city}, {h.state}
                      </p>
                      <div style={{ marginBottom: 8 }}>
                        <b>Operational Beds:</b>{" "}
                        {operational.toLocaleString()}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <b>Registered Beds:</b> {registered.toLocaleString()}
                      </div>
                      <Progress
                        percent={pct}
                        strokeColor={capacityColor(pct)}
                        showInfo
                      />
                      <small>Capacity Utilization</small>
                    </Card>
                  </motion.div>
                </Col>
              );
            })}
        </Row>
      )}
    </div>
  );
}

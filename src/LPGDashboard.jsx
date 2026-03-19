import { useState, useMemo, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════
   SYNTHETIC DATA GENERATION
   ═══════════════════════════════════════════ */

const STATES = [
  { name: "Gujarat", distributors: 65 },
  { name: "Maharashtra", distributors: 80 },
  { name: "Uttar Pradesh", distributors: 70 },
  { name: "Bihar", distributors: 45 },
  { name: "Rajasthan", distributors: 50 },
  { name: "Madhya Pradesh", distributors: 40 },
  { name: "Tamil Nadu", distributors: 55 },
  { name: "Karnataka", distributors: 45 },
  { name: "West Bengal", distributors: 40 },
  { name: "Delhi NCR", distributors: 35 },
  { name: "Chhattisgarh", distributors: 25 },
  { name: "Telangana", distributors: 30 },
];

const CITIES = {
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Noida"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belgaum"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
  "Delhi NCR": ["New Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
};

const OMCs = ["IOCL (Indane)", "BPCL (Bharatgas)", "HPCL (HP Gas)"];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDistributors() {
  const rand = seededRandom(42);
  const distributors = [];
  let id = 1000;
  STATES.forEach((state) => {
    const cities = CITIES[state.name];
    for (let i = 0; i < state.distributors; i++) {
      id++;
      const city = cities[Math.floor(rand() * cities.length)];
      const omc = OMCs[Math.floor(rand() * OMCs.length)];
      const isFraudulent = rand() < 0.09;
      const isWatchlist = !isFraudulent && rand() < 0.12;
      const baseConsumers = 800 + Math.floor(rand() * 2200);
      const baseCylindersReceived = Math.floor(baseConsumers * (0.28 + rand() * 0.12));
      const deliveryRate = isFraudulent ? 0.55 + rand() * 0.25 : isWatchlist ? 0.78 + rand() * 0.1 : 0.92 + rand() * 0.07;
      const cylindersDelivered = Math.floor(baseCylindersReceived * deliveryRate);
      const gpsMatchRate = isFraudulent ? 0.3 + rand() * 0.3 : isWatchlist ? 0.6 + rand() * 0.2 : 0.88 + rand() * 0.11;
      const complaints = isFraudulent ? 15 + Math.floor(rand() * 40) : isWatchlist ? 8 + Math.floor(rand() * 15) : Math.floor(rand() * 8);
      const nightDeliveryRatio = isFraudulent ? 0.15 + rand() * 0.3 : rand() * 0.04;
      const avgDeliveryDays = isFraudulent ? 5 + rand() * 8 : 1.5 + rand() * 2;
      const anomalyScore = Math.min(100, Math.max(0, Math.round(
        (1 - deliveryRate) * 120 + (1 - gpsMatchRate) * 80 + (complaints / 55) * 60 + nightDeliveryRatio * 100 + (avgDeliveryDays > 5 ? 20 : 0) + (rand() * 10 - 5)
      )));
      const status = anomalyScore >= 75 ? "flagged" : anomalyScore >= 45 ? "watchlist" : "clear";
      distributors.push({
        id: `DIS-${id}`, state: state.name, city, omc, consumers: baseConsumers,
        cylindersReceived: baseCylindersReceived, cylindersDelivered,
        deliveryRate: Math.round(deliveryRate * 1000) / 10,
        gpsMatchRate: Math.round(gpsMatchRate * 1000) / 10,
        complaints, nightDeliveryRatio: Math.round(nightDeliveryRatio * 1000) / 10,
        avgDeliveryDays: Math.round(avgDeliveryDays * 10) / 10,
        anomalyScore, status, diverted: baseCylindersReceived - cylindersDelivered,
      });
    }
  });
  return distributors;
}

const ALL_DISTRIBUTORS = generateDistributors();

/* ═══════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════ */

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent || "var(--text-1)" }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  return <span className={`badge badge-${status}`}>{status === "flagged" ? "FLAGGED" : status === "watchlist" ? "WATCH" : "CLEAR"}</span>;
}

function ScoreBar({ score, h = 6 }) {
  const cls = score >= 75 ? "danger" : score >= 45 ? "warn" : "ok";
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track" style={{ height: h }}>
        <div className={`score-bar-fill score-${cls}`} style={{ width: `${score}%`, height: h }} />
      </div>
      <span className={`score-num score-${cls}`}>{score}</span>
    </div>
  );
}

function SignalRow({ name, value, isBad, desc }) {
  return (
    <div className={`signal-row ${isBad ? "signal-bad" : ""}`}>
      <div className="signal-info">
        <div className="signal-name">{name}</div>
        <div className="signal-desc">{desc}</div>
      </div>
      <div className={`signal-value ${isBad ? "signal-value-bad" : ""}`}>{value}</div>
    </div>
  );
}

function StateBarRow({ state, total, flagged, maxTotal, onClick }) {
  const pctClean = ((total - flagged) / maxTotal) * 100;
  const pctFlagged = (flagged / maxTotal) * 100;
  return (
    <div className="state-row" onClick={onClick}>
      <span className="state-name">{state}</span>
      <div className="state-track">
        <div className="state-fill-ok" style={{ width: `${pctClean}%` }} />
        <div className="state-fill-bad" style={{ width: `${pctFlagged}%` }} />
      </div>
      <span className="state-total">{total}</span>
      {flagged > 0 && <span className="state-flagged">{flagged}!</span>}
    </div>
  );
}

/* ── DETAIL PANEL ── */

function DistributorDetail({ d, onClose }) {
  if (!d) return null;
  const signals = [
    { name: "Delivery gap", value: `${Math.round((1 - d.deliveryRate / 100) * 100)}%`, isBad: d.deliveryRate < 85, desc: "Cylinders received but not delivered" },
    { name: "GPS mismatch", value: `${Math.round((1 - d.gpsMatchRate / 100) * 100)}%`, isBad: d.gpsMatchRate < 75, desc: "Truck GPS didn't match consumer address" },
    { name: "Complaint rate", value: `${d.complaints}/mo`, isBad: d.complaints > 12, desc: "Monthly non-delivery and overcharging reports" },
    { name: "Night deliveries", value: `${d.nightDeliveryRatio}%`, isBad: d.nightDeliveryRatio > 10, desc: "Logged between 10 PM and 6 AM" },
    { name: "Avg delivery time", value: `${d.avgDeliveryDays}d`, isBad: d.avgDeliveryDays > 5, desc: "Days from booking to delivery" },
  ];
  const val = d.diverted * 913;
  return (
    <div className={`detail-panel fade-in ${d.status === "flagged" ? "detail-flagged" : ""}`}>
      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <span className="detail-id">{d.id}</span>
            <Badge status={d.status} />
          </div>
          <div className="detail-location">{d.city}, {d.state}</div>
          <div className="detail-omc">{d.omc}</div>
        </div>
        <button className="close-btn" onClick={onClose}>&#10005;</button>
      </div>
      <div className="detail-metrics">
        <MetricCard label="Risk score" value={d.anomalyScore} accent={d.anomalyScore >= 75 ? "var(--danger)" : d.anomalyScore >= 45 ? "var(--warn)" : "var(--ok)"} />
        <MetricCard label="Consumers" value={d.consumers.toLocaleString("en-IN")} />
        <MetricCard label="Received" value={d.cylindersReceived.toLocaleString("en-IN")} sub="cylinders/mo" />
        <MetricCard label="Delivered" value={d.cylindersDelivered.toLocaleString("en-IN")} sub="cylinders/mo" />
        <MetricCard label="Unaccounted" value={d.diverted.toLocaleString("en-IN")} accent={d.diverted > 50 ? "var(--danger)" : undefined} sub={`≈ ₹${val.toLocaleString("en-IN")}`} />
      </div>
      <div className="section-label">Fraud signal breakdown</div>
      <div className="signals-list">
        {signals.map((s, i) => <SignalRow key={i} {...s} />)}
      </div>
      {d.status === "flagged" && (
        <div className="ml-recommendation">
          <strong>ML recommendation: Immediate inspection</strong>
          <br />
          {d.diverted.toLocaleString("en-IN")} cylinders unaccounted monthly with {d.gpsMatchRate}% GPS-verified deliveries and {d.complaints} consumer complaints. Estimated monthly diversion: ₹{val.toLocaleString("en-IN")}.
        </div>
      )}
    </div>
  );
}

/* ── DISTRIBUTOR ROW (desktop) ── */

function DistRow({ d, isSelected, onClick }) {
  return (
    <div className={`dist-row ${isSelected ? "dist-row-active" : ""}`} onClick={onClick}>
      <span className="dist-id">{d.id}</span>
      <div className="dist-loc">
        <div className="dist-city">{d.city}</div>
        <div className="dist-state">{d.state}</div>
      </div>
      <ScoreBar score={d.anomalyScore} />
      <span className={`dist-num ${d.deliveryRate < 85 ? "num-bad" : ""}`}>{d.deliveryRate}%</span>
      <span className={`dist-num ${d.gpsMatchRate < 75 ? "num-bad" : ""}`}>{d.gpsMatchRate}%</span>
      <Badge status={d.status} />
    </div>
  );
}

/* ── DISTRIBUTOR CARD (mobile) ── */

function DistCard({ d, isSelected, onClick }) {
  return (
    <div className={`dist-card ${isSelected ? "dist-card-active" : ""}`} onClick={onClick}>
      <div className="dist-card-top">
        <div>
          <div className="dist-card-id">{d.id}</div>
          <div className="dist-card-city">{d.city}, {d.state}</div>
          <div className="dist-card-omc">{d.omc}</div>
        </div>
        <Badge status={d.status} />
      </div>
      <ScoreBar score={d.anomalyScore} h={8} />
      <div className="dist-card-stats">
        <span>Del: <strong className={d.deliveryRate < 85 ? "num-bad" : ""}>{d.deliveryRate}%</strong></span>
        <span>GPS: <strong className={d.gpsMatchRate < 75 ? "num-bad" : ""}>{d.gpsMatchRate}%</strong></span>
        <span>Complaints: <strong className={d.complaints > 12 ? "num-bad" : ""}>{d.complaints}</strong></span>
      </div>
    </div>
  );
}

/* ── HOW IT WORKS ── */

const HOW_DATA = [
  { num: "01", title: "Delivery gap analysis", body: "If a distributor receives 1,000 cylinders but records show only 700 delivered, 300 are unaccounted for. Normal range is 92-99%. Below 80% is a red flag.", stat: "30% gap = red flag" },
  { num: "02", title: "GPS verification", body: "Delivery trucks carry GPS. If the truck never went near the consumer's address but the system shows 'delivered', it's a phantom delivery.", stat: "<75% match = alert" },
  { num: "03", title: "Complaint clustering", body: "Consumer complaints about non-delivery cluster around specific distributors. Flagged ones show 15-50 complaints/month versus 0-8 for honest ones.", stat: ">12/month = suspicious" },
  { num: "04", title: "Night delivery detection", body: "Real deliveries happen during business hours. When 15-40% are logged between 10 PM and 6 AM, these are database entries covering diverted stock.", stat: ">10% night = anomaly" },
  { num: "05", title: "Delivery time analysis", body: "Normal booking-to-delivery takes 1.5-3.5 days. Averaging 5-13 days suggests holding stock for black market sale.", stat: ">5 days = investigate" },
];

function HowSection() {
  return (
    <div className="how-section">
      <p className="how-intro">
        This dashboard simulates what an ML-powered fraud detection system looks like when distributor-level data is analyzed. All {ALL_DISTRIBUTORS.length} distributors are synthetic — no real data or PII is used. Patterns mirror real-world dynamics from the March 2026 crisis.
      </p>
      <div className="section-label">The five fraud signals</div>
      <div className="how-cards">
        {HOW_DATA.map((item) => (
          <div key={item.num} className="how-card">
            <span className="how-num">{item.num}</span>
            <div className="how-content">
              <div className="how-title">{item.title}</div>
              <div className="how-body">{item.body}</div>
              <span className="how-stat">{item.stat}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="section-label" style={{ marginTop: 28 }}>What the government needs to share</div>
      <p className="how-body-text">
        All required data already exists within IOCL, BPCL, and HPCL systems: distributor-wise monthly cylinder allocation and delivery records, GPS logs from delivery vehicles, consumer booking and delivery timestamps, complaint records, and PAHAL/DBT subsidy transfer records.
      </p>
      <div className="cta-box">
        <strong>A call to action</strong>
        <p>
          This proof of concept was built by a single citizen using synthetic data. Imagine what's possible when the government opens distributor-level data to public scrutiny. During the March 2026 crisis, black market cylinders sold for ₹4,000-4,500 while official prices were ₹913. An ML system like this could identify and shut down diversion networks within days, not weeks. The technology is ready. The data exists. What's missing is the will to use it.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */

export default function LPGDashboard() {
  const [selectedState, setSelectedState] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDist, setSelectedDist] = useState(null);
  const [sortBy, setSortBy] = useState("anomalyScore");
  const [tab, setTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filtered = useMemo(() => {
    let d = ALL_DISTRIBUTORS;
    if (selectedState !== "All") d = d.filter((x) => x.state === selectedState);
    if (selectedStatus !== "all") d = d.filter((x) => x.status === selectedStatus);
    return [...d].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [selectedState, selectedStatus, sortBy]);

  const stats = useMemo(() => {
    const d = selectedState === "All" ? ALL_DISTRIBUTORS : ALL_DISTRIBUTORS.filter((x) => x.state === selectedState);
    const flagged = d.filter((x) => x.status === "flagged").length;
    const totalDiverted = d.reduce((s, x) => s + x.diverted, 0);
    return {
      total: d.length, flagged,
      watchlist: d.filter((x) => x.status === "watchlist").length,
      clear: d.filter((x) => x.status === "clear").length,
      totalDiverted, totalComplaints: d.reduce((s, x) => s + x.complaints, 0),
      avgDeliveryRate: Math.round((d.reduce((s, x) => s + x.deliveryRate, 0) / d.length) * 10) / 10,
      diversionValue: totalDiverted * 913,
    };
  }, [selectedState]);

  const stateStats = useMemo(() => {
    const map = {};
    ALL_DISTRIBUTORS.forEach((d) => {
      if (!map[d.state]) map[d.state] = { total: 0, flagged: 0 };
      map[d.state].total++;
      if (d.status === "flagged") map[d.state].flagged++;
    });
    return Object.entries(map).sort((a, b) => b[1].flagged - a[1].flagged);
  }, []);

  const maxStateDist = Math.max(...stateStats.map(([, v]) => v.total));

  const handleStateClick = useCallback((state) => {
    setSelectedState(state);
    setSelectedDist(null);
    setTab("distributors");
  }, []);

  const LIMIT = isMobile ? 25 : 50;
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "distributors", label: "Distributors" },
    { key: "how", label: "How it works" },
  ];

  return (
    <div className="app-root">
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="live-dot-row">
          <span className="live-dot" />
          <span className="live-label">Proof of concept — synthetic data</span>
        </div>
        <h1 className="app-title">LPG distribution fraud detector</h1>
        <p className="app-subtitle">
          ML-powered anomaly detection across <strong>{ALL_DISTRIBUTORS.length}</strong> simulated distributors in <strong>{STATES.length}</strong> states. Demonstrating what's possible when data meets accountability.
        </p>
      </header>

      {/* ── TABS ── */}
      <nav className="tab-bar">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={`tab-btn ${tab === key ? "tab-active" : ""}`}>{label}</button>
        ))}
      </nav>

      {/* ═══ OVERVIEW ═══ */}
      {tab === "overview" && (
        <div className="fade-in">
          <div className="filter-row">
            <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedDist(null); }}>
              <option value="All">All states</option>
              {STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="metrics-grid">
            <MetricCard label="Distributors" value={stats.total} />
            <MetricCard label="Flagged" value={stats.flagged} accent="var(--danger)" sub={`${Math.round((stats.flagged / stats.total) * 100)}% of total`} />
            <MetricCard label="Watch list" value={stats.watchlist} accent="var(--warn)" />
            <MetricCard label="Clear" value={stats.clear} accent="var(--ok)" />
            <MetricCard label="Cylinders diverted" value={stats.totalDiverted.toLocaleString("en-IN")} accent="var(--danger)" sub="monthly estimate" />
            <MetricCard label="Diversion value" value={`₹${stats.diversionValue.toLocaleString("en-IN")}`} accent="var(--danger)" sub="at ₹913/cylinder" />
            <MetricCard label="Total complaints" value={stats.totalComplaints.toLocaleString("en-IN")} sub="monthly" />
            <MetricCard label="Avg delivery rate" value={`${stats.avgDeliveryRate}%`} />
          </div>
          <div className="section-label">Distributors by state</div>
          <div className="state-chart-card">
            {stateStats.map(([state, v]) => (
              <StateBarRow key={state} state={state} total={v.total} flagged={v.flagged} maxTotal={maxStateDist} onClick={() => handleStateClick(state)} />
            ))}
          </div>
          <div className="legend-row">
            <span><span className="legend-dot legend-ok" />Clear + Watch</span>
            <span><span className="legend-dot legend-bad" />Flagged</span>
            <span className="legend-hint">Click a state to drill in</span>
          </div>
          <div className="summary-box">
            <strong>What this demonstrates:</strong> With real distributor-level data, ML can automatically identify the ~9% showing anomalous diversion patterns. Here, <strong className="num-bad">{stats.flagged} distributors</strong> are flagged — representing <strong className="num-bad">₹{stats.diversionValue.toLocaleString("en-IN")}</strong> in estimated monthly diversion. The government currently has no such system.
          </div>
        </div>
      )}

      {/* ═══ DISTRIBUTORS ═══ */}
      {tab === "distributors" && (
        <div className="fade-in">
          <div className="filter-row">
            <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedDist(null); }}>
              <option value="All">All states</option>
              {STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="flagged">Flagged</option>
              <option value="watchlist">Watch list</option>
              <option value="clear">Clear</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="anomalyScore">Risk score</option>
              <option value="complaints">Complaints</option>
              <option value="diverted">Diverted</option>
            </select>
            <span className="result-count">{filtered.length} results</span>
          </div>

          {/* Desktop table */}
          {!isMobile && (
            <>
              <div className="table-header">
                <span>ID</span><span>Location</span><span>Risk</span><span>Del%</span><span>GPS%</span><span>Status</span>
              </div>
              {filtered.slice(0, LIMIT).map((d) => (
                <DistRow key={d.id} d={d} isSelected={selectedDist?.id === d.id} onClick={() => setSelectedDist(selectedDist?.id === d.id ? null : d)} />
              ))}
            </>
          )}

          {/* Mobile cards */}
          {isMobile && (
            <div className="mobile-cards">
              {filtered.slice(0, LIMIT).map((d) => (
                <DistCard key={d.id} d={d} isSelected={selectedDist?.id === d.id} onClick={() => setSelectedDist(selectedDist?.id === d.id ? null : d)} />
              ))}
            </div>
          )}

          {filtered.length > LIMIT && (
            <div className="show-more-hint">Showing top {LIMIT} of {filtered.length} — use filters to narrow down</div>
          )}
          <DistributorDetail d={selectedDist} onClose={() => setSelectedDist(null)} />
        </div>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      {tab === "how" && <div className="fade-in"><HowSection /></div>}

      {/* ── FOOTER ── */}
      <footer className="app-footer">
        All distributor data is synthetically generated. No real OMC data or PII is used.
        <br />Built as a citizen-led proof of concept for ML-based LPG distribution accountability.
      </footer>
    </div>
  );
}
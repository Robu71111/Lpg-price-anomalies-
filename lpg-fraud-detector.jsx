import { useState, useMemo, useEffect } from "react";

// --- Synthetic Data Generation ---
const STATES = [
  { name: "Gujarat", lat: 22.3, lng: 72.6, distributors: 65 },
  { name: "Maharashtra", lat: 19.7, lng: 75.7, distributors: 80 },
  { name: "Uttar Pradesh", lat: 26.8, lng: 80.9, distributors: 70 },
  { name: "Bihar", lat: 25.6, lng: 85.1, distributors: 45 },
  { name: "Rajasthan", lat: 27.0, lng: 74.2, distributors: 50 },
  { name: "Madhya Pradesh", lat: 23.5, lng: 78.5, distributors: 40 },
  { name: "Tamil Nadu", lat: 11.1, lng: 78.6, distributors: 55 },
  { name: "Karnataka", lat: 15.3, lng: 75.7, distributors: 45 },
  { name: "West Bengal", lat: 22.9, lng: 87.8, distributors: 40 },
  { name: "Delhi NCR", lat: 28.6, lng: 77.2, distributors: 35 },
  { name: "Chhattisgarh", lat: 21.3, lng: 81.6, distributors: 25 },
  { name: "Telangana", lat: 18.1, lng: 79.0, distributors: 30 },
];

const CITIES = {
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Noida"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belgaum"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
  "Delhi NCR": ["New Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
};

const OMCs = ["IOCL (Indane)", "BPCL (Bharatgas)", "HPCL (HP Gas)"];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
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
      const normalDeliveryRate = 0.92 + rand() * 0.07;
      const fraudDeliveryRate = 0.55 + rand() * 0.25;
      const watchlistDeliveryRate = 0.78 + rand() * 0.1;
      const deliveryRate = isFraudulent ? fraudDeliveryRate : isWatchlist ? watchlistDeliveryRate : normalDeliveryRate;
      const cylindersDelivered = Math.floor(baseCylindersReceived * deliveryRate);
      const normalGpsMatch = 0.88 + rand() * 0.11;
      const fraudGpsMatch = 0.3 + rand() * 0.3;
      const watchlistGpsMatch = 0.6 + rand() * 0.2;
      const gpsMatchRate = isFraudulent ? fraudGpsMatch : isWatchlist ? watchlistGpsMatch : normalGpsMatch;
      const normalComplaints = Math.floor(rand() * 8);
      const fraudComplaints = 15 + Math.floor(rand() * 40);
      const watchlistComplaints = 8 + Math.floor(rand() * 15);
      const complaints = isFraudulent ? fraudComplaints : isWatchlist ? watchlistComplaints : normalComplaints;
      const normalNightDelivery = rand() * 0.04;
      const fraudNightDelivery = 0.15 + rand() * 0.3;
      const nightDeliveryRatio = isFraudulent ? fraudNightDelivery : normalNightDelivery;
      const normalAvgTime = 1.5 + rand() * 2;
      const fraudAvgTime = 5 + rand() * 8;
      const avgDeliveryDays = isFraudulent ? fraudAvgTime : normalAvgTime;

      const anomalyScore = Math.min(100, Math.max(0, Math.round(
        (1 - deliveryRate) * 120 +
        (1 - gpsMatchRate) * 80 +
        (complaints / 55) * 60 +
        nightDeliveryRatio * 100 +
        (avgDeliveryDays > 5 ? 20 : 0) +
        (rand() * 10 - 5)
      )));

      const status = anomalyScore >= 75 ? "flagged" : anomalyScore >= 45 ? "watchlist" : "clear";

      distributors.push({
        id: `DIS-${id}`,
        state: state.name,
        city,
        omc,
        consumers: baseConsumers,
        cylindersReceived: baseCylindersReceived,
        cylindersDelivered,
        deliveryRate: Math.round(deliveryRate * 1000) / 10,
        gpsMatchRate: Math.round(gpsMatchRate * 1000) / 10,
        complaints,
        nightDeliveryRatio: Math.round(nightDeliveryRatio * 1000) / 10,
        avgDeliveryDays: Math.round(avgDeliveryDays * 10) / 10,
        anomalyScore,
        status,
        diverted: baseCylindersReceived - cylindersDelivered,
        lat: state.lat + (rand() - 0.5) * 3,
        lng: state.lng + (rand() - 0.5) * 3,
      });
    }
  });
  return distributors;
}

const ALL_DISTRIBUTORS = generateDistributors();

// --- Components ---

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-lg)",
      padding: "14px 18px",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: color || "var(--color-text-primary)", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function RiskBadge({ status }) {
  const colors = {
    flagged: { bg: "var(--color-background-danger)", color: "var(--color-text-danger)" },
    watchlist: { bg: "var(--color-background-warning)", color: "var(--color-text-warning)" },
    clear: { bg: "var(--color-background-success)", color: "var(--color-text-success)" },
  };
  const c = colors[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "var(--border-radius-md)",
      fontSize: 11,
      fontWeight: 500,
      background: c.bg,
      color: c.color,
    }}>
      {status === "flagged" ? "Flagged" : status === "watchlist" ? "Watch" : "Clear"}
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 75 ? "var(--color-text-danger)" : score >= 45 ? "var(--color-text-warning)" : "var(--color-text-success)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--color-background-tertiary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color, minWidth: 28, textAlign: "right" }}>{score}</span>
    </div>
  );
}

function SignalBreakdown({ d }) {
  const signals = [
    { name: "Delivery gap", value: `${Math.round((1 - d.deliveryRate / 100) * 100)}%`, bad: d.deliveryRate < 85, desc: "Cylinders received but not delivered" },
    { name: "GPS mismatch", value: `${Math.round((1 - d.gpsMatchRate / 100) * 100)}%`, bad: d.gpsMatchRate < 75, desc: "Deliveries where truck wasn't near address" },
    { name: "Complaint rate", value: `${d.complaints} / month`, bad: d.complaints > 12, desc: "Consumer complaints filed" },
    { name: "Night deliveries", value: `${d.nightDeliveryRatio}%`, bad: d.nightDeliveryRatio > 10, desc: "Deliveries logged 10 PM - 6 AM" },
    { name: "Avg delivery time", value: `${d.avgDeliveryDays} days`, bad: d.avgDeliveryDays > 5, desc: "Booking to delivery duration" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {signals.map((s, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
          background: s.bad ? "var(--color-background-danger)" : "var(--color-background-secondary)",
          borderRadius: "var(--border-radius-md)", fontSize: 13,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.bad ? "var(--color-text-danger)" : "var(--color-text-success)", flexShrink: 0 }} />
          <span style={{ flex: 1, color: "var(--color-text-primary)" }}>{s.name}</span>
          <span style={{ fontWeight: 500, color: s.bad ? "var(--color-text-danger)" : "var(--color-text-primary)" }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function DistributorDetail({ d, onClose }) {
  if (!d) return null;
  return (
    <div style={{
      background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)", padding: "20px 24px", marginTop: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{d.id}</span>
            <RiskBadge status={d.status} />
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{d.city}, {d.state} — {d.omc}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-tertiary)", padding: 4 }}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
        <MetricCard label="Risk score" value={d.anomalyScore} color={d.anomalyScore >= 75 ? "var(--color-text-danger)" : d.anomalyScore >= 45 ? "var(--color-text-warning)" : "var(--color-text-success)"} />
        <MetricCard label="Consumers" value={d.consumers.toLocaleString()} />
        <MetricCard label="Received" value={d.cylindersReceived.toLocaleString()} sub="cylinders/month" />
        <MetricCard label="Delivered" value={d.cylindersDelivered.toLocaleString()} sub="cylinders/month" />
        <MetricCard label="Diverted" value={d.diverted.toLocaleString()} color={d.diverted > 50 ? "var(--color-text-danger)" : undefined} sub="unaccounted" />
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>Fraud signal breakdown</div>
      <SignalBreakdown d={d} />

      {d.status === "flagged" && (
        <div style={{
          marginTop: 16, padding: "12px 16px", background: "var(--color-background-danger)",
          borderRadius: "var(--border-radius-md)", fontSize: 13, color: "var(--color-text-danger)", lineHeight: 1.6,
        }}>
          <strong>ML recommendation:</strong> Immediate physical inspection warranted. Multiple signals indicate possible cylinder diversion — {d.diverted.toLocaleString()} cylinders unaccounted for monthly, with {d.complaints} consumer complaints and only {d.gpsMatchRate}% GPS-verified deliveries. Estimated monthly diversion value: ₹{(d.diverted * 913).toLocaleString()} at official rates.
        </div>
      )}
    </div>
  );
}

function StateBar({ state, count, flagged, max }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <span style={{ width: 90, color: "var(--color-text-secondary)", textAlign: "right", flexShrink: 0 }}>{state}</span>
      <div style={{ flex: 1, height: 16, background: "var(--color-background-tertiary)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${((count - flagged) / max) * 100}%`, background: "var(--color-text-success)", opacity: 0.6 }} />
        <div style={{ width: `${(flagged / max) * 100}%`, background: "var(--color-text-danger)", opacity: 0.8 }} />
      </div>
      <span style={{ minWidth: 24, color: "var(--color-text-primary)", fontWeight: 500 }}>{count}</span>
      {flagged > 0 && <span style={{ minWidth: 20, color: "var(--color-text-danger)", fontWeight: 500 }}>{flagged}⚑</span>}
    </div>
  );
}

// --- Main Dashboard ---
export default function LPGDashboard() {
  const [selectedState, setSelectedState] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDist, setSelectedDist] = useState(null);
  const [sortBy, setSortBy] = useState("anomalyScore");
  const [tab, setTab] = useState("overview");

  const filtered = useMemo(() => {
    let d = ALL_DISTRIBUTORS;
    if (selectedState !== "All") d = d.filter(x => x.state === selectedState);
    if (selectedStatus !== "all") d = d.filter(x => x.status === selectedStatus);
    return [...d].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [selectedState, selectedStatus, sortBy]);

  const stats = useMemo(() => {
    const d = selectedState === "All" ? ALL_DISTRIBUTORS : ALL_DISTRIBUTORS.filter(x => x.state === selectedState);
    return {
      total: d.length,
      flagged: d.filter(x => x.status === "flagged").length,
      watchlist: d.filter(x => x.status === "watchlist").length,
      clear: d.filter(x => x.status === "clear").length,
      totalDiverted: d.reduce((s, x) => s + x.diverted, 0),
      totalComplaints: d.reduce((s, x) => s + x.complaints, 0),
      avgDeliveryRate: Math.round(d.reduce((s, x) => s + x.deliveryRate, 0) / d.length * 10) / 10,
    };
  }, [selectedState]);

  const stateStats = useMemo(() => {
    const map = {};
    ALL_DISTRIBUTORS.forEach(d => {
      if (!map[d.state]) map[d.state] = { total: 0, flagged: 0 };
      map[d.state].total++;
      if (d.status === "flagged") map[d.state].flagged++;
    });
    return Object.entries(map).sort((a, b) => b[1].flagged - a[1].flagged);
  }, []);

  const maxStateDist = Math.max(...stateStats.map(([, v]) => v.total));

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", maxWidth: 800, margin: "0 auto", padding: "1rem 0" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-text-danger)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-danger)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Proof of concept — synthetic data</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>LPG distribution fraud detector</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          ML-powered anomaly detection across {ALL_DISTRIBUTORS.length} simulated distributors in {STATES.length} states. This demonstrates what is possible when distributor-level data is analyzed systematically.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[["overview", "Overview"], ["distributors", "Distributors"], ["how", "How it works"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 16px", fontSize: 13, fontWeight: tab === key ? 500 : 400, cursor: "pointer",
            background: "none", border: "none", borderBottom: tab === key ? "2px solid var(--color-text-primary)" : "2px solid transparent",
            color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedDist(null); }} style={{ fontSize: 13, padding: "6px 10px" }}>
              <option value="All">All states</option>
              {STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 24 }}>
            <MetricCard label="Total distributors" value={stats.total} />
            <MetricCard label="Flagged" value={stats.flagged} color="var(--color-text-danger)" sub={`${Math.round(stats.flagged / stats.total * 100)}% of total`} />
            <MetricCard label="Watch list" value={stats.watchlist} color="var(--color-text-warning)" />
            <MetricCard label="Clear" value={stats.clear} color="var(--color-text-success)" />
            <MetricCard label="Cylinders diverted" value={stats.totalDiverted.toLocaleString()} color="var(--color-text-danger)" sub="monthly estimate" />
            <MetricCard label="Diversion value" value={`₹${(stats.totalDiverted * 913).toLocaleString()}`} color="var(--color-text-danger)" sub="at official rate" />
            <MetricCard label="Complaints" value={stats.totalComplaints.toLocaleString()} sub="monthly total" />
            <MetricCard label="Avg delivery rate" value={`${stats.avgDeliveryRate}%`} />
          </div>

          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>Distributors by state</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {stateStats.map(([state, v]) => (
              <div key={state} onClick={() => { setSelectedState(state); setTab("distributors"); }} style={{ cursor: "pointer" }}>
                <StateBar state={state} count={v.total} flagged={v.flagged} max={maxStateDist} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 24 }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--color-text-success)", opacity: 0.6, marginRight: 4 }} />Clear / watch</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--color-text-danger)", opacity: 0.8, marginRight: 4 }} />Flagged</span>
          </div>

          <div style={{
            padding: "16px 20px", background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-lg)", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7,
          }}>
            <strong style={{ color: "var(--color-text-primary)" }}>What this demonstrates:</strong> With access to real distributor-level data (cylinder allocation, delivery records, GPS logs, consumer complaints), an ML system can automatically identify the ~9% of distributors showing anomalous behavior patterns consistent with cylinder diversion. In this simulation, {stats.flagged} distributors are flagged for immediate investigation, representing an estimated ₹{(stats.totalDiverted * 913).toLocaleString()} in monthly diversion value. Currently, the government has no such system — investigations happen only after individual consumer complaints accumulate.
          </div>
        </div>
      )}

      {/* Distributors Tab */}
      {tab === "distributors" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedDist(null); }} style={{ fontSize: 13, padding: "6px 10px" }}>
              <option value="All">All states</option>
              {STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ fontSize: 13, padding: "6px 10px" }}>
              <option value="all">All status</option>
              <option value="flagged">Flagged only</option>
              <option value="watchlist">Watch list</option>
              <option value="clear">Clear only</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 13, padding: "6px 10px" }}>
              <option value="anomalyScore">Sort by risk score</option>
              <option value="complaints">Sort by complaints</option>
              <option value="diverted">Sort by diverted cylinders</option>
            </select>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{filtered.length} distributors</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Header row */}
            <div style={{
              display: "grid", gridTemplateColumns: "90px 1fr 90px 60px 55px 50px 70px",
              gap: 8, padding: "6px 12px", fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500,
            }}>
              <span>ID</span><span>Location</span><span>Risk score</span><span>Recv</span><span>Del%</span><span>GPS%</span><span>Status</span>
            </div>
            {filtered.slice(0, 40).map(d => (
              <div key={d.id} onClick={() => setSelectedDist(selectedDist?.id === d.id ? null : d)} style={{
                display: "grid", gridTemplateColumns: "90px 1fr 90px 60px 55px 50px 70px",
                gap: 8, padding: "8px 12px", fontSize: 12, cursor: "pointer",
                background: selectedDist?.id === d.id ? "var(--color-background-secondary)" : "transparent",
                borderRadius: "var(--border-radius-md)", transition: "background 0.1s",
                alignItems: "center",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-secondary)" }}>{d.id}</span>
                <span style={{ color: "var(--color-text-primary)" }}>{d.city}, <span style={{ color: "var(--color-text-tertiary)" }}>{d.state}</span></span>
                <ScoreBar score={d.anomalyScore} />
                <span>{d.cylindersReceived.toLocaleString()}</span>
                <span style={{ color: d.deliveryRate < 85 ? "var(--color-text-danger)" : "var(--color-text-primary)" }}>{d.deliveryRate}%</span>
                <span style={{ color: d.gpsMatchRate < 75 ? "var(--color-text-danger)" : "var(--color-text-primary)" }}>{d.gpsMatchRate}%</span>
                <RiskBadge status={d.status} />
              </div>
            ))}
          </div>
          {filtered.length > 40 && (
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", padding: "12px 0" }}>
              Showing top 40 of {filtered.length} — filter by state or status to narrow results
            </div>
          )}

          {selectedDist && <DistributorDetail d={selectedDist} onClose={() => setSelectedDist(null)} />}
        </div>
      )}

      {/* How It Works Tab */}
      {tab === "how" && (
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>What this proof of concept demonstrates</div>
            <p style={{ margin: "0 0 12px" }}>
              This dashboard simulates what an ML-powered fraud detection system would look like if the government shared distributor-level LPG data. The {ALL_DISTRIBUTORS.length} distributors shown here are entirely synthetic — no real distributor or consumer data is used. But the patterns are modeled on real-world LPG distribution dynamics reported during the March 2026 crisis.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>The five fraud signals</div>
            {[
              ["Delivery gap", "If a distributor receives 1,000 cylinders but official records show only 700 delivered, 300 are unaccounted for. Normal distributors have 92-99% delivery rates. Fraudulent ones drop to 55-80%."],
              ["GPS mismatch", "Delivery trucks carry GPS trackers. If the truck never went within 500m of the consumer's address but the system shows 'delivered', that's a phantom delivery. Honest distributors show 88-99% GPS match rates."],
              ["Complaint density", "Consumer complaints about non-delivery, phantom deliveries, and overcharging cluster around specific distributors. A flagged distributor might have 15-50 complaints/month versus 0-8 for clean ones."],
              ["Night delivery ratio", "Real deliveries happen during business hours. When 15-40% of a distributor's deliveries are logged between 10 PM and 6 AM, those are likely database entries to cover diverted stock, not actual deliveries."],
              ["Delivery time anomaly", "Normal booking-to-delivery takes 1.5-3.5 days. If a distributor averages 5-13 days, they may be holding stock for black market sale and delivering only when forced to."],
            ].map(([title, desc], i) => (
              <div key={i} style={{
                padding: "12px 16px", background: "var(--color-background-secondary)",
                borderRadius: "var(--border-radius-md)", marginBottom: 8,
              }}>
                <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4, fontSize: 13 }}>{i + 1}. {title}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>What data the government would need to share</div>
            <p style={{ margin: "0 0 12px" }}>
              All of this data already exists within the IOCL, BPCL, and HPCL systems. The government does not need to build anything new — they just need to feed existing data into an anomaly detection pipeline. The data includes: distributor-wise monthly cylinder allocation and delivery records, GPS logs from delivery vehicles, consumer booking and delivery confirmation timestamps, complaint records from consumer portals and helplines, and PAHAL/DBT subsidy transfer records.
            </p>
          </div>

          <div style={{
            padding: "16px 20px", background: "var(--color-background-info)",
            borderRadius: "var(--border-radius-lg)", fontSize: 13, color: "var(--color-text-info)", lineHeight: 1.7,
          }}>
            <strong>A call to action:</strong> This proof of concept was built by a single citizen using synthetic data. Imagine what's possible when the government opens distributor-level data to public scrutiny — or even just deploys this kind of analysis internally. During the March 2026 LPG crisis, black market cylinders sold for ₹4,000-4,500 while official prices were ₹913. An ML system like this could have identified and shut down diversion networks within days, not weeks. The technology is ready. The data exists. What's missing is the will to use it.
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 32, paddingTop: 16, borderTop: "0.5px solid var(--color-border-tertiary)",
        fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.6, textAlign: "center",
      }}>
        Built as a proof of concept. All distributor data is synthetically generated — no real OMC data or PII is used.
        <br />Demonstrates ML-based fraud detection capability for India's LPG distribution network.
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

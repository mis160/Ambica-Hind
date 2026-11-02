import React, { useState, useEffect } from 'react';
import './App.css';
import './SlideshowFill.css';
import ceoImage from './assets/ceo.jpg';
import LoginScreen from './LoginScreen.jsx';
import HubHome from './hub/HubHome.jsx';
import ToolsCalculators from './hub/ToolsCalculators.jsx';
import AppBackdrop from './backdrop/AppBackdrop.jsx';
import FestivalGreeting from './festive/FestivalGreeting.jsx';
import useFestival from './festive/useFestival.js';
import WireDashboard from './wire/WireDashboard.jsx';
import ProductionLinks from './hub/ProductionLinks.jsx';
import ZnoOps from './zno/ZnoOps.jsx';
import SalesZone from './sales/SalesZone.jsx';

const plantImagesModules = import.meta.glob('./assets/Plant*.{jpg,jpeg,png,JPG,PNG}', { eager: true });
const COMPANY_SLIDES = Object.values(plantImagesModules).map((mod) => ({
  url: mod.default
}));

const COMPANY_HOLIDAYS_2026 = {
  '2026-01-23': { occasion: "Saraswati Puja / Netaji's Birthday", status: 'Fully Closed' },
  '2026-01-26': { occasion: 'Republic Day (National)', status: 'Fully Closed' },
  '2026-03-03': { occasion: 'Dol Yatra', status: 'Fully Closed' },
  '2026-04-15': { occasion: 'Bengali New Year', status: 'Fully Closed' },
  '2026-05-01': { occasion: 'May Day (National)', status: 'Fully Closed' },
  '2026-08-15': { occasion: 'Independence Day (National)', status: 'Fully Closed' },
  '2026-10-18': { occasion: 'Saptami Puja', status: 'Fully Closed' },
  '2026-10-19': { occasion: 'Astami Puja', status: 'Fully Closed' },
  '2026-10-20': { occasion: 'Navami Puja', status: 'Fully Closed' },
  '2026-10-21': { occasion: 'Dasami Puja', status: 'Fully Closed' },
  '2026-11-09': { occasion: 'Diwali', status: 'Fully Closed' },
  '2026-12-25': { occasion: 'Christmas', status: 'Fully Closed' }
};

const AUTHORIZED_USERS = [
  { email: 'dev@ambahind.com', role: 'Admin', password: 'admin123' },
  { email: 'mis@ambahind.com', role: 'Admin', password: 'admin123' },
  { email: 'hr@ambahind.com', role: 'HR', password: 'hr123' },
  { email: 'sauravbubna@ambahind.com', role: 'Admin', password: 'admin123' },
  { email: 'sudiprajak@ambahind.com', role: 'HR', password: 'acc123' },
  { email: 'piyali@ambahind.com', role: 'Sales', password: 'piyali123' },
  { email: 'mkt@ambahind.com', role: 'Sales', password: 'mkt123' },
  { email: 'costing@ambahind.com', role: 'Production & Despatch', password: 'costing123' },
  { email: 'zincoxide@ambahind.com', role: 'Sales', password: 'zinc123' },
  { email: 'wire.works@ambahind.com', role: 'Production & Despatch', password: 'wire123' }
];

const PRODUCTION_API_URL = "https://script.google.com/macros/s/AKfycbxK42iczXYEHwbIEWTGQVytwqWspVVZpSAImZQbvbicvyjZ3aVoAzd25mkXu0e4-AQJ/exec?action=data";
const PAN_INDIA_API_URL = "https://script.google.com/macros/s/AKfycbxy7TO_ADeG7aU64ASkY5WRAppQhZJoAoSqzDI5PfyDg6QTABgc1nVAo8yBOheUXLP1/exec?action=data";
const RAIPUR_API_URL = "https://script.google.com/macros/s/AKfycbyH6XdwNHc-YptB6gVwX-ZKTa1OdiUxL1AWSe_WaRJNp6-5qKPrqP01x412j2BVsFWy/exec?action=data";

// HR joining-kit Apps Script (Code.gs) -> doGet ?action=hr
const HR_API_URL = "https://script.google.com/macros/s/AKfycbxcl3BNhQ56I46erm-_OpbLj_rB3B8dq4W0PwbdNXhD9infW8voeNLbNQzVOfenB2E/exec?action=hr";

const PAN_INDIA_FORM_URL = "https://script.google.com/macros/s/AKfycbxy7TO_ADeG7aU64ASkY5WRAppQhZJoAoSqzDI5PfyDg6QTABgc1nVAo8yBOheUXLP1/exec";
const RAIPUR_FORM_URL = "https://script.google.com/macros/s/AKfycbyH6XdwNHc-YptB6gVwX-ZKTa1OdiUxL1AWSe_WaRJNp6-5qKPrqP01x412j2BVsFWy/exec";

const panelStyle = { background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const thStyle = { padding: '10px' };

function App() {
  const festival = useFestival();

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('userAvatar') || '');
  const [activeModule, setActiveModule] = useState(() => localStorage.getItem('activeModule') || 'home');
  const [error, setError] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHolidayInfo, setSelectedHolidayInfo] = useState(null);

  // Production dropdown states
  const [prodUnit, setProdUnit] = useState(() => {
    const email = localStorage.getItem('userEmail');
    if (email === 'wire.works@ambahind.com') return 'Wire Plant (WD)';
    return 'Zinc Oxide (ZNO)';
  });
  const [znoSubView, setZnoSubView] = useState('crucible');

  // Live Sheet Data States
  const [liveCrucibles, setLiveCrucibles] = useState([]);
  const [liveMonthlyCosting, setLiveMonthlyCosting] = useState([]);
  const [liveProdDash, setLiveProdDash] = useState([]);
  const [livePanIndiaSales, setLivePanIndiaSales] = useState([]);
  const [liveRaipurZnSales, setLiveRaipurZnSales] = useState([]);
  const [liveRaipurPbSales, setLiveRaipurPbSales] = useState([]);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [salesErrors, setSalesErrors] = useState({ panIndia: '', raipur: '' });
  const [salesLoaded, setSalesLoaded] = useState(false);

  // HR live data (from Joining Kit Apps Script)
  const [hrData, setHrData] = useState({ candidates: [], responses: [], documents: [] });
  const [hrError, setHrError] = useState('');
  const [hrLoaded, setHrLoaded] = useState(false);
  const [hrSearch, setHrSearch] = useState('');
  const [hrReloadKey, setHrReloadKey] = useState(0);

  // Fetch production data
  useEffect(() => {
    async function fetchLiveSpreadsheetData() {
      try {
        const response = await fetch(PRODUCTION_API_URL);
        if (!response.ok) throw new Error('Server responded with status ' + response.status);
        const data = await response.json();
        if (data && data.error) throw new Error(data.error);
        if (data) {
          if (Array.isArray(data.crucibles)) setLiveCrucibles(data.crucibles);
          if (Array.isArray(data.monthlyCosting)) {
            setLiveMonthlyCosting(
              data.monthlyCosting.filter(r => (r.oxide || 0) > 0 || (r.totalCost || 0) > 0)
            );
          }
          if (Array.isArray(data.productionDashboard)) setLiveProdDash(data.productionDashboard);
        }
        setLoadError('');
      } catch (err) {
        console.error("Error loading live data from Google Sheet API:", err);
        setLoadError('Could not load live data from the Google Sheet (' + (err && err.message ? err.message : err) + ').');
      } finally {
        setDataLoaded(true);
      }
    }
    fetchLiveSpreadsheetData();
  }, []);

  // Fetch sales data
  useEffect(() => {
    async function getJson(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Server responded with status ' + response.status);
      const data = await response.json();
      if (data && data.error) throw new Error(data.error);
      return data || {};
    }
    const msg = (err) => (err && err.message ? err.message : String(err));

    async function fetchSalesData() {
      const errors = { panIndia: '', raipur: '' };

      const panIndiaJob = getJson(PAN_INDIA_API_URL)
        .then((data) => { if (Array.isArray(data.panIndiaSales)) setLivePanIndiaSales(data.panIndiaSales); })
        .catch((err) => {
          console.error('Error loading PAN India sales:', err);
          errors.panIndia = 'Could not load PAN India sales (' + msg(err) + ').';
        });

      const raipurJob = RAIPUR_API_URL
        ? getJson(RAIPUR_API_URL)
            .then((data) => {
              if (Array.isArray(data.raipurZnSales)) setLiveRaipurZnSales(data.raipurZnSales);
              if (Array.isArray(data.raipurPbSales)) setLiveRaipurPbSales(data.raipurPbSales);
            })
            .catch((err) => {
              console.error('Error loading Raipur sales:', err);
              errors.raipur = 'Could not load Raipur sales (' + msg(err) + ').';
            })
        : Promise.resolve().then(() => { errors.raipur = 'Raipur sales data source is not connected yet.'; });

      await Promise.all([panIndiaJob, raipurJob]);
      setSalesErrors(errors);
      setSalesLoaded(true);
    }
    fetchSalesData();
  }, []);

  // Fetch HR data – only when the HR tab is opened (and on Refresh)
  useEffect(() => {
    if (!isLoggedIn || activeModule !== 'hr') return;
    let cancelled = false;

    (async () => {
      try {
        setHrLoaded(false);
        const res = await fetch(HR_API_URL);
        if (!res.ok) throw new Error('Server responded with status ' + res.status);
        const data = await res.json();
        if (data && data.error) throw new Error(data.error);
        if (!cancelled) {
          setHrData({
            candidates: Array.isArray(data.candidates) ? data.candidates : [],
            responses: Array.isArray(data.responses) ? data.responses : [],
            documents: Array.isArray(data.documents) ? data.documents : []
          });
          setHrError('');
        }
      } catch (err) {
        console.error('Error loading HR data:', err);
        if (!cancelled) {
          setHrError('Could not load HR data (' + (err && err.message ? err.message : err) + ').');
        }
      } finally {
        if (!cancelled) setHrLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [activeModule, isLoggedIn, hrReloadKey]);

  const emptyMessage = (label) => {
    if (loadError) return loadError;
    if (dataLoaded) return 'No ' + label + ' found.';
    return 'Loading ' + label + '...';
  };
  const emptyColor = loadError ? '#dc2626' : '#64748b';

  useEffect(() => {
    if (COMPANY_HOLIDAYS_2026[selectedDate]) {
      setSelectedHolidayInfo(COMPANY_HOLIDAYS_2026[selectedDate]);
    } else {
      setSelectedHolidayInfo(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      const optionsDate = { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      setTimeStr(new Intl.DateTimeFormat('en-US', optionsTime).format(now));
      setDateStr(new Intl.DateTimeFormat('en-US', optionsDate).format(now));
    }, 1000);

    const slideTimer = setInterval(() => {
      if (COMPANY_SLIDES.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % COMPANY_SLIDES.length);
      }
    }, 4500);

    return () => {
      clearInterval(timer);
      clearInterval(slideTimer);
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const inputEmail = emailInput.toLowerCase().trim();
    const matchedUser = AUTHORIZED_USERS.find(
      (user) => user.email === inputEmail && user.password === password
    );

    if (matchedUser) {
      if (matchedUser.email === 'costing@ambahind.com') {
        setProdUnit('Zinc Oxide (ZNO)');
      } else if (matchedUser.email === 'wire.works@ambahind.com') {
        setProdUnit('Wire Plant (WD)');
      }

      setIsLoggedIn(true);
      setUserRole(matchedUser.role);
      setUserEmail(matchedUser.email);
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${matchedUser.email}&backgroundColor=2563eb`;
      setUserAvatar(avatarUrl);

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', matchedUser.role);
      localStorage.setItem('userEmail', matchedUser.email);
      localStorage.setItem('userAvatar', avatarUrl);

      const initialModule = matchedUser.email === 'costing@ambahind.com' ? 'production' : 'home';
      setActiveModule(initialModule);
      localStorage.setItem('activeModule', initialModule);

      setError('');
    } else {
      setError('Unauthorized email or incorrect password. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  // Specific Account User Restrictions
  const isZincOrPiyali = userEmail === 'zincoxide@ambahind.com' || userEmail === 'piyali@ambahind.com';
  const isMkt = userEmail === 'mkt@ambahind.com';
  const isRestrictedAccounts = isZincOrPiyali || isMkt;
  const isCostingUser = userEmail === 'costing@ambahind.com';
  const isWireWorksUser = userEmail === 'wire.works@ambahind.com';

  // Who can open which modules
  const canSeeProduction =
    !isRestrictedAccounts &&
    ['Admin', 'Production', 'Production & Despatch'].includes(userRole);

  const canSeePanIndia = isZincOrPiyali || (!isMkt && (userRole === 'Admin' || userRole === 'Accounts' || userRole === 'Sales'));
  const canSeeRaipur   = isMkt || (!isZincOrPiyali && (userRole === 'Admin' || userRole === 'Accounts' || userRole === 'Sales'));
  const canSeeHr = !isRestrictedAccounts && (userRole === 'Admin' || userRole === 'HR');

  // HR derived values (plain computations – no hooks)
  const hrCandidates = hrData.candidates;
  const hrDocuments = hrData.documents;
  const hrTotal = hrCandidates.length;
  const hrSubmitted = hrCandidates.filter(c => c.formStatus === 'Submitted').length;
  const hrPending = hrTotal - hrSubmitted;
  const hrQuery = hrSearch.toLowerCase().trim();
  const hrFiltered = hrCandidates.filter(c =>
    !hrQuery || [c.candidateId, c.candidateName, c.department, c.designation, c.email]
      .some(v => String(v || '').toLowerCase().includes(hrQuery))
  );

  // Look of the navigation tabs
  const navStyle = (key, color = '#2563eb') => ({
    padding: '10px 16px',
    whiteSpace: 'nowrap',
    backgroundColor: activeModule === key ? color : 'rgba(255, 255, 255, 0.92)',
    color: activeModule === key ? '#ffffff' : color,
    border: `1px solid ${color}`,
    borderBottom: `4px solid ${color}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.25)'
  });

  if (!isLoggedIn) {
    return (
      <LoginScreen
        slides={COMPANY_SLIDES}
        timeStr={timeStr}
        dateStr={dateStr}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        password={password}
        setPassword={setPassword}
        error={error}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="app-layout-wrapper">
      <AppBackdrop festival={festival} />

      {/* LEFT SIDEBAR */}
      <div className="left-sidebar-column">
        <div className="sidebar-card">
          <img src={ceoImage} alt="CEO" className="ceo-img" />
          <h4>Leadership</h4>
        </div>

        <div className="sidebar-card widget-box">
          <h4>IST Clock & Calendar</h4>
          <div className="clock-display">{timeStr || 'Loading...'}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>{dateStr}</div>

          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', display: 'block' }}>Pick Date to Check Holiday:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="calendar-input"
          />

          {selectedHolidayInfo ? (
            <div className="holiday-result-box">
              <strong>🎉 {selectedHolidayInfo.occasion}</strong><br/>
              Status: <span style={{ color: '#fef08a', fontWeight: 'bold' }}>{selectedHolidayInfo.status}</span>
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
              🏭 Regular Working Day
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="main-content-column">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', background: 'rgba(255, 255, 255, 0.95)', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: '20px', borderLeft: '6px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={userAvatar}
              alt={userRole}
              style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb', background: '#fff' }}
            />
            <div>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>AMBICA-HIND</h2>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{userEmail}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Department Access</span>
              <strong style={{ color: '#1e293b', fontSize: '14px' }}>{userRole}</strong>
            </div>
            <button onClick={handleLogout} style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Logout</button>
          </div>
        </header>

        <FestivalGreeting festival={festival} />

        {/* ===================== NAVIGATION ===================== */}
        <nav style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
          <button onClick={() => setActiveModule('home')} style={navStyle('home', '#2563eb')}>🏠 Home</button>

          {canSeeProduction && (
            <button onClick={() => setActiveModule('production')} style={navStyle('production', '#ea580c')}>Production & Despatch</button>
          )}

          {canSeePanIndia && (
            <button onClick={() => setActiveModule('panIndia')} style={navStyle('panIndia', '#16a34a')}>🌐 PAN India</button>
          )}

          {canSeeRaipur && (
            <button onClick={() => setActiveModule('raipur')} style={navStyle('raipur', '#0d9488')}>🏭 Raipur</button>
          )}

          {canSeeHr && (
            <button onClick={() => setActiveModule('hr')} style={navStyle('hr', '#7c3aed')}>HR Master</button>
          )}

          <button onClick={() => setActiveModule('tools')} style={navStyle('tools', '#0891b2')}>🧰 Tools</button>

          {!isRestrictedAccounts && (
            <button onClick={() => setActiveModule('showcase')} style={navStyle('showcase', '#db2777')}>🖼️ Company Showcase</button>
          )}
        </nav>

        {activeModule === 'home' && <HubHome userRole={userRole} userEmail={userEmail} />}

        {activeModule === 'tools' && <ToolsCalculators />}

        {/* ===================== PRODUCTION ===================== */}
        {activeModule === 'production' && canSeeProduction && (
          <div>
            <section style={{ ...panelStyle, marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Plant Production & Despatch Filter</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Manufacturing Unit</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {!isWireWorksUser && (
                      <option value="Zinc Oxide (ZNO)">Zinc Oxide (ZNO)</option>
                    )}
                    {!isCostingUser && (
                      <>
                        <option value="Wire Plant (WD)">Wire Plant (WD)</option>
                        <option value="Galvanizing (GI)">Galvanizing (GI)</option>
                      </>
                    )}
                  </select>
                </div>

                {prodUnit === 'Zinc Oxide (ZNO)' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>ZNO Workbook Module View</label>
                    <select value={znoSubView} onChange={(e) => setZnoSubView(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fef08a' }}>
                      <option value="crucible">🔥 Crucible Life & History Tracker</option>
                      <option value="monthlyCosting">📊 P5 & P7 All Costing Month Wise</option>
                      <option value="productionDash">📈 Executive Production Dashboard</option>
                      <option value="opsDash">📦 Production · Lab · Despatch Dashboard</option>
                      <option value="labReport">🧪 Lab Test Report (Grade Y / N)</option>
                      <option value="gradeReport">🏅 Grade Report (Pass / Fail reasons)</option>
                      <option value="stock">📚 Actual Stock & Stock Book</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            <ProductionLinks unit={prodUnit} />

            {prodUnit === 'Zinc Oxide (ZNO)' && znoSubView === 'crucible' && (
              <section style={{ ...panelStyle, overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>🔥 Crucible Life & History Tracker (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={thStyle}>Unit</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Active Crucible ID</th>
                      <th style={thStyle}>Running Since</th>
                      <th style={thStyle}>Days in Service</th>
                      <th style={thStyle}>Oxide to Date (KG)</th>
                      <th style={thStyle}>Recovery %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveCrucibles.length > 0 ? (
                      liveCrucibles.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.unit}</td>
                          <td style={{ padding: '10px', color: (row.status || '').includes('RUNNING') ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{row.status || '—'}</td>
                          <td style={{ padding: '10px' }}>{row.crucibleId || '—'}</td>
                          <td style={{ padding: '10px' }}>{row.runningSince || '—'}</td>
                          <td style={{ padding: '10px' }}>{row.daysInService || '—'}</td>
                          <td style={{ padding: '10px' }}>{row.oxideToDate ? Number(row.oxideToDate).toLocaleString() : '—'}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.recovery ? (Number(row.recovery) * 100).toFixed(1) + '%' : '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: emptyColor }}>{emptyMessage('crucible records')}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {prodUnit === 'Zinc Oxide (ZNO)' && znoSubView === 'monthlyCosting' && (
              <section style={{ ...panelStyle, overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>📊 P5 & P7 All Costing Month Wise (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={thStyle}>Month</th>
                      <th style={thStyle}>Dross (KG)</th>
                      <th style={thStyle}>Oxide (KG)</th>
                      <th style={thStyle}>Total Cost (₹)</th>
                      <th style={thStyle}>Cost / KG (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveMonthlyCosting.length > 0 ? (
                      liveMonthlyCosting.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.month}</td>
                          <td style={{ padding: '10px' }}>{row.dross ? Number(row.dross).toLocaleString() : '0'}</td>
                          <td style={{ padding: '10px' }}>{row.oxide ? Number(row.oxide).toLocaleString() : '0'}</td>
                          <td style={{ padding: '10px', color: '#16a34a', fontWeight: 'bold' }}>₹{row.totalCost ? Number(row.totalCost).toLocaleString() : '0'}</td>
                          <td style={{ padding: '10px', color: '#2563eb', fontWeight: 'bold' }}>₹{row.oxide > 0 && row.totalCost ? (Number(row.totalCost) / Number(row.oxide)).toFixed(2) : '0'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: emptyColor }}>{emptyMessage('monthly costing records')}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {prodUnit === 'Zinc Oxide (ZNO)' && znoSubView === 'productionDash' && (
              <section style={{ ...panelStyle, overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>📈 Executive Production Dashboard (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={thStyle}>Month</th>
                      <th style={thStyle}>Oxide Produced (KG)</th>
                      <th style={thStyle}>Total Cost (₹)</th>
                      <th style={thStyle}>Net Cost / KG (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveProdDash.length > 0 ? (
                      liveProdDash.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.month}</td>
                          <td style={{ padding: '10px' }}>{row.oxideProduced ? Number(row.oxideProduced).toLocaleString() : '0'}</td>
                          <td style={{ padding: '10px', color: '#16a34a', fontWeight: 'bold' }}>₹{row.totalCost ? Number(row.totalCost).toLocaleString() : '0'}</td>
                          <td style={{ padding: '10px', color: '#2563eb', fontWeight: 'bold' }}>₹{row.netCostPerKg ? Number(row.netCostPerKg).toFixed(2) : '0'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: emptyColor }}>{emptyMessage('production dashboard data')}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {prodUnit === 'Zinc Oxide (ZNO)' && ['opsDash', 'labReport', 'gradeReport', 'stock'].includes(znoSubView) && (
              <ZnoOps view={znoSubView} />
            )}

            {prodUnit !== 'Zinc Oxide (ZNO)' && <WireDashboard unit={prodUnit} />}
          </div>
        )}

        {/* ===================== PAN INDIA (month-wise dashboard) ===================== */}
        {activeModule === 'panIndia' && canSeePanIndia && (
          <SalesZone
            zone="panIndia"
            accent="#16a34a"
            formUrl={PAN_INDIA_FORM_URL}
            formOnly={isZincOrPiyali}
            panRows={livePanIndiaSales}
            loaded={salesLoaded}
            error={salesErrors.panIndia}
          />
        )}

        {/* ===================== RAIPUR (month-wise dashboard) ===================== */}
        {activeModule === 'raipur' && canSeeRaipur && (
          <SalesZone
            zone="raipur"
            accent="#0d9488"
            formUrl={RAIPUR_FORM_URL}
            formOnly={isMkt}
            znRows={liveRaipurZnSales}
            pbRows={liveRaipurPbSales}
            loaded={salesLoaded}
            error={salesErrors.raipur}
          />
        )}

        {/* ===================== HR (LIVE FROM JOINING KIT SHEET) ===================== */}
        {activeModule === 'hr' && canSeeHr && (
          <div>
            <div className="sales-metric-grid">
              <div className="sales-metric-card" style={{ borderLeftColor: '#7c3aed' }}>
                <h4>Total Candidates</h4>
                <div className="metric-val">{hrTotal}</div>
                <div className="metric-sub">Candidate Master</div>
              </div>
              <div className="sales-metric-card" style={{ borderLeftColor: '#16a34a' }}>
                <h4>Forms Submitted</h4>
                <div className="metric-val">{hrSubmitted}</div>
                <div className="metric-sub">{hrDocuments.length} documents uploaded</div>
              </div>
              <div className="sales-metric-card" style={{ borderLeftColor: '#ea580c' }}>
                <h4>Pending</h4>
                <div className="metric-val">{hrPending}</div>
                <div className="metric-sub">Awaiting joining form</div>
              </div>
            </div>

            <section style={{ ...panelStyle, marginBottom: '20px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>HR Employee Joining & Onboarding Master (Live from Google Sheet)</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    value={hrSearch}
                    onChange={(e) => setHrSearch(e.target.value)}
                    placeholder="Search name / ID / dept..."
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '220px' }}
                  />
                  <button
                    onClick={() => setHrReloadKey(k => k + 1)}
                    style={{ padding: '8px 14px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '950px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Dept</th>
                    <th style={thStyle}>Designation</th>
                    <th style={thStyle}>Joining Date</th>
                    <th style={thStyle}>Email Status</th>
                    <th style={thStyle}>Form</th>
                    <th style={thStyle}>Submitted On</th>
                    <th style={thStyle}>HR Verification</th>
                    <th style={thStyle}>Docs Folder</th>
                  </tr>
                </thead>
                <tbody>
                  {hrFiltered.length > 0 ? (
                    hrFiltered.map((c, idx) => (
                      <tr key={c.candidateId || idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.candidateId || '—'}</td>
                        <td style={{ padding: '10px' }}>{c.candidateName}</td>
                        <td style={{ padding: '10px' }}>{c.department}</td>
                        <td style={{ padding: '10px' }}>{c.designation}</td>
                        <td style={{ padding: '10px' }}>{c.joiningDate}</td>
                        <td style={{ padding: '10px' }}>
                          {c.emailStatus || '—'}{c.emailSentCount ? ` (${c.emailSentCount})` : ''}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: c.formStatus === 'Submitted' ? '#16a34a' : '#ea580c' }}>
                          {c.formStatus || 'Pending'}
                        </td>
                        <td style={{ padding: '10px' }}>{c.submissionDate || '—'}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{c.hrVerificationStatus || '—'}</td>
                        <td style={{ padding: '10px' }}>
                          {c.documentFolderLink
                            ? <a href={c.documentFolderLink} target="_blank" rel="noreferrer">Open ↗</a>
                            : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: hrError ? '#dc2626' : '#64748b' }}>
                        {hrError || (hrLoaded ? 'No candidates found.' : 'Loading HR data...')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section style={{ ...panelStyle, overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>📁 Document Register</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                    <th style={thStyle}>Candidate</th>
                    <th style={thStyle}>Document Type</th>
                    <th style={thStyle}>File</th>
                    <th style={thStyle}>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {hrDocuments.length > 0 ? (
                    hrDocuments.map((d, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <td style={{ padding: '10px' }}>{d.candidateName || d.candidateId}</td>
                        <td style={{ padding: '10px' }}>{d.documentType}</td>
                        <td style={{ padding: '10px' }}>
                          {d.driveFileUrl
                            ? <a href={d.driveFileUrl} target="_blank" rel="noreferrer">{d.fileName || 'View'} ↗</a>
                            : d.fileName}
                        </td>
                        <td style={{ padding: '10px' }}>{d.uploadedAt}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: hrError ? '#dc2626' : '#64748b' }}>
                        {hrError || (hrLoaded ? 'No documents yet.' : 'Loading...')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ===================== SHOWCASE ===================== */}
        {activeModule === 'showcase' && !isRestrictedAccounts && (
          <section style={{ ...panelStyle, borderRadius: '12px' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '20px' }}>AMBICA-HIND ✦ Plant Gallery & Leadership</h2>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Manufacturing facilities & leadership from <a href="https://www.ambahind.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>ambahind.com</a>.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ height: '160px', background: '#cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', border: '2px dashed #94a3b8' }}>
                  🏭 Aerial Plant View
                </div>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '16px' }}>Advanced Industrial Infrastructure</h3>
                <p style={{ color: '#475569', lineHeight: '1.5', fontSize: '13px' }}>Our expansive manufacturing units house state-of-the-art block drawing lines and high-capacity furnaces.</p>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <img src={ceoImage} alt="CEO" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb', margin: '0 auto 10px auto', display: 'block' }} />
                <h4 style={{ margin: '0 0 3px 0', color: '#1e293b', fontSize: '16px' }}>Executive Leadership</h4>
                <p style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold', margin: '0 0 8px 0' }}>Ambica-Hind Group</p>
                <p style={{ color: '#475569', lineHeight: '1.5', fontSize: '13px', textAlign: 'left' }}>Guided by experienced leadership, expanding our footprint in non-ferrous and wire manufacturing.</p>
              </div>

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ height: '160px', background: '#cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', border: '2px dashed #94a3b8' }}>
                  👥 Plant Operations & Team
                </div>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '16px' }}>Skilled Workforce & Safety Standards</h3>
                <p style={{ color: '#475569', lineHeight: '1.5', fontSize: '13px' }}>Dedicated team of engineers, operators, and safety specialists maintaining rigorous daily shift protocols.</p>
              </div>
            </div>
          </section>
        )}

        {/* BOTTOM COMPANY PHOTO SLIDESHOW */}
        <div className="bottom-slideshow-section">
          <div
            className="bottom-slideshow-container"
            style={COMPANY_SLIDES.length > 0 ? { '--slide-url': `url("${COMPANY_SLIDES[currentSlide]?.url}")` } : undefined}
          >
            {COMPANY_SLIDES.length > 0 ? (
              <img src={COMPANY_SLIDES[currentSlide]?.url} alt="Company Slide" />
            ) : (
              <p style={{ color: '#fff' }}>Loading gallery images...</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;

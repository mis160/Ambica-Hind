import React, { useState, useEffect } from 'react';
import './App.css';
import ceoImage from './assets/ceo.jpg';

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
  { email: 'sauravbubna@ambahind.com', role: 'Production', password: 'prod123' },
  { email: 'accounts.team@ambahind.com', role: 'Accounts', password: 'acc123' }
];

const PRODUCTION_API_URL = "https://script.google.com/macros/s/AKfycbxK42iczXYEHwbIEWTGQVytwqWspVVZpSAImZQbvbicvyjZ3aVoAzd25mkXu0e4-AQJ/exec?action=data";
const PAN_INDIA_API_URL = "https://script.google.com/macros/s/AKfycbxy7TO_ADeG7aU64ASkY5WRAppQhZJoAoSqzDI5PfyDg6QTABgc1nVAo8yBOheUXLP1/exec?action=data";
const RAIPUR_API_URL = "https://script.google.com/macros/s/AKfycbyH6XdwNHc-YptB6gVwX-ZKTa1OdiUxL1AWSe_WaRJNp6-5qKPrqP01x412j2BVsFWy/exec?action=data";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [activeModule, setActiveModule] = useState('production');
  const [error, setError] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHolidayInfo, setSelectedHolidayInfo] = useState(null);

  const [calcInput, setCalcInput] = useState('0');

  // Production dropdown states
  const [prodUnit, setProdUnit] = useState('Zinc Oxide (ZNO)');
  const [znoSubView, setZnoSubView] = useState('crucible');

  // Sales Sub-view state ('panIndiaDash', 'panIndiaLogs', 'raipurZnDash', 'raipurZnLogs', 'raipurPbDash', 'raipurPbLogs')
  const [salesSubView, setSalesSubView] = useState('panIndiaDash');

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

  const [joiningMaster, setJoiningMaster] = useState([
    { id: 1, candidateId: 'EMP-2026-01', name: 'Rohan Sharma', dept: 'Production', designation: 'Plant Supervisor', joiningDate: '2026-10-15', status: 'Verified & Kit Dispatched' }
  ]);
  const [newCandidateId, setNewCandidateId] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newDept, setNewDept] = useState('Production');
  const [newDesignation, setNewDesignation] = useState('');
  const [newJoiningDate, setNewJoiningDate] = useState('');
  const [newStatus, setNewStatus] = useState('Verified & Kit Dispatched');

  // Fetch all live spreadsheet datasets from Google Sheet API on load
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

  // Fetch sales data from the PAN India and Raipur web apps
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

  const emptyMessage = (label) => {
    if (loadError) return loadError;
    if (dataLoaded) return 'No ' + label + ' found.';
    return 'Loading ' + label + '...';
  };
  const emptyColor = loadError ? '#dc2626' : '#64748b';

  const salesEmptyMessage = (label, source) => {
    if (salesErrors[source]) return salesErrors[source];
    if (salesLoaded) return 'No ' + label + ' found.';
    return 'Loading ' + label + '...';
  };
  const salesEmptyColor = (source) => (salesErrors[source] ? '#dc2626' : '#64748b');

  // Helper aggregation for Top 10 Customers & Zone-wise Breakdown
  const getTopCustomers = (salesArr, limit = 10) => {
    const map = {};
    salesArr.forEach(s => {
      const name = s.customer || 'Unknown';
      const q = Number(s.qty) || 0;
      map[name] = (map[name] || 0) + q;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  };

  const getLocationBreakdown = (salesArr) => {
    const map = {};
    salesArr.forEach(s => {
      const loc = s.location || 'Kolkata';
      const q = Number(s.qty) || 0;
      map[loc] = (map[loc] || 0) + q;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

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
      setIsLoggedIn(true);
      setUserRole(matchedUser.role);
      setUserEmail(matchedUser.email);
      setUserAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${matchedUser.email}&backgroundColor=2563eb`);
      
      if (matchedUser.role === 'HR') setActiveModule('hr');
      else if (matchedUser.role === 'Production') setActiveModule('production');
      else if (matchedUser.role === 'Accounts') setActiveModule('sales');
      else setActiveModule('production');
      
      setError('');
    } else {
      setError('Unauthorized email or incorrect password. Please check your credentials.');
    }
  };

  const handleAddCandidate = (e) => {
    e.preventDefault();
    if (!newCandidateId || !newCandidateName || !newDesignation || !newJoiningDate) return;
    const newEntry = {
      id: joiningMaster.length + 1,
      candidateId: newCandidateId,
      name: newCandidateName,
      dept: newDept,
      designation: newDesignation,
      joiningDate: newJoiningDate,
      status: newStatus
    };
    setJoiningMaster([newEntry, ...joiningMaster]);
    setNewCandidateId('');
    setNewCandidateName('');
    setNewDesignation('');
    setNewJoiningDate('');
  };

  const handleCalcBtn = (val) => {
    if (val === 'C') {
      setCalcInput('0');
    } else if (val === '=') {
      try {
        // eslint-disable-next-line no-eval
        setCalcInput(String(eval(calcInput)));
      } catch {
        setCalcInput('Error');
      }
    } else {
      setCalcInput(calcInput === '0' ? val : calcInput + val);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '15px', width: '100%' }}>
        <form onSubmit={handleLogin} style={{ background: 'rgba(255, 255, 255, 0.96)', padding: '30px 20px', borderRadius: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.4)', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img 
              src={`${import.meta.env.BASE_URL}logo.png`} 
              alt="Ambica-Hind Logo" 
              style={{ width: '100%', height: 'auto', maxHeight: '75px', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
            />
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0', fontWeight: '600' }}>Enterprise Resource & Operations Suite</p>

          {error && <p style={{ color: 'red', fontSize: '12px', marginBottom: '15px', lineHeight: '1.4' }}>{error}</p>}
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>Work Email ID</label>
            <input 
              type="text" 
              placeholder="e.g. hr.manager@ambahind.com" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' }} 
            />
          </div>
          <div style={{ marginBottom: '25px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' }} 
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
            Secure Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout-wrapper">
      
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

        <div className="sidebar-card widget-box">
          <h4>Quick Calculator</h4>
          <div className="calc-screen">{calcInput}</div>
          <div className="calc-grid">
            {['7','8','9','/', '4','5','6','*', '1','2','3','-', '0','C','=','+'].map((btn) => (
              <button key={btn} onClick={() => handleCalcBtn(btn)}>{btn}</button>
            ))}
          </div>
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
            <button onClick={() => setIsLoggedIn(false)} style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Logout</button>
          </div>
        </header>

        <nav style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
          {(userRole === 'Admin' || userRole === 'Production') && (
            <button onClick={() => setActiveModule('production')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'production' ? '#2563eb' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'production' ? 'white' : '#1e293b', border: activeModule === 'production' ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>Production & Despatch</button>
          )}

          {(userRole === 'Admin' || userRole === 'Accounts') && (
            <button onClick={() => setActiveModule('sales')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'sales' ? '#2563eb' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'sales' ? 'white' : '#1e293b', border: activeModule === 'sales' ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>Zinc & PB Sales</button>
          )}

          {(userRole === 'Admin' || userRole === 'HR') && (
            <button onClick={() => setActiveModule('hr')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'hr' ? '#2563eb' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'hr' ? 'white' : '#1e293b', border: activeModule === 'hr' ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>HR Master</button>
          )}

          <button onClick={() => setActiveModule('showcase')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'showcase' ? '#0f172a' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'showcase' ? 'white' : '#0f172a', border: '1px solid #0f172a', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>🖼️ Company Showcase</button>
        </nav>

        {activeModule === 'production' && (userRole === 'Admin' || userRole === 'Production') && (
          <div>
            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Plant Production & Despatch Filter</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Manufacturing Unit</label>
                  <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Zinc Oxide (ZNO)">Zinc Oxide (ZNO)</option>
                    <option value="Wire Plant (WD)">Wire Plant (WD)</option>
                    <option value="Galvanizing (GI)">Galvanizing (GI)</option>
                  </select>
                </div>

                {prodUnit === 'Zinc Oxide (ZNO)' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>ZNO Workbook Module View</label>
                    <select value={znoSubView} onChange={(e) => setZnoSubView(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fef08a' }}>
                      <option value="crucible">🔥 Crucible Life & History Tracker</option>
                      <option value="monthlyCosting">📊 P5 & P7 All Costing Month Wise</option>
                      <option value="productionDash">📈 Executive Production Dashboard</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            {prodUnit === 'Zinc Oxide (ZNO)' && znoSubView === 'crucible' && (
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>🔥 Crucible Life & History Tracker (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Unit</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Active Crucible ID</th>
                      <th style={{ padding: '10px' }}>Running Since</th>
                      <th style={{ padding: '10px' }}>Days in Service</th>
                      <th style={{ padding: '10px' }}>Oxide to Date (KG)</th>
                      <th style={{ padding: '10px' }}>Recovery %</th>
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
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>📊 P5 & P7 All Costing Month Wise (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Month</th>
                      <th style={{ padding: '10px' }}>Dross (KG)</th>
                      <th style={{ padding: '10px' }}>Oxide (KG)</th>
                      <th style={{ padding: '10px' }}>Total Cost (₹)</th>
                      <th style={{ padding: '10px' }}>Cost / KG (₹)</th>
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
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>📈 Executive Production Dashboard (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Month</th>
                      <th style={{ padding: '10px' }}>Oxide Produced (KG)</th>
                      <th style={{ padding: '10px' }}>Total Cost (₹)</th>
                      <th style={{ padding: '10px' }}>Net Cost / KG (₹)</th>
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

            {prodUnit !== 'Zinc Oxide (ZNO)' && (
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Live Plant Production Logs for {prodUnit}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Unit</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ padding: '10px' }}>2026-10-08</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{prodUnit}</td>
                      <td style={{ padding: '10px', color: '#16a34a', fontWeight: 'bold' }}>Operational & Synced</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}

        {/* ZINC & PB SALES MODULE (SEPARATED DASHBOARDS, TOP 10, ZONE-WISE & LOGS) */}
        {activeModule === 'sales' && (userRole === 'Admin' || userRole === 'Accounts') && (
          <div>
            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Zinc & PB Sales Analytics & Region Selectors</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Sales Unit / Department Mode</label>
                  <select value={salesSubView} onChange={(e) => setSalesSubView(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#e0f2fe', fontWeight: 'bold' }}>
                    <option value="panIndiaDash">📊 PAN India — Executive Dashboard & Top 10</option>
                    <option value="panIndiaLogs">🌐 PAN India — Full Despatch Records</option>
                    <option value="raipurZnDash">📊 Raipur ZN — Executive Dashboard & Top 10</option>
                    <option value="raipurZnLogs">🏭 Raipur Zone — Zinc (ZN) Records</option>
                    <option value="raipurPbDash">📊 Raipur PB — Executive Dashboard & Top 10</option>
                    <option value="raipurPbLogs">⚖️ Raipur Zone — Lead (PB) Records</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 1. PAN INDIA DASHBOARD & TOP 10 & BREAKDOWN */}
            {salesSubView === 'panIndiaDash' && (
              <div>
                <div className="sales-metric-grid">
                  <div className="sales-metric-card">
                    <h4>Total PAN India Entries</h4>
                    <div className="metric-val">{livePanIndiaSales.length} Records</div>
                    <div className="metric-sub">Kolkata Zone / Direct Dispatch</div>
                  </div>
                  <div className="sales-metric-card" style={{ borderLeftColor: '#16a34a' }}>
                    <h4>Total Qty Despatched</h4>
                    <div className="metric-val">{(livePanIndiaSales.reduce((acc, r) => acc + (Number(r.qty) || 0), 0) / 1000).toFixed(2)} MT</div>
                    <div className="metric-sub">Cumulative tonnage</div>
                  </div>
                  <div className="sales-metric-card" style={{ borderLeftColor: '#ea580c' }}>
                    <h4>Total Sales Value</h4>
                    <div className="metric-val">₹{(livePanIndiaSales.reduce((acc, r) => acc + (Number(r.value) || 0), 0) / 100000).toFixed(2)} Lakh</div>
                    <div className="metric-sub">Total billing value</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {/* Top 10 Customers */}
                  <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>🏆 PAN India — Top 10 Customers</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '12px' }}>
                          <th style={{ padding: '8px' }}>Customer Name</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Qty (KGS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTopCustomers(livePanIndiaSales, 10).length > 0 ? (
                          getTopCustomers(livePanIndiaSales, 10).map(([cust, q], idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                              <td style={{ padding: '8px', fontWeight: 'bold' }}>{idx + 1}. {cust}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#2563eb' }}>{q.toLocaleString()} KGS</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>No customer data available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </section>

                  {/* Zone / Location Breakdown */}
                  <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>📍 PAN India — Zone / Location Breakdown</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '12px' }}>
                          <th style={{ padding: '8px' }}>Location / Zone</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Qty (KGS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getLocationBreakdown(livePanIndiaSales).length > 0 ? (
                          getLocationBreakdown(livePanIndiaSales).map(([loc, q], idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                              <td style={{ padding: '8px', fontWeight: 'bold' }}>{loc}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#16a34a' }}>{q.toLocaleString()} KGS</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>No location data available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </section>
                </div>
              </div>
            )}

            {/* 2. RAIPUR ZN DASHBOARD & TOP 10 */}
            {salesSubView === 'raipurZnDash' && (
              <div>
                <div className="sales-metric-grid">
                  <div className="sales-metric-card" style={{ borderLeftColor: '#ea580c' }}>
                    <h4>Raipur ZN Records</h4>
                    <div className="metric-val">{liveRaipurZnSales.length} Entries</div>
                    <div className="metric-sub">Zinc Despatch Department</div>
                  </div>
                  <div className="sales-metric-card" style={{ borderLeftColor: '#16a34a' }}>
                    <h4>Total ZN Qty Despatched</h4>
                    <div className="metric-val">{(liveRaipurZnSales.reduce((acc, r) => acc + (Number(r.qty) || 0), 0) / 1000).toFixed(2)} MT</div>
                    <div className="metric-sub">Cumulative tonnage</div>
                  </div>
                  <div className="sales-metric-card">
                    <h4>Total ZN Sales Value</h4>
                    <div className="metric-val">₹{(liveRaipurZnSales.reduce((acc, r) => acc + (Number(r.value) || 0), 0) / 100000).toFixed(2)} Lakh</div>
                    <div className="metric-sub">Total billing value</div>
                  </div>
                </div>

                <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>🏆 Raipur Zinc (ZN) — Top Customers</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '12px' }}>
                        <th style={{ padding: '8px' }}>Customer Name</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Qty (KGS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopCustomers(liveRaipurZnSales, 10).length > 0 ? (
                        getTopCustomers(liveRaipurZnSales, 10).map(([cust, q], idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{idx + 1}. {cust}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#2563eb' }}>{q.toLocaleString()} KGS</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>No Raipur ZN customer data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {/* 3. RAIPUR PB DASHBOARD & TOP 10 */}
            {salesSubView === 'raipurPbDash' && (
              <div>
                <div className="sales-metric-grid">
                  <div className="sales-metric-card" style={{ borderLeftColor: '#7c3aed' }}>
                    <h4>Raipur Lead (PB) Records</h4>
                    <div className="metric-val">{liveRaipurPbSales.length} Entries</div>
                    <div className="metric-sub">Lead Despatch Department</div>
                  </div>
                  <div className="sales-metric-card" style={{ borderLeftColor: '#16a34a' }}>
                    <h4>Total PB Qty Despatched</h4>
                    <div className="metric-val">{(liveRaipurPbSales.reduce((acc, r) => acc + (Number(r.qty) || 0), 0) / 1000).toFixed(2)} MT</div>
                    <div className="metric-sub">Cumulative tonnage</div>
                  </div>
                  <div className="sales-metric-card">
                    <h4>Total PB Sales Value</h4>
                    <div className="metric-val">₹{(liveRaipurPbSales.reduce((acc, r) => acc + (Number(r.value) || 0), 0) / 100000).toFixed(2)} Lakh</div>
                    <div className="metric-sub">Total billing value</div>
                  </div>
                </div>

                <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>🏆 Raipur Lead (PB) — Top Customers</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '12px' }}>
                        <th style={{ padding: '8px' }}>Customer Name</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Qty (KGS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopCustomers(liveRaipurPbSales, 10).length > 0 ? (
                        getTopCustomers(liveRaipurPbSales, 10).map(([cust, q], idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{idx + 1}. {cust}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#2563eb' }}>{q.toLocaleString()} KGS</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>No Raipur PB customer data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {/* LOG TABLES */}
            {salesSubView === 'panIndiaLogs' && (
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>🌐 PAN India Zinc Sales Records (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Business Category</th>
                      <th style={{ padding: '10px' }}>Material</th>
                      <th style={{ padding: '10px' }}>Rate (₹/KG)</th>
                      <th style={{ padding: '10px' }}>Qty (KGS)</th>
                      <th style={{ padding: '10px' }}>Billing Unit</th>
                      <th style={{ padding: '10px' }}>Total Value (₹)</th>
                      <th style={{ padding: '10px' }}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {livePanIndiaSales.length > 0 ? (
                      livePanIndiaSales.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <td style={{ padding: '10px' }}>{item.date}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.customer}</td>
                          <td style={{ padding: '10px' }}>{item.category}</td>
                          <td style={{ padding: '10px' }}>{item.material}</td>
                          <td style={{ padding: '10px' }}>₹{item.rate ? Number(item.rate).toFixed(2) : '0'}</td>
                          <td style={{ padding: '10px' }}>{item.qty ? Number(item.qty).toLocaleString() : '0'} KGS</td>
                          <td style={{ padding: '10px' }}>{item.billingUnit}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>₹{item.value ? Number(item.value).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0'}</td>
                          <td style={{ padding: '10px' }}>{item.location}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: salesEmptyColor('panIndia') }}>{salesEmptyMessage('PAN India sales records', 'panIndia')}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {salesSubView === 'raipurZnLogs' && (
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>🏭 Raipur Zone — Zinc (ZN) Sales Records (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Product</th>
                      <th style={{ padding: '10px' }}>Rate (₹/KG)</th>
                      <th style={{ padding: '10px' }}>Qty (KGS)</th>
                      <th style={{ padding: '10px' }}>Total Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveRaipurZnSales.length > 0 ? (
                      liveRaipurZnSales.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <td style={{ padding: '10px' }}>{item.date}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.customer}</td>
                          <td style={{ padding: '10px' }}>{item.product}</td>
                          <td style={{ padding: '10px' }}>₹{item.rate ? Number(item.rate).toFixed(2) : '0'}</td>
                          <td style={{ padding: '10px' }}>{item.qty ? Number(item.qty).toLocaleString() : '0'} KGS</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>₹{item.value ? Number(item.value).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: salesEmptyColor('raipur') }}>{salesEmptyMessage('Raipur Zinc sales records', 'raipur')}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {salesSubView === 'raipurPbLogs' && (
              <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>⚖️ Raipur Zone — Lead (PB) Sales Records (Live from Google Sheet)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Product</th>
                      <th style={{ padding: '10px' }}>Rate (₹/KG)</th>
                      <th style={{ padding: '10px' }}>Qty (KGS)</th>
                      <th style={{ padding: '10px' }}>Total Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveRaipurPbSales.length > 0 ? (
                      liveRaipurPbSales.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <td style={{ padding: '10px' }}>{item.date}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.customer}</td>
                          <td style={{ padding: '10px' }}>{item.product}</td>
                          <td style={{ padding: '10px' }}>₹{item.rate ? Number(item.rate).toFixed(2) : '0'}</td>
                          <td style={{ padding: '10px' }}>{item.qty ? Number(item.qty).toLocaleString() : '0'} KGS</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>₹{item.value ? Number(item.value).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: salesEmptyColor('raipur') }}>{salesEmptyMessage('Raipur Lead (PB) sales records', 'raipur')}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}

        {activeModule === 'hr' && (userRole === 'Admin' || userRole === 'HR') && (
          <div>
            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>HR Candidate Onboarding & Joining Entry</h3>
              <form onSubmit={handleAddCandidate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Candidate ID</label>
                  <input type="text" value={newCandidateId} onChange={(e) => setNewCandidateId(e.target.value)} placeholder="e.g. EMP-2026-02" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Candidate Name</label>
                  <input type="text" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} placeholder="e.g. Priya Sen" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Department</label>
                  <select value={newDept} onChange={(e) => setNewDept(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Production">Production</option>
                    <option value="Accounts">Accounts</option>
                    <option value="HR">HR</option>
                    <option value="Quality Control">Quality Control</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Designation</label>
                  <input type="text" value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} placeholder="e.g. Shift In-charge" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Joining Date</label>
                  <input type="date" value={newJoiningDate} onChange={(e) => setNewJoiningDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Onboarding Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Verification Pending">Verification Pending</option>
                    <option value="Verified & Kit Dispatched">Verified & Kit Dispatched</option>
                    <option value="Onboarding Completed">Onboarding Completed</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Register New Employee Joining
                  </button>
                </div>
              </form>
            </section>

            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>HR Employee Joining & Onboarding Master</h3>
              <p style={{ color: '#475569', marginBottom: '15px', fontSize: '13px' }}>Track candidate submissions, document verification registers, and onboarding kits.</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Dept</th>
                    <th style={{ padding: '10px' }}>Designation</th>
                    <th style={{ padding: '10px' }}>Joining Date</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {joiningMaster.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{emp.candidateId}</td>
                      <td style={{ padding: '10px' }}>{emp.name}</td>
                      <td style={{ padding: '10px' }}>{emp.dept}</td>
                      <td style={{ padding: '10px' }}>{emp.designation}</td>
                      <td style={{ padding: '10px' }}>{emp.joiningDate}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{emp.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {activeModule === 'showcase' && (
          <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
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
          <div className="bottom-slideshow-container">
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
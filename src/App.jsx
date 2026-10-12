import React, { useState, useEffect } from 'react';
import './App.css';
import ceoImage from './assets/ceo.jpg';

const plantImagesModules = import.meta.glob('./assets/Plant*.{jpg,jpeg,png,JPG,PNG}', { eager: true });
const COMPANY_SLIDES = Object.values(plantImagesModules).map((mod) => ({
  url: mod.default
}));

const HOLIDAYS = {
  wb: {
    '4-14': 'Poila Boishakh (Bengali New Year) 🌸',
    '5-9': 'Rabindra Jayanti 🎶',
    '8-22': 'Durga Puja (Maha Sasthi) 🪔',
    '10-20': 'Kali Puja / Diptotsava 🪔',
    '1-23': 'Netaji Subhas Chandra Bose Jayanti 🇮🇳'
  },
  national: {
    '1-26': 'Republic Day (India) 🇮🇳',
    '8-15': 'Independence Day (India) 🇮🇳',
    '10-2': 'Gandhi Jayanti 🇮🇳',
    '10-10': 'National Post Day 📬',
    '11-14': 'Children’s Day 👶'
  },
  international: {
    '1-1': 'New Year’s Day 🌍',
    '3-8': 'International Women’s Day 👩',
    '5-1': 'International Workers’ Day (May Day) 🛠️',
    '10-10': 'World Mental Health Day 🧠',
    '12-25': 'Christmas Day 🎄'
  }
};

const AUTHORIZED_USERS = [
  { email: 'dev@ambahind.com', role: 'Admin', password: 'admin123' },
  { email: 'mis@ambahind.com', role: 'Admin', password: 'admin123' },
  { email: 'hr@ambahind.com', role: 'HR', password: 'hr123' },
  { email: 'sauravbubna@ambahind.com', role: 'Production', password: 'prod123' },
  { email: 'accounts.team@ambahind.com', role: 'Accounts', password: 'acc123' }
];

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
  const [specialDayNote, setSpecialDayNote] = useState('');
  const [calcInput, setCalcInput] = useState('0');

  const [productionLogs, setProductionLogs] = useState([
    { id: 1, date: '2026-10-08', unit: 'Wire Plant (WD)', subDetail: 'Block 1', shift: 'Morning', prodId: 'PRD-001', loggedBy: 'Production Team' }
  ]);
  const [prodUnit, setProdUnit] = useState('Wire Plant (WD)');
  const [subDetail, setSubDetail] = useState('');
  const [shift, setShift] = useState('Morning');
  const [prodId, setProdId] = useState('');

  const [salesLogs, setSalesLogs] = useState([
    { id: 1, date: '2026-10-08', customer: 'AMBICA CHEMICALS', material: 'AMBA', qtyMT: 15, rate: 215, location: 'Kolkata', totalVal: 322500 }
  ]);
  const [customer, setCustomer] = useState('');
  const [material, setMaterial] = useState('AMBA');
  const [qtyMT, setQtyMT] = useState('');
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('Kolkata');

  const [costingLogs] = useState([
    { id: 1, date: '2026-10-08', plant: 'Zinc Oxide P5F1', mainMeterMW: 145.2, fuelOilLtr: 450, drossQty: 1200, recoveryPct: '88.5%' }
  ]);

  const [joiningMaster] = useState([
    { id: 1, candidateId: 'EMP-2026-01', name: 'Rohan Sharma', dept: 'Production', designation: 'Plant Supervisor', joiningDate: '2026-10-15', status: 'Verified & Kit Dispatched' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      const optionsDate = { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      
      setTimeStr(new Intl.DateTimeFormat('en-US', optionsTime).format(now));
      setDateStr(new Intl.DateTimeFormat('en-US', optionsDate).format(now));

      const monthKey = now.getMonth() + 1;
      const dayKey = now.getDate();
      const lookup = `${monthKey}-${dayKey}`;

      let resolvedDay = '';
      if (HOLIDAYS.wb[lookup]) {
        resolvedDay = `${HOLIDAYS.wb[lookup]} (WB)`;
      } else if (HOLIDAYS.national[lookup]) {
        resolvedDay = `${HOLIDAYS.national[lookup]} (India)`;
      } else if (HOLIDAYS.international[lookup]) {
        resolvedDay = `${HOLIDAYS.international[lookup]} (Intl)`;
      } else {
        resolvedDay = 'Regular Operations Day 🏭';
      }

      setSpecialDayNote(resolvedDay);
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

  const handleAddProduction = (e) => {
    e.preventDefault();
    if (!subDetail || !prodId) return;
    const newEntry = {
      id: productionLogs.length + 1,
      date: new Date().toISOString().split('T')[0],
      unit: prodUnit,
      subDetail: subDetail,
      shift: shift,
      prodId: prodId,
      loggedBy: userRole
    };
    setProductionLogs([newEntry, ...productionLogs]);
    setSubDetail('');
    setProdId('');
  };

  const handleAddSale = (e) => {
    e.preventDefault();
    if (!customer || !qtyMT || !rate) return;
    const calculatedValue = Number(qtyMT) * 1000 * Number(rate);
    const newSale = {
      id: salesLogs.length + 1,
      date: new Date().toISOString().split('T')[0],
      customer: customer,
      material: material,
      qtyMT: Number(qtyMT),
      rate: Number(rate),
      location: location,
      totalVal: calculatedValue
    };
    setSalesLogs([newSale, ...salesLogs]);
    setCustomer('');
    setQtyMT('');
    setRate('');
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
          <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>{dateStr}</div>
          {specialDayNote && (
            <div className="special-day-banner">
              ⭐ {specialDayNote}
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

          {userRole === 'Admin' && (
            <button onClick={() => setActiveModule('costing')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'costing' ? '#2563eb' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'costing' ? 'white' : '#1e293b', border: activeModule === 'costing' ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>Costing & Elec</button>
          )}

          {(userRole === 'Admin' || userRole === 'HR') && (
            <button onClick={() => setActiveModule('hr')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'hr' ? '#2563eb' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'hr' ? 'white' : '#1e293b', border: activeModule === 'hr' ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>HR Master</button>
          )}

          <button onClick={() => setActiveModule('showcase')} style={{ padding: '10px 16px', whiteSpace: 'nowrap', backgroundColor: activeModule === 'showcase' ? '#0f172a' : 'rgba(255, 255, 255, 0.9)', color: activeModule === 'showcase' ? 'white' : '#0f172a', border: '1px solid #0f172a', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>🖼️ Company Showcase</button>
        </nav>

        {activeModule === 'production' && (userRole === 'Admin' || userRole === 'Production') && (
          <div>
            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>New Production Entry</h3>
              <form onSubmit={handleAddProduction} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Manufacturing Unit</label>
                  <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Wire Plant (WD)">Wire Plant (WD)</option>
                    <option value="Zinc Oxide (ZNO)">Zinc Oxide (ZNO)</option>
                    <option value="Galvanizing (GI)">Galvanizing (GI)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Sub-Detail / Block</label>
                  <input type="text" value={subDetail} onChange={(e) => setSubDetail(e.target.value)} placeholder="e.g. Block 2" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Shift</label>
                  <select value={shift} onChange={(e) => setShift(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Production ID / Batch</label>
                  <input type="text" value={prodId} onChange={(e) => setProdId(e.target.value)} placeholder="e.g. PRD-102" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Add Production Log
                  </button>
                </div>
              </form>
            </section>

            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Live Plant Production Logs</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Unit</th>
                    <th style={{ padding: '10px' }}>Block</th>
                    <th style={{ padding: '10px' }}>Shift</th>
                    <th style={{ padding: '10px' }}>Prod ID</th>
                    <th style={{ padding: '10px' }}>Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  {productionLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ padding: '10px' }}>{log.date}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.unit}</td>
                      <td style={{ padding: '10px' }}>{log.subDetail}</td>
                      <td style={{ padding: '10px' }}>{log.shift}</td>
                      <td style={{ padding: '10px' }}>{log.prodId}</td>
                      <td style={{ padding: '10px' }}>{log.loggedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {activeModule === 'sales' && (userRole === 'Admin' || userRole === 'Accounts') && (
          <div>
            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>New Sales Dispatch Entry</h3>
              <form onSubmit={handleAddSale} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Customer Name</label>
                  <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Ambica Chem" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Material</label>
                  <select value={material} onChange={(e) => setMaterial(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="AMBA">AMBA</option>
                    <option value="HSC PW">HSC PW</option>
                    <option value="HZL PW">HZL PW</option>
                    <option value="Zinc Ingot">Zinc Ingot</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Quantity (MT)</label>
                  <input type="number" step="0.01" value={qtyMT} onChange={(e) => setQtyMT(e.target.value)} placeholder="e.g. 10" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Rate (₹/KG)</label>
                  <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 215" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Location</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Raipur">Raipur</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Add Sale Dispatch
                  </button>
                </div>
              </form>
            </section>

            <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Live Sales Records</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Material</th>
                    <th style={{ padding: '10px' }}>Qty (MT)</th>
                    <th style={{ padding: '10px' }}>Rate</th>
                    <th style={{ padding: '10px' }}>Total (₹)</th>
                    <th style={{ padding: '10px' }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {salesLogs.map(sale => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ padding: '10px' }}>{sale.date}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{sale.customer}</td>
                      <td style={{ padding: '10px' }}>{sale.material}</td>
                      <td style={{ padding: '10px' }}>{sale.qtyMT} MT</td>
                      <td style={{ padding: '10px' }}>₹{sale.rate}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>₹{sale.totalVal.toLocaleString()}</td>
                      <td style={{ padding: '10px' }}>{sale.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {activeModule === 'costing' && userRole === 'Admin' && (
          <section style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>Zinc Oxide & Wire Costing Dashboard</h3>
            <p style={{ color: '#475569', marginBottom: '15px', fontSize: '13px' }}>Tracking furnace electricity meter logs, fuel oil consumption, and recovery yields.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '550px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', fontSize: '13px' }}>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Plant</th>
                  <th style={{ padding: '10px' }}>Meter (MW)</th>
                  <th style={{ padding: '10px' }}>Fuel Oil</th>
                  <th style={{ padding: '10px' }}>Dross</th>
                  <th style={{ padding: '10px' }}>Recovery</th>
                </tr>
              </thead>
              <tbody>
                {costingLogs.map(cost => (
                  <tr key={cost.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <td style={{ padding: '10px' }}>{cost.date}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{cost.plant}</td>
                    <td style={{ padding: '10px' }}>{cost.mainMeterMW}</td>
                    <td style={{ padding: '10px' }}>{cost.fuelOilLtr} L</td>
                    <td style={{ padding: '10px' }}>{cost.drossQty}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>{cost.recoveryPct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeModule === 'hr' && (userRole === 'Admin' || userRole === 'HR') && (
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

        {/* BOTTOM COMPANY PHOTO SLIDESHOW (Completely clean image frame with zero text lines) */}
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
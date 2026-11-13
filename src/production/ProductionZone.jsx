import React, { useState } from 'react';
import ZnoCostingZone from './ZnoCostingZone.jsx';
import { ZnoFyDashboard, ZnoCrucibleHistory } from './ZnoDash.jsx';
import OpsZone from './OpsZone.jsx';
import WireZone from './WireZone.jsx';
import { Pills, useJson } from './prodShared.jsx';
import { OPS_API_URL, WIRE_API_URL } from './prodConfig.js';

// unit = value of the "Manufacturing Unit" dropdown in App.jsx
// zno  = { crucibles, monthly, dash, loaded, error }  (already loaded by App.jsx from the ZNO costing script;
//        dash = the "znoDash" block of that feed: FY totals, 12 months, furnaces, crucible history)
export default function ProductionZone({ unit, zno }) {
  const isZno = unit === 'Zinc Oxide (ZNO)';
  const [view, setView] = useState('cost');
  const ops = useJson(OPS_API_URL, isZno && view === 'ops');
  const wire = useJson(WIRE_API_URL, !isZno);

  if (isZno) {
    return (
      <div className="pz-root" style={{ '--pz': '#ea580c' }}>
        <Pills accent="#ea580c" value={view} onChange={setView}
          items={[['cost', '🔥 ZNO Costing & Crucibles'], ['dash', '📈 FY Dashboard'], ['cruc', '🧱 Crucibles'], ['ops', '📦 Production · Lab · Despatch']]} />
        {view === 'cost' && (
          <ZnoCostingZone crucibles={zno.crucibles} monthly={zno.monthly} loaded={zno.loaded} error={zno.error} />
        )}
        {view === 'dash' && <ZnoFyDashboard dash={zno.dash} loaded={zno.loaded} error={zno.error} />}
        {view === 'cruc' && <ZnoCrucibleHistory dash={zno.dash} loaded={zno.loaded} error={zno.error} />}
        {view === 'ops' && <OpsZone data={ops.data} loading={ops.loading} error={ops.error} reload={ops.reload} />}
      </div>
    );
  }
  return <WireZone unit={unit} data={wire.data} loading={wire.loading} error={wire.error} reload={wire.reload} />;
}

import { dayStr, tsAt, pad, corr } from './util'

export const FLOWS: Record<string, { name: string; role: string }[]> = {
  attendance: [{ name: 'Project Manager Approval', role: 'pm' }],
  progress: [{ name: 'Superior Verification', role: 'pm' }, { name: 'Project Manager Approval', role: 'pm' }],
  indent: [{ name: 'Project Manager Approval', role: 'pm' }],
  advance: [{ name: 'Supervisor Review', role: 'supervisor' }, { name: 'Project Manager Approval', role: 'pm' }, { name: 'Finance Approval', role: 'finance' }],
  expense: [{ name: 'Finance Review', role: 'finance' }],
  receipt: [{ name: 'Project Manager Review', role: 'pm' }],
  issue: [{ name: 'Project Manager Review', role: 'pm' }],
  mreturn: [{ name: 'Project Manager Review', role: 'pm' }],
  stockcount: [{ name: 'Project Manager Review', role: 'pm' }],
  transfer: [{ name: 'Project Manager Approval', role: 'pm' }],
  trip: [{ name: 'Project Manager Approval', role: 'pm' }],
  fuel: [{ name: 'Project Manager Approval', role: 'pm' }],
  leave: [{ name: 'Supervisor Approval', role: 'supervisor' }],
  tempveh: [{ name: 'Project Manager Approval', role: 'pm' }],
}
export const MODULE_OF: Record<string, string> = { attendance: 'Manpower', leave: 'Manpower', progress: 'Progress', indent: 'Materials', receipt: 'Materials', issue: 'Materials', mreturn: 'Materials', stockcount: 'Materials', transfer: 'Materials', trip: 'Transport', fuel: 'Transport', tempveh: 'Transport', advance: 'Petty Cash', expense: 'Petty Cash' }
export const COLL_OF: Record<string, string> = { attendance: 'attendance', leave: 'leaves', progress: 'progress', indent: 'indents', receipt: 'receipts', issue: 'issues', mreturn: 'mreturns', stockcount: 'stockCounts', transfer: 'transfers', trip: 'trips', fuel: 'fuel', tempveh: 'tempVeh', advance: 'advances', expense: 'expenses' }

const P = (id: string, name: string, client: string, pmId: string, status: string, s: number, e: number, budget: number, siteIds: string[]) => ({ id, name, client, pmId, status, start: dayStr(s), end: dayStr(e), budget, siteIds, costCentre: 'CC-' + id.slice(1) })
const S = (id: string, name: string, projectId: string, district: string, lat: number, lng: number, type = 'Site') => ({ id, name, projectId, district, lat, lng, type })

export function makeSeed() {
  const projects = [
    P('P1001', 'Colombo Port City – Podium Block A & B', 'Port City Colombo (Pvt) Ltd', 'EMP-0002', 'Active', -300, 240, 1850e6, ['S01', 'S02']),
    P('P1002', 'Kandy–Mahiyangana Road Rehabilitation (Sec. 3)', 'Road Development Authority', 'EMP-0009', 'Active', -210, 330, 1240e6, ['S03', 'S04']),
    P('P1003', 'Hambantota Water Treatment Plant – Phase II', 'National Water Supply & Drainage Board', 'EMP-0010', 'Active', -150, 400, 960e6, ['S05']),
    P('P1004', 'Galle Fort Heritage Hotel Refurbishment', 'Heritage Stays Lanka Ltd', 'EMP-0011', 'Active', -90, 150, 410e6, ['S06']),
    P('P1005', 'Kelani Bridge Retrofit & Approach Works', 'Road Development Authority', 'EMP-0012', 'Delayed', -400, 60, 780e6, ['S07', 'S08']),
  ]
  const sites = [
    S('S01', 'Port City – Podium Block A', 'P1001', 'Colombo', 6.9420, 79.8450), S('S02', 'Port City – Podium Block B', 'P1001', 'Colombo', 6.9395, 79.8478),
    S('S03', 'Teldeniya Chainage 12+000', 'P1002', 'Kandy', 7.2970, 80.7600), S('S04', 'Hasalaka Chainage 28+500', 'P1002', 'Kandy', 7.2650, 80.9500),
    S('S05', 'Hambantota WTP Site', 'P1003', 'Hambantota', 6.1240, 81.1190), S('S06', 'Galle Fort Heritage Site', 'P1004', 'Galle', 6.0267, 80.2170),
    S('S07', 'Kelaniya Abutment Site', 'P1005', 'Gampaha', 6.9553, 79.9220), S('S08', 'Peliyagoda Casting Yard', 'P1005', 'Colombo', 6.9640, 79.8870, 'Yard'),
    S('S09', 'Kottawa Central Store', 'P1001', 'Colombo', 6.8420, 79.9650, 'Store'),
  ]
  const wbs: any[] = [], tasks: any[] = []
  const W: Record<string, any[]> = {
    P1001: [['Substructure', 30, [['Excavation & shoring', 'm³', 4200, 3900, 20, 'S01', 'High'], ['Pile cap concrete', 'm³', 1800, 1100, 40, 'S01', 'High'], ['Waterproofing membrane', 'm²', 5200, 1300, 15, 'S02', 'Medium'], ['Rebar fixing – pile caps', 'ton', 380, 210, 25, 'S02', 'High']]],
    ['Podium Structure', 45, [['Column concrete L1–L2', 'm³', 2100, 700, 50, 'S01', 'High'], ['Slab formwork', 'm²', 9800, 2400, 30, 'S02', 'Medium']]], ['Services', 25, [['Conduit & cable tray', 'm', 6200, 0, 100, 'S01', 'Low']]]],
    P1002: [['Earthworks', 35, [['Embankment fill', 'm³', 24000, 17000, 40, 'S03', 'High'], ['Subgrade compaction', 'm²', 36000, 22000, 30, 'S04', 'Medium']]], ['Pavement', 50, [['Granular sub-base', 'm³', 9000, 3600, 40, 'S03', 'High'], ['Asphalt base course', 'm²', 28000, 3000, 50, 'S04', 'High']]], ['Drainage', 15, [['Box culvert construction', 'nos', 12, 5, 100, 'S04', 'Medium']]]],
    P1003: [['Civil – Clarifier Tanks', 55, [['Tank base slab', 'm³', 1500, 1350, 30, 'S05', 'High'], ['Tank wall concrete', 'm³', 2200, 900, 50, 'S05', 'High']]], ['Pipework', 45, [['DI pipe laying DN300', 'm', 3400, 1300, 100, 'S05', 'Medium']]]],
    P1004: [['Structural Repairs', 40, [['Masonry restoration', 'm²', 1400, 800, 60, 'S06', 'High']]], ['Finishes', 60, [['Lime plastering', 'm²', 3600, 1000, 60, 'S06', 'Medium'], ['Floor tiling', 'm²', 2200, 150, 40, 'S06', 'Low']]]],
    P1005: [['Abutment Works', 50, [['Abutment A retrofit concrete', 'm³', 900, 640, 60, 'S07', 'High'], ['Micro-pile drilling', 'm', 1600, 1500, 40, 'S07', 'High']]], ['Precast Girders', 50, [['Girder casting', 'nos', 24, 11, 70, 'S08', 'High'], ['Girder curing & QC', 'nos', 24, 9, 30, 'S08', 'Medium']]]],
  }
  let ti = 1
  Object.entries(W).forEach(([pid, ws]) => ws.forEach(([n, w, ts], wi) => {
    const id = `${pid}-0${wi + 1}`; wbs.push({ id, projectId: pid, name: n, weight: w, source: 'SAP' })
    ts.forEach(([tn, unit, planned, cum, tw, siteId, pr]) => {
      const late = (ti % 5 === 0) || pid === 'P1005' && cum / planned < 0.5
      tasks.push({ id: `TSK-${pad(ti)}`, projectId: pid, siteId, wbsId: id, name: tn, source: ti % 4 === 0 ? 'Field' : 'SAP', unit, planned, cumulative: cum, weight: tw, start: dayStr(-120), end: dayStr(late ? -5 : 60 + ti), priority: pr, status: cum >= planned ? 'Completed' : late ? 'Delayed' : cum > 0 ? 'Ongoing' : 'Not Started', engineerId: 'EMP-0013', team: 'Gang ' + String.fromCharCode(64 + ((ti % 4) + 1)) })
      ti++
    })
  }))

  const fn = ['Amal', 'Nimal', 'Kamal', 'Saman', 'Chathura', 'Isuru', 'Janaka', 'Prasad', 'Dinesh', 'Mahinda', 'Lasith', 'Thushara', 'Roshan', 'Nuwan', 'Ajith', 'Buddhika', 'Sampath', 'Kumara', 'Harsha', 'Udaya', 'Priyantha', 'Gayan', 'Sanjeewa', 'Tharanga', 'Ravindu', 'Manoj', 'Ishara', 'Anura', 'Waruna', 'Chamod']
  const ln = ['Silva', 'Perera', 'Fernando', 'Jayawardena', 'Herath', 'Wijesinghe', 'Rathnayake', 'Senanayake', 'Gamage', 'Ekanayake', 'Liyanage', 'Weerasinghe', 'Karunaratne', 'Samaranayake', 'Amarasinghe']
  const siteIdsAll = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08']
  const projOf = (sid: string) => sites.find(x => x.id === sid)!.projectId
  const core: any[] = [
    ['Nadeesha Perera', 'Systems Administrator', 'IT', 'S01', '0'], ['Eng. Dilshan Fernando', 'Project Manager', 'Engineering', 'S01', '0'], ['Kasun Jayasuriya', 'Site Foreman', 'Operations', 'S01', 'EMP-0002'],
    ['Ruwan Gunawardena', 'Storekeeper', 'Stores', 'S01', 'EMP-0003'], ['Sunil Bandara', 'Driver', 'Transport', 'S01', 'EMP-0003'], ['Anusha Wickramasinghe', 'Finance Executive', 'Finance', 'S01', '0'],
    ['Pradeep Kumara', 'Mason', 'Operations', 'S01', 'EMP-0003'], ['Rohan Samarasinghe', 'Director – Operations', 'Management', 'S01', '0'],
    ['Eng. Thilini Rajapaksa', 'Project Manager', 'Engineering', 'S03', '0'], ['Eng. Mahesh Abeysekara', 'Project Manager', 'Engineering', 'S05', '0'], ['Eng. Chaminda Silva', 'Project Manager', 'Engineering', 'S06', '0'], ['Eng. Lakmal Dissanayake', 'Project Manager', 'Engineering', 'S07', '0'],
    ['Eng. Nuwan Herath', 'Site Engineer', 'Engineering', 'S01', 'EMP-0002'], ['Bimal Ratnayake', 'Site Foreman', 'Operations', 'S03', 'EMP-0009'], ['Janith Weerasekara', 'Site Foreman', 'Operations', 'S05', 'EMP-0010'], ['Sanjaya Dias', 'Site Foreman', 'Operations', 'S07', 'EMP-0012'],
    ['Priyal Mendis', 'Driver', 'Transport', 'S03', 'EMP-0014'], ['Gihan Alwis', 'Driver', 'Transport', 'S05', 'EMP-0015'], ['Thusitha Kodikara', 'Driver', 'Transport', 'S07', 'EMP-0016'], ['Malith Gunasekara', 'Storekeeper', 'Stores', 'S05', 'EMP-0015'],
    ['Eranga Wickrama', 'Quantity Surveyor', 'Engineering', 'S01', 'EMP-0002'], ['Dulani Hettiarachchi', 'Safety Officer', 'HSE', 'S02', 'EMP-0002'], ['Rasika Pathirana', 'Crane Operator', 'Operations', 'S02', 'EMP-0003'], ['Lahiru Seneviratne', 'Steel Fixer', 'Operations', 'S02', 'EMP-0003'],
    ['Upul Tennakoon', 'Excavator Operator', 'Operations', 'S04', 'EMP-0014'], ['Sachith Nanayakkara', 'Carpenter', 'Operations', 'S06', 'EMP-0011'], ['Kavinda Ranasinghe', 'Welder', 'Operations', 'S07', 'EMP-0016'], ['Charith Vithanage', 'Electrician', 'Operations', 'S05', 'EMP-0015'],
    ['Nilanka Gomes', 'Site Engineer', 'Engineering', 'S05', 'EMP-0010'], ['Hasitha Jayaweera', 'Site Engineer', 'Engineering', 'S07', 'EMP-0012'], ['Roshani De Zoysa', 'HR Executive', 'HR', 'S01', '0'], ['Yasas Opatha', 'Mason', 'Operations', 'S06', 'EMP-0011'],
  ]
  const employees: any[] = core.map((c, i) => ({ id: 'EMP-' + pad(i + 1), name: c[0], category: 'Internal', designation: c[1], dept: c[2], siteId: c[3], projectId: projOf(c[3]), supervisorId: c[4] === '0' ? null : c[4], status: 'Active', phone: '+94 77 ' + pad(1000 + i * 37, 7).slice(0, 7), rate: /Manager|Director/.test(c[1]) ? 0 : /Engineer|Surveyor/.test(c[1]) ? 1100 : /Foreman|Operator|Driver/.test(c[1]) ? 780 : 650, source: 'HRIS' }))
  const trades = ['Mason', 'Carpenter', 'Steel Fixer', 'Helper', 'Helper', 'Welder', 'Electrician', 'Plumber', 'Machine Operator']
  const agencies = ['Lanka Manpower Services', 'Island Labour Supply', 'Ceylon Skilled Workers']
  for (let i = 0; i < 22; i++) { const sid = siteIdsAll[i % 8]; employees.push({ id: 'HL-' + pad(i + 1), name: `${fn[i]} ${ln[i % 15]}`, category: 'Hired Labour', designation: trades[i % 9], dept: 'Operations', siteId: sid, projectId: projOf(sid), supervisorId: ['EMP-0003', 'EMP-0003', 'EMP-0014', 'EMP-0014', 'EMP-0015', 'EMP-0011', 'EMP-0016', 'EMP-0016'][i % 8], status: i === 17 ? 'Inactive' : 'Active', phone: '+94 71 ' + pad(2000 + i * 53, 7).slice(0, 7), rate: 450 + (i % 4) * 40, source: 'Application', company: agencies[i % 3] }) }
  const subs = ['Rathna Steel Works', 'Kandy Earthmovers', 'Southern Formwork Co.', 'Metro Piling (Pvt) Ltd', 'Apex Electricals', 'Hela Scaffolding', 'Blue Line Plumbing', 'Ceylon Asphalt Crew']
  for (let i = 0; i < 8; i++) { const sid = siteIdsAll[i]; employees.push({ id: 'SC-' + pad(i + 1), name: `${fn[22 + i]} ${ln[(i + 3) % 15]}`, category: 'Subcontractor', designation: ['Steel Gang Lead', 'Equipment Crew', 'Formwork Carpenter', 'Piling Rig Operator', 'Electrician', 'Scaffolder', 'Plumber', 'Paving Crew Lead'][i], dept: 'Operations', siteId: sid, projectId: projOf(sid), supervisorId: ['EMP-0003', 'EMP-0014', 'EMP-0003', 'EMP-0016', 'EMP-0015', 'EMP-0011', 'EMP-0015', 'EMP-0014'][i], status: 'Active', phone: '+94 76 ' + pad(3000 + i * 71, 7).slice(0, 7), rate: 600 + i * 15, source: 'Application', company: subs[i] }) }

  const users = [
    ['U-01', 'Nadeesha Perera', 'admin', 'EMP-0001'], ['U-02', 'Eng. Dilshan Fernando', 'pm', 'EMP-0002'], ['U-03', 'Kasun Jayasuriya', 'supervisor', 'EMP-0003'], ['U-04', 'Ruwan Gunawardena', 'storekeeper', 'EMP-0004'],
    ['U-05', 'Sunil Bandara', 'driver', 'EMP-0005'], ['U-06', 'Anusha Wickramasinghe', 'finance', 'EMP-0006'], ['U-07', 'Pradeep Kumara', 'employee', 'EMP-0007'], ['U-08', 'Rohan Samarasinghe', 'management', 'EMP-0008'],
    ['U-09', 'Eng. Thilini Rajapaksa', 'pm', 'EMP-0009'], ['U-10', 'Bimal Ratnayake', 'supervisor', 'EMP-0014'], ['U-11', 'Malith Gunasekara', 'storekeeper', 'EMP-0020'], ['U-12', 'Priyal Mendis', 'driver', 'EMP-0017'], ['U-13', 'Eng. Mahesh Abeysekara', 'pm', 'EMP-0010'], ['U-14', 'Roshani De Zoysa', 'finance', 'EMP-0032'],
  ].map((u, i) => ({ id: u[0], name: u[1], role: u[2], empId: u[3], email: u[1].toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((x: string) => x !== 'eng').join('.') + '@browns-demo.lk', status: i === 13 ? 'Inactive' : 'Active', lastLogin: tsAt(-(i % 5), 9, 10 + i), lang: 'English' }))

  const allocations = employees.filter(e => e.category !== 'Internal' || e.designation.includes('Foreman')).slice(0, 18).map((e, i) => ({ id: 'ALC-' + pad(i + 1), empId: e.id, empName: e.name, projectId: e.projectId, siteId: e.siteId, supervisorId: e.supervisorId, effective: dayStr(-60 + i), end: null, by: 'EMP-0002', type: i % 6 === 5 ? 'Reallocation' : 'Allocation' }))

  const vehicles = [
    ['VEH-001', 'CAB-4521', 'Double Cab', 'Toyota', 'Hilux 2.4 GD6', 'EMP-0005', 'S01', 'Vehicle', 78, 41250, 'Active', 'FC-88121'],
    ['VEH-002', 'LH-7733', 'Tipper Truck', 'Tata', 'LPK 2518 Tipper', 'EMP-0017', 'S03', 'Vehicle', 135, 88410, 'Active', 'FC-88122'],
    ['VEH-003', 'NB-2190', 'Lorry', 'Isuzu', 'FVR 34', 'EMP-0018', 'S05', 'Vehicle', 120, 120930, 'Active', 'FC-88123'],
    ['VEH-004', 'KV-9082', 'Van', 'Toyota', 'HiAce KDH', 'EMP-0019', 'S07', 'Vehicle', 65, 66100, 'Active', 'FC-88124'],
    ['VEH-005', 'PA-3345', 'Concrete Mixer', 'Mahindra', 'Mixer 6m³', null, 'S02', 'Vehicle', 140, 54320, 'Maintenance', 'FC-88125'],
    ['VEH-006', 'EQ-EX-101', 'Excavator', 'Komatsu', 'PC200-8', 'EMP-0024', 'S04', 'Equipment', 0, 3120, 'Active', ''],
    ['VEH-007', 'EQ-CR-202', 'Mobile Crane', 'Tadano', 'GR-300EX 30t', 'EMP-0022', 'S02', 'Equipment', 0, 2210, 'Active', ''],
    ['VEH-008', 'CBB-5512', 'Double Cab', 'Mahindra', 'Scorpio Pik-Up', null, 'S06', 'Vehicle', 70, 29800, 'Available', 'FC-88128'],
    ['VEH-009', 'WP-6610', 'Water Bowser', 'Ashok Leyland', 'Ecomet 1214', null, 'S05', 'Vehicle', 95, 77540, 'Available', 'FC-88129'],
    ['VEH-010', 'GA-1204', 'Lorry', 'Tata', 'LPT 1613', null, 'S08', 'Vehicle', 110, 99120, 'Out of Service', 'FC-88130'],
    ['VEH-011', 'EQ-BH-303', 'Backhoe Loader', 'JCB', '3DX', null, 'S03', 'Equipment', 0, 4100, 'Available', ''],
  ].map(v => ({ id: v[0], reg: v[1], type: v[2], make: v[3], model: v[4], driverId: v[5], siteId: v[6], projectId: projOf(v[6] as string), kind: v[7], kmRate: v[8], odo: v[9], status: v[10], fuelCard: v[11], lastService: dayStr(-70), nextService: dayStr(((parseInt((v[0] as string).slice(4)) * 13) % 40) - 5), nextServiceKm: (v[9] as number) + 2000 }))
  // tracking positions (simulated device GPS of assigned driver)
  const tracking: Record<string, any> = {
    'VEH-001': { lat: 6.9318, lng: 79.8710, ageMin: 1, speed: 32 }, 'VEH-002': { lat: 7.2950, lng: 80.7810, ageMin: 3, speed: 41 }, 'VEH-003': { lat: 6.2010, lng: 81.0500, ageMin: 12, speed: 0 }, 'VEH-004': { lat: 6.9560, lng: 79.9101, ageMin: 46, speed: 0 },
    'VEH-006': { lat: 7.2661, lng: 80.9482, ageMin: 2, speed: 0 }, 'VEH-007': { lat: 6.9400, lng: 79.8470, ageMin: 8, speed: 0 },
  }
  const trips = [
    { ref: 'TRP-2026-0101', vehicleId: 'VEH-001', driverId: 'EMP-0005', origin: 'Port City – Block A', dest: 'Kottawa Central Store', purpose: 'Material pickup – rebar', startOdo: 41180, endOdo: null, start: tsAt(0, 8, 5), end: null, status: 'In Progress', segments: [{ siteId: 'S09', projectId: 'P1001', wbsId: 'P1001-01', costCentre: 'CC-1001', km: 0 }], txId: 'TX-DEMO-T01' },
    { ref: 'TRP-2026-0102', vehicleId: 'VEH-002', driverId: 'EMP-0017', origin: 'Teldeniya Chainage 12+000', dest: 'Hasalaka Chainage 28+500', purpose: 'Aggregate haul', startOdo: 88310, endOdo: null, start: tsAt(0, 7, 40), end: null, status: 'In Progress', segments: [{ siteId: 'S03', projectId: 'P1002', wbsId: 'P1002-02', costCentre: 'CC-1002', km: 0 }], txId: 'TX-DEMO-T02' },
    { ref: 'TRP-2026-0098', vehicleId: 'VEH-001', driverId: 'EMP-0005', origin: 'Port City – Block A', dest: 'Peliyagoda Casting Yard', purpose: 'Equipment delivery', startOdo: 41020, endOdo: 41180, start: tsAt(-1, 8, 0), end: tsAt(-1, 15, 30), status: 'Pending Approval', segments: [{ siteId: 'S08', projectId: 'P1005', wbsId: 'P1005-02', costCentre: 'CC-1005', km: 38 }, { siteId: 'S02', projectId: 'P1001', wbsId: 'P1001-02', costCentre: 'CC-1001', km: 122 }], txId: 'TX-DEMO-T03' },
    { ref: 'TRP-2026-0095', vehicleId: 'VEH-003', driverId: 'EMP-0018', origin: 'Hambantota WTP', dest: 'Galle Fort Heritage Site', purpose: 'DI pipe delivery', startOdo: 120500, endOdo: 120930, start: tsAt(-3, 6, 30), end: tsAt(-3, 14, 0), status: 'Approved', segments: [{ siteId: 'S05', projectId: 'P1003', wbsId: 'P1003-02', costCentre: 'CC-1003', km: 210 }, { siteId: 'S06', projectId: 'P1004', wbsId: 'P1004-01', costCentre: 'CC-1004', km: 220 }], txId: 'TX-DEMO-T04' },
    { ref: 'TRP-2026-0090', vehicleId: 'VEH-004', driverId: 'EMP-0019', origin: 'Kelaniya Abutment Site', dest: 'Peliyagoda Casting Yard', purpose: 'Staff transfer', startOdo: 66040, endOdo: 66100, start: tsAt(-5, 7, 30), end: tsAt(-5, 9, 0), status: 'Posted', segments: [{ siteId: 'S08', projectId: 'P1005', wbsId: 'P1005-02', costCentre: 'CC-1005', km: 60 }], txId: 'TX-DEMO-T05', postRef: 'SAP-CO-4900012871' },
  ]
  const fuel = [
    { ref: 'FUL-2026-0301', vehicleId: 'VEH-001', station: 'Ceypetco – Havelock Rd', date: dayStr(-1), type: 'Auto Diesel', litres: 42, cost: 13230, odo: 41120, photo: '', status: 'Pending Approval', tripRef: 'TRP-2026-0098', txId: 'TX-DEMO-F01' },
    { ref: 'FUL-2026-0298', vehicleId: 'VEH-002', station: 'IOC – Kandy', date: dayStr(-2), type: 'Lanka Super Diesel', litres: 95, cost: 32300, odo: 88100, photo: '', status: 'Approved', tripRef: '', txId: 'TX-DEMO-F02' },
    { ref: 'FUL-2026-0290', vehicleId: 'VEH-003', station: 'Ceypetco – Tangalle', date: dayStr(-3), type: 'Auto Diesel', litres: 120, cost: 37800, odo: 120650, photo: '', status: 'Posted', tripRef: 'TRP-2026-0095', txId: 'TX-DEMO-F03', postRef: 'SAP-CO-4900012902' },
    { ref: 'FUL-2026-0285', vehicleId: 'VEH-004', station: 'Ceypetco – Kelaniya', date: dayStr(-6), type: 'Auto Diesel', litres: 38, cost: 11970, odo: 66010, photo: '', status: 'Approved', tripRef: '', txId: 'TX-DEMO-F04' },
    { ref: 'FUL-2026-0280', vehicleId: 'VEH-006', station: 'Site Bowser Issue', date: dayStr(-4), type: 'Auto Diesel', litres: 180, cost: 56700, odo: 3100, photo: '', status: 'Pending Approval', tripRef: '', txId: 'TX-DEMO-F05' },
  ]
  const tempVeh = [
    { ref: 'TVR-2026-0021', type: 'Ride-hailing vehicle', projectId: 'P1001', siteId: 'S01', from: dayStr(1), to: dayStr(1), reason: 'Urgent QC sample delivery to lab', est: 6500, status: 'Pending Approval', by: 'EMP-0003' },
    { ref: 'TVR-2026-0020', type: 'Heavy vehicle (Low-bed trailer)', projectId: 'P1005', siteId: 'S08', from: dayStr(3), to: dayStr(4), reason: 'Precast girder transfer to Kelaniya', est: 185000, status: 'Approved', by: 'EMP-0016' },
    { ref: 'TVR-2026-0018', type: 'Temporary transportation (Bus)', projectId: 'P1003', siteId: 'S05', from: dayStr(-8), to: dayStr(-8), reason: 'Labour shuttle – vehicle breakdown', est: 28000, status: 'Rejected', by: 'EMP-0015' },
  ]
  const maintenance = [
    { ref: 'MNT-2026-0044', vehicleId: 'VEH-005', kind: 'Defect', type: 'Hydraulic drum motor leak', date: dayStr(-2), cost: 145000, status: 'Open', notes: 'Drum rotation failing under load', photo: '' },
    { ref: 'MNT-2026-0041', vehicleId: 'VEH-001', kind: 'Scheduled', type: '40,000 km service', date: dayStr(-18), cost: 38500, status: 'Closed', notes: 'Oil, filters, brake check', photo: '' },
    { ref: 'MNT-2026-0039', vehicleId: 'VEH-010', kind: 'Incident', type: 'Rear collision at yard gate', date: dayStr(-9), cost: 92000, status: 'Open', notes: 'Bumper & tail-light damage; no injuries', photo: '' },
    { ref: 'MNT-2026-0036', vehicleId: 'VEH-002', kind: 'Scheduled', type: 'Tyre rotation & brake pads', date: dayStr(-25), cost: 64000, status: 'Closed', notes: '', photo: '' },
  ]

  const mats: any[][] = [
    ['Ordinary Portland Cement 50kg', 'bag', 'Cement', 'S09', 4200, 1500, 2150, 'Active', 'OPC Grade 42.5N'], ['Reinforcement Bar Y12', 'ton', 'Steel', 'S01', 36, 15, 412000, 'Active', 'BS4449 B500B'], ['Reinforcement Bar Y16', 'ton', 'Steel', 'S01', 22, 15, 410000, 'Active', ''], ['Reinforcement Bar Y20', 'ton', 'Steel', 'S02', 9, 12, 408000, 'Active', ''],
    ['River Sand (washed)', 'm³', 'Aggregate', 'S03', 310, 120, 9800, 'Active', ''], ['Metal 20mm', 'm³', 'Aggregate', 'S03', 520, 200, 7200, 'Active', ''], ['Metal 40mm', 'm³', 'Aggregate', 'S04', 180, 150, 6900, 'Active', ''], ['Granular Sub-base ABC', 'm³', 'Aggregate', 'S04', 900, 400, 6100, 'Active', ''],
    ['Common Bricks', 'nos', 'Masonry', 'S06', 18000, 8000, 38, 'Active', ''], ['Cement Blocks 6"', 'nos', 'Masonry', 'S02', 2400, 3000, 165, 'Active', ''], ['Binding Wire 18G', 'kg', 'Steel', 'S01', 260, 100, 480, 'Active', ''], ['Scaffolding Tube 6m', 'nos', 'Formwork', 'S02', 340, 150, null, 'Active', 'Rental stock – valuation pending in SAP'],
    ['Plywood 18mm Shuttering', 'sheet', 'Formwork', 'S02', 210, 120, 8900, 'Active', ''], ['Timber 2"x4" Teak', 'ft', 'Formwork', 'S06', 1800, 800, 1150, 'Active', ''], ['Formwork Release Oil', 'litre', 'Chemicals', 'S01', 85, 100, 780, 'Active', ''], ['Concrete Admixture (Plasticiser)', 'litre', 'Chemicals', 'S05', 640, 200, 1350, 'Active', ''],
    ['Waterproofing Membrane 4mm', 'm²', 'Waterproofing', 'S02', 1900, 800, 3250, 'Active', ''], ['Bitumen VG-30', 'ton', 'Asphalt', 'S04', 18, 10, 285000, 'Active', ''], ['Asphalt Premix (AC20)', 'ton', 'Asphalt', 'S04', 55, 60, null, 'Active', 'Plant-supplied – valuation pending'], ['Geotextile Fabric', 'm²', 'Geosynthetics', 'S03', 4200, 1500, 340, 'Active', ''],
    ['DI Pipe DN300 K9', 'm', 'Pipes', 'S05', 1280, 600, 28500, 'Active', ''], ['PVC Pipe 110mm Class 4', 'm', 'Pipes', 'S05', 540, 300, 1850, 'Active', ''], ['Precast Box Culvert 2x2m', 'nos', 'Precast', 'S04', 4, 3, 620000, 'Active', ''], ['Elastomeric Bearing Pad', 'nos', 'Bridge', 'S08', 14, 16, 74000, 'Active', ''],
    ['Prestress Strand 15.2mm', 'ton', 'Bridge', 'S08', 6, 4, 920000, 'Active', ''], ['Lime Putty (Heritage grade)', 'kg', 'Finishes', 'S06', 1500, 600, 210, 'Active', ''], ['Floor Tiles 600x600 Porcelain', 'm²', 'Finishes', 'S06', 480, 400, 5400, 'Active', ''], ['Tile Adhesive 20kg', 'bag', 'Finishes', 'S06', 160, 120, 2350, 'Active', ''],
    ['Cable 4mm² 3-core', 'm', 'Electrical', 'S01', 2200, 1000, 520, 'Active', ''], ['Conduit PVC 25mm', 'm', 'Electrical', 'S01', 3000, 1500, 95, 'Active', ''], ['Safety Helmets (EN 397)', 'nos', 'PPE', 'S07', 80, 60, 1450, 'Active', ''], ['Gabion Box 2x1x1m', 'nos', 'Geosynthetics', 'S03', 0, 40, 6800, 'Inactive', 'Superseded by spec change'],
  ]
  const materials = mats.map((m, i) => ({ code: 'MAT-' + (100001 + i), name: m[0], desc: m[8], unit: m[1], cat: m[2], store: m[3], sap: m[4], delta: 0, reorder: m[5], price: m[6], status: m[7], sapSync: tsAt(0, 6, 0) }))
  const mi = (n: string) => materials.find(m => m.name.startsWith(n))!.code
  const pos = [
    { no: 'PO-4500018201', supplier: 'Tokyo Cement Lanka PLC', code: mi('Ordinary'), qty: 3000, received: 1500, siteId: 'S09', date: dayStr(-12) },
    { no: 'PO-4500018244', supplier: 'Melwa Steel (Pvt) Ltd', code: mi('Reinforcement Bar Y16'), qty: 25, received: 0, siteId: 'S01', date: dayStr(-5) },
    { no: 'PO-4500018260', supplier: 'Lanka Pipes & Fittings', code: mi('DI Pipe'), qty: 800, received: 400, siteId: 'S05', date: dayStr(-9) },
    { no: 'PO-4500018275', supplier: 'Colombo Timber Mart', code: mi('Plywood'), qty: 150, received: 0, siteId: 'S02', date: dayStr(-3) },
    { no: 'PO-4500018290', supplier: 'Shell Bitumen Lanka', code: mi('Bitumen'), qty: 20, received: 0, siteId: 'S04', date: dayStr(-2) },
  ]
  const indents = [
    { ref: 'MIN-2026-0112', date: dayStr(-1), projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-02', by: 'EMP-0003', items: [{ code: mi('Reinforcement Bar Y16'), qty: 8, unit: 'ton' }, { code: mi('Binding Wire'), qty: 120, unit: 'kg' }], required: dayStr(3), purpose: 'Column cages L1–L2', status: 'Pending Approval', docs: 1 },
    { ref: 'MIN-2026-0110', date: dayStr(-3), projectId: 'P1004', siteId: 'S06', wbsId: 'P1004-02', by: 'EMP-0011', items: [{ code: mi('Lime Putty'), qty: 400, unit: 'kg' }], required: dayStr(5), purpose: 'Plastering – east wing', status: 'Approved', docs: 0 },
    { ref: 'MIN-2026-0108', date: dayStr(-4), projectId: 'P1005', siteId: 'S08', wbsId: 'P1005-02', by: 'EMP-0016', items: [{ code: mi('Prestress'), qty: 2, unit: 'ton' }], required: dayStr(2), purpose: 'Girder G12–G14 stressing', status: 'Rejected', docs: 1 },
    { ref: 'MIN-2026-0105', date: dayStr(-6), projectId: 'P1003', siteId: 'S05', wbsId: 'P1003-02', by: 'EMP-0015', items: [{ code: mi('PVC Pipe'), qty: 100, unit: 'm' }], required: dayStr(-1), purpose: 'Bypass line', status: 'Returned', docs: 0 },
  ]
  const receipts = [
    { ref: 'GRN-2026-0201', poNo: 'PO-4500018201', supplier: 'Tokyo Cement Lanka PLC', code: mi('Ordinary'), qty: 1500, ordered: 3000, siteId: 'S09', date: dayStr(-8), discrepancy: '', photo: '', by: 'EMP-0004', status: 'Posted', postRef: 'SAP-MM-5000118820' },
    { ref: 'GRN-2026-0207', poNo: 'PO-4500018260', supplier: 'Lanka Pipes & Fittings', code: mi('DI Pipe'), qty: 392, ordered: 400, siteId: 'S05', date: dayStr(-2), discrepancy: '8 m short – damaged ends rejected', photo: '', by: 'EMP-0020', status: 'Pending Approval' },
  ]
  const issues = [
    { ref: 'ISS-2026-0501', code: mi('Reinforcement Bar Y12'), qty: 4, unit: 'ton', siteId: 'S01', projectId: 'P1001', wbsId: 'P1001-01', by: 'EMP-0004', receivedBy: 'EMP-0003', date: tsAt(-2, 9, 20), type: 'Issue', status: 'Approved' },
    { ref: 'ISS-2026-0503', code: mi('Ordinary'), qty: 300, unit: 'bag', siteId: 'S01', projectId: 'P1001', wbsId: 'P1001-02', by: 'EMP-0004', receivedBy: 'EMP-0003', date: tsAt(-1, 10, 5), type: 'Consumption', status: 'Pending Approval' },
    { ref: 'ISS-2026-0498', code: mi('Metal 20mm'), qty: 60, unit: 'm³', siteId: 'S03', projectId: 'P1002', wbsId: 'P1002-02', by: 'EMP-0020', receivedBy: 'EMP-0014', date: tsAt(-4, 8, 40), type: 'Issue', status: 'Posted', postRef: 'SAP-MM-5000118801' },
  ]
  const mreturns = [{ ref: 'RET-2026-0071', type: 'Site to Store', code: mi('Ordinary'), qty: 40, siteId: 'S01', reason: 'Unused after pour cancellation', date: dayStr(-1), status: 'Pending Approval' }, { ref: 'RET-2026-0068', type: 'Supplier', code: mi('Cement Blocks'), qty: 150, siteId: 'S02', reason: 'Cracked – supplier return', date: dayStr(-5), status: 'Approved' }]
  const stockCounts = [
    { ref: 'STK-2026-0031', code: mi('Reinforcement Bar Y20'), siteId: 'S02', sap: 9, physical: 8.2, reason: 'Off-cut waste not recorded', date: dayStr(-1), status: 'Pending Approval', by: 'EMP-0004' },
    { ref: 'STK-2026-0029', code: mi('Safety Helmets'), siteId: 'S07', sap: 80, physical: 80, reason: '', date: dayStr(-6), status: 'Approved', by: 'EMP-0016' },
  ]
  const transfers = [
    { ref: 'TRF-2026-0015', code: mi('Cement Blocks'), qty: 600, from: 'S09', to: 'S02', status: 'In Transit', date: dayStr(-1), by: 'EMP-0004', history: [['Requested', tsAt(-3, 9, 0)], ['Approved', tsAt(-3, 11, 0)], ['Dispatched', tsAt(-1, 8, 0)], ['In Transit', tsAt(-1, 8, 30)]] },
    { ref: 'TRF-2026-0013', code: mi('Binding Wire'), qty: 60, from: 'S01', to: 'S02', status: 'Requested', date: dayStr(0), by: 'EMP-0004', history: [['Requested', tsAt(0, 7, 50)]] },
  ]
  const advances = [
    { ref: 'ADV-2026-0088', empId: 'EMP-0007', projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-01', purpose: 'Emergency site purchases – hand tools', amount: 45000, required: dayStr(0), desc: 'Replace broken chisels & levels', status: 'Pending Approval', disb: null },
    { ref: 'ADV-2026-0085', empId: 'EMP-0003', projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-02', purpose: 'Labour meals & refreshments (Concrete pour)', amount: 60000, required: dayStr(-4), desc: '', status: 'Disbursed', disb: { amount: 60000, date: dayStr(-4), method: 'Cash', reference: 'DSB-77120', by: 'EMP-0006' }, settle: null },
    { ref: 'ADV-2026-0081', empId: 'EMP-0007', projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-01', purpose: 'Local transport & minor repairs', amount: 30000, required: dayStr(-14), desc: '', status: 'Settled', disb: { amount: 30000, date: dayStr(-14), method: 'Bank Transfer', reference: 'DSB-76890', by: 'EMP-0006' }, settle: { returned: 3200, excess: 0, status: 'Settled', postRef: 'SAP-FI-1800044120' } },
    { ref: 'ADV-2026-0079', empId: 'EMP-0015', projectId: 'P1003', siteId: 'S05', wbsId: 'P1003-02', purpose: 'Permit fees & courier', amount: 25000, required: dayStr(-30), desc: '', status: 'Disbursed', disb: { amount: 25000, date: dayStr(-30), method: 'Cash', reference: 'DSB-76101', by: 'EMP-0006' }, settle: null },
    { ref: 'ADV-2026-0089', empId: 'EMP-0016', projectId: 'P1005', siteId: 'S07', wbsId: 'P1005-01', purpose: 'Night shift refreshments', amount: 35000, required: dayStr(1), desc: 'Estimate low – returned to adjust', status: 'Returned', disb: null },
    { ref: 'ADV-2026-0077', empId: 'EMP-0014', projectId: 'P1002', siteId: 'S03', wbsId: 'P1002-01', purpose: 'Utility relocation consent fees', amount: 120000, required: dayStr(-10), desc: '', status: 'Approved', disb: null },
    { ref: 'ADV-2026-0072', empId: 'EMP-0011', projectId: 'P1004', siteId: 'S06', wbsId: 'P1004-01', purpose: 'Not justified', amount: 500000, required: dayStr(-20), desc: '', status: 'Rejected', disb: null },
  ]
  const expenses = [
    { ref: 'EXP-2026-0411', advRef: 'ADV-2026-0085', empId: 'EMP-0003', cat: 'Meals & Refreshments', date: dayStr(-3), desc: 'Lunch packs ×60', amount: 18000, projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-02', photo: 'demo', status: 'Approved', remarks: '' },
    { ref: 'EXP-2026-0412', advRef: 'ADV-2026-0085', empId: 'EMP-0003', cat: 'Fuel', date: dayStr(-2), desc: 'Generator diesel (also logged as FUL entry)', amount: 12500, projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-02', photo: 'demo', status: 'Pending Approval', remarks: '', fuelRef: 'FUL-2026-0301' },
    { ref: 'EXP-2026-0413', advRef: 'ADV-2026-0085', empId: 'EMP-0003', cat: 'Minor Repairs', date: dayStr(-1), desc: 'Vibrator hose replacement', amount: 9800, projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-02', photo: 'demo', status: 'Returned', remarks: 'Receipt unreadable – re-upload' },
    { ref: 'EXP-2026-0398', advRef: 'ADV-2026-0081', empId: 'EMP-0007', cat: 'Local Transport', date: dayStr(-12), desc: 'Three-wheeler hires', amount: 14500, projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-01', photo: 'demo', status: 'Approved', remarks: '' },
    { ref: 'EXP-2026-0399', advRef: 'ADV-2026-0081', empId: 'EMP-0007', cat: 'Minor Repairs', date: dayStr(-11), desc: 'Wheelbarrow tyres', amount: 12300, projectId: 'P1001', siteId: 'S01', wbsId: 'P1001-01', photo: 'demo', status: 'Approved', remarks: '' },
    { ref: 'EXP-2026-0380', advRef: 'ADV-2026-0079', empId: 'EMP-0015', cat: 'Permits & Fees', date: dayStr(-27), desc: 'Municipal permit', amount: 19000, projectId: 'P1003', siteId: 'S05', wbsId: 'P1003-02', photo: 'demo', status: 'Approved', remarks: '' },
  ]

  const attendance: any[] = []
  const mkAtt = (n: number, empId: string, off: number, inH: number, outH: number | null, status: string, extra: any = {}) => {
    const e = employees.find(x => x.id === empId)!; const s = sites.find(x => x.id === e.siteId)!
    const inn = tsAt(off, inH, (n * 7) % 40), out = outH == null ? null : tsAt(off, outH, (n * 11) % 50)
    const hrs = out ? (new Date(out).getTime() - new Date(inn).getTime()) / 36e5 - 1 : 0
    attendance.push({ ref: 'ATT-2026-' + pad(1000 + n), empId, empName: e.name, category: e.category, projectId: e.projectId, siteId: e.siteId, date: dayStr(off), in: inn, out, inLat: s.lat + 0.0003 * (n % 3), inLng: s.lng + 0.0002 * (n % 4), acc: 6 + (n % 5) * 4, inPhoto: '', outPhoto: '', method: 'Individual', by: empId, status, hours: out ? Math.min(hrs, 8) : 0, ot: out ? Math.max(0, hrs - 8) : 0, flags: [], txId: 'TX-DEMO-A' + n, ...extra })
  }
  const attEmps = ['EMP-0007', 'EMP-0003', 'HL-0001', 'HL-0002', 'HL-0009', 'HL-0010', 'SC-0001', 'SC-0003', 'EMP-0023', 'EMP-0024', 'EMP-0014', 'EMP-0027', 'HL-0003', 'HL-0004', 'HL-0005', 'EMP-0015', 'HL-0007', 'EMP-0026']
  attEmps.forEach((id, i) => {
    const off = i < 9 ? 0 : -1
    const st = i === 0 ? 'Approved' : i < 5 ? 'Pending Approval' : i < 9 ? 'Submitted' : i === 11 ? 'Rejected' : i === 12 ? 'Returned' : i < 15 ? 'Approved' : 'Posted'
    const miss = i === 4 || i === 16
    mkAtt(i + 1, id, off, 7 + (i % 3), miss ? null : 17 + (i % 3 === 0 ? 2 : 0), st, i === 14 ? { method: 'Gang', gangRef: 'GNG-0031', by: 'EMP-0003' } : i === 16 ? { flags: ['Missing check-out'] } : i === 3 ? { flags: ['Overlapping site assignment'] } : i === 6 ? { flags: ['Duplicate attendance suspected'] } : i === 7 ? { flags: ['Delayed submission (offline)'] } : {})
    if (i > 14) attendance[attendance.length - 1].postRef = 'HRIS-ACK-' + pad(88200 + i, 6)
    if (i === 4) attendance[attendance.length - 1].flags = ['Missing check-out']
  })
  const leaves = [
    { ref: 'LVE-2026-0044', empId: 'HL-0001', type: 'Casual Leave', from: dayStr(2), to: dayStr(3), days: 2, reason: 'Family function', status: 'Pending Approval' },
    { ref: 'LVE-2026-0041', empId: 'EMP-0007', type: 'Annual Leave', from: dayStr(10), to: dayStr(14), days: 5, reason: 'Pre-planned family travel', status: 'Approved' },
    { ref: 'LVE-2026-0039', empId: 'HL-0004', type: 'Medical Leave', from: dayStr(-3), to: dayStr(-2), days: 2, reason: 'Fever', status: 'Approved' },
    { ref: 'LVE-2026-0035', empId: 'SC-0001', type: 'No-pay Leave', from: dayStr(-9), to: dayStr(-9), days: 1, reason: 'Personal', status: 'Rejected' },
  ]

  const progress: any[] = []
  const mkPr = (n: number, taskId: string, daily: number, status: string, by: string, extra: any = {}) => {
    const t = tasks.find(x => x.id === taskId)!
    progress.push({ ref: 'DPR-2026-' + pad(300 + n), version: 1, projectId: t.projectId, siteId: t.siteId, wbsId: t.wbsId, taskId, date: dayStr(-(n % 4)), planned: Math.round(t.planned / 90), daily, cumulative: t.cumulative + daily, pct: Math.round(((t.cumulative + daily) / t.planned) * 100), desc: 'Completed works as per programme; QC checks passed.', remarks: '', weather: ['Sunny', 'Cloudy', 'Light rain'][n % 3], manpower: 12 + n, equipment: 'Excavator ×1, Vibrator ×2', delays: n % 4 === 0 ? 'Late delivery of rebar' : '', hindrances: '', safety: 'Toolbox talk held. No incidents.', quality: 'Slump test 95mm – OK', photos: 2, videos: n % 3 === 0 ? 1 : 0, by, status, txId: 'TX-DEMO-P' + n, history: [{ v: 1, at: tsAt(-(n % 4), 17, 0), by, note: 'Created' }], ...extra })
  }
  mkPr(1, 'TSK-0002', 45, 'Pending Approval', 'EMP-0003'); mkPr(2, 'TSK-0005', 320, 'Submitted', 'EMP-0013'); mkPr(3, 'TSK-0003', 120, 'Approved', 'EMP-0003'); mkPr(4, 'TSK-0007', 900, 'Returned', 'EMP-0014', { remarks: 'Returned: cumulative quantity does not match survey. Please recheck.' })
  mkPr(5, 'TSK-0011', 6, 'Posted', 'EMP-0015', { postRef: 'SAP-PS-7700021450' }); mkPr(6, 'TSK-0014', 40, 'Under Review', 'EMP-0011'); mkPr(7, 'TSK-0017', 1, 'Verified', 'EMP-0016'); mkPr(8, 'TSK-0012', 80, 'Draft', 'EMP-0015'); mkPr(9, 'TSK-0001', 150, 'Rejected', 'EMP-0003', { remarks: 'Rejected: wrong WBS selected.' })

  const settings = {
    company: 'Browns Engineering & Construction', timezone: 'Asia/Colombo', language: 'English', currency: 'LKR',
    regularHours: 8, otMultiplier: 1.5, otDoubleAfter: 4, workStart: '07:30', workEnd: '16:30', breakHours: 1, geoRadius: 250, accThreshold: 50, pettyCashLimit: 150000, offlineWindowDays: 3,
    flows: JSON.parse(JSON.stringify(FLOWS)),
    kmRateNote: 'Demonstration rates', hris: { host: 'hris-sim.browns.local', mode: 'SIMULATED' }, sap: { host: 's4hc-sim.browns.local', mode: 'SIMULATED', company: '1000' },
  }
  const master = {
    materialCats: ['Cement', 'Steel', 'Aggregate', 'Masonry', 'Formwork', 'Chemicals', 'Waterproofing', 'Asphalt', 'Geosynthetics', 'Pipes', 'Precast', 'Bridge', 'Finishes', 'Electrical', 'PPE'],
    expenseCats: ['Meals & Refreshments', 'Local Transport', 'Minor Repairs', 'Permits & Fees', 'Fuel', 'Stationery', 'Tools & Consumables', 'Accommodation'],
    vehicleCats: ['Double Cab', 'Tipper Truck', 'Lorry', 'Van', 'Concrete Mixer', 'Excavator', 'Mobile Crane', 'Water Bowser', 'Backhoe Loader'],
    rates: [{ id: 'R1', category: 'Internal', grade: 'Skilled', hourly: 650, effective: dayStr(-200) }, { id: 'R2', category: 'Hired Labour', grade: 'Skilled', hourly: 490, effective: dayStr(-200) }, { id: 'R3', category: 'Hired Labour', grade: 'Helper', hourly: 450, effective: dayStr(-200) }, { id: 'R4', category: 'Subcontractor', grade: 'Gang Lead', hourly: 650, effective: dayStr(-200) }],
    costCentres: projects.map(p => ({ code: p.costCentre, name: p.name.split('–')[0].trim(), projectId: p.id })),
    glAccounts: [['510100', 'Direct Labour – Site'], ['520200', 'Transport & Haulage'], ['530300', 'Site Materials Consumed'], ['540400', 'Petty Cash Expenses'], ['140500', 'Employee Advances']],
  }
  const notifications = [
    { id: 'N1', at: tsAt(0, 8, 2), type: 'Pending approval', roles: ['pm', 'supervisor', 'finance'], title: 'Approvals awaiting your action', body: 'New submissions are waiting in the Approval Centre.', read: false, link: '/app/approvals' },
    { id: 'N2', at: tsAt(0, 7, 45), type: 'Missing check-out', roles: ['supervisor', 'pm', 'admin'], title: 'Missing check-out: Hiran (HL-0005) – yesterday', body: 'No check-out recorded for ATT-2026-1005.', read: false, link: '/app/manpower' },
    { id: 'N3', at: tsAt(0, 6, 30), type: 'Material shortage', roles: ['storekeeper', 'pm'], title: 'Low stock: Reinforcement Bar Y20 (Port City B)', body: 'Available 9 ton below reorder level 12 ton.', read: false, link: '/app/materials' },
    { id: 'N4', at: tsAt(-1, 17, 10), type: 'Failed synchronization', roles: ['admin'], title: 'Device sync failed – conflicting record', body: 'TX-DEMO-CF1 conflicts with an approved record. Review in Sync Monitor.', read: false, link: '/app/sync' },
    { id: 'N5', at: tsAt(-1, 15, 0), type: 'SAP posting failure', roles: ['admin', 'finance'], title: 'SAP FI posting failed for ADV-2026-0081', body: 'Cost centre locked in S/4HANA (simulated).', read: false, link: '/app/integration' },
    { id: 'N6', at: tsAt(-2, 9, 0), type: 'Vehicle maintenance', roles: ['driver', 'admin', 'pm'], title: 'Service due: VEH-004 (KV-9082)', body: 'Scheduled service due within 5 days.', read: true, link: '/app/transport' },
    { id: 'N7', at: tsAt(-2, 8, 0), type: 'Delayed progress', roles: ['pm', 'management'], title: 'Delayed task: Girder casting (Kelani Bridge)', body: 'Task is behind programme by 11 days.', read: true, link: '/app/progress' },
    { id: 'N8', at: tsAt(-1, 12, 0), type: 'Outstanding advance', roles: ['finance', 'employee', 'management'], title: 'ADV-2026-0079 outstanding > 30 days', body: 'Permit fees & courier – settlement overdue.', read: false, link: '/app/petty' },
    { id: 'N9', at: tsAt(0, 8, 20), type: 'Stock discrepancy', roles: ['storekeeper', 'pm'], title: 'Stock variance: Rebar Y20 (-0.8 ton)', body: 'Awaiting review STK-2026-0031.', read: false, link: '/app/materials' },
    { id: 'N10', at: tsAt(0, 8, 30), type: 'Attendance irregularity', roles: ['supervisor', 'pm'], title: 'Overlapping site assignment: HL-0002', body: 'Worker scheduled at two sites on the same day.', read: false, link: '/app/manpower' },
  ]
  const integrations = [
    ['SAP S/4HANA Cloud', 'SAP', 'Projects & WBS', 'Inbound', 'Successful', 'PRJ-SYNC-20261109', ''], ['SAP S/4HANA Cloud', 'SAP', 'Materials & Stock', 'Inbound', 'Successful', 'MM-SYNC-20261109', ''], ['SAP S/4HANA Cloud', 'SAP', 'Purchase Orders', 'Inbound', 'Successful', 'PO-SYNC-20261109', ''],
    ['SAP S/4HANA Cloud', 'SAP', 'Cost Centres & GL', 'Inbound', 'Successful', 'CC-SYNC-20261109', ''], ['HRIS', 'HRIS', 'Employee Master', 'Inbound', 'Successful', 'HR-EMP-SYNC-0912', ''],
    ['SAP S/4HANA Cloud', 'SAP', 'Petty Cash', 'Outbound', 'Failed', '', 'Cost centre CC-1001 locked for posting period 11/2026 (simulated SAP error F5 201).'],
    ['SAP S/4HANA Cloud', 'SAP', 'Materials', 'Outbound', 'Successful', 'SAP-MM-5000118820', ''], ['SAP S/4HANA Cloud', 'SAP', 'Materials', 'Outbound', 'Requires Reconciliation', '', 'Gateway timeout after submit – outcome uncertain. Verify in SAP before retry.'],
    ['SAP S/4HANA Cloud', 'SAP', 'Progress', 'Outbound', 'Successful', 'SAP-PS-7700021450', ''], ['HRIS', 'HRIS', 'Attendance', 'Outbound', 'Successful', 'HRIS-ACK-088215', ''], ['SAP S/4HANA Cloud', 'SAP', 'Transport', 'Outbound', 'Successful', 'SAP-CO-4900012871', ''],
    ['HRIS', 'HRIS', 'Attendance', 'Outbound', 'Pending', '', ''],
  ].map((r, i) => ({ id: 'INT-' + pad(i + 1), name: r[0], system: r[1], module: r[2], direction: r[3], ref: r[3] === 'Inbound' ? 'BATCH-' + pad(i + 1) : ['ADV-2026-0081', 'GRN-2026-0201', 'GRN-2026-0207', 'DPR-2026-0305', 'ATT-2026-1016', 'TRP-2026-0090', 'ATT-2026-1014'][Math.min(i - 5, 6)], corr: corr(), at: tsAt(-(i % 3), 6 + (i % 10), 5 + i), status: r[4], docRef: r[5], error: r[6], simulated: true }))
  integrations[7].ref = 'GRN-2026-0207'; integrations[5].ref = 'ADV-2026-0081'; integrations[6].ref = 'GRN-2026-0201'; integrations[8].ref = 'DPR-2026-0305'; integrations[9].ref = 'ATT-2026-1016'; integrations[10].ref = 'TRP-2026-0090'; integrations[11].ref = 'ATT-2026-1002'
  const syncQueue = [
    { txId: 'TX-DEMO-CF1', type: 'attendance', label: 'Attendance – HL-0003 (offline, 2 days ago)', payload: {}, capturedAt: tsAt(-2, 8, 5), status: 'Sync Failed', error: 'Conflict: an approved attendance for HL-0003 already exists for this date (ATT-2026-1013). Nothing was overwritten – review and resolve.', role: 'supervisor', entityRef: '' },
  ]
  const audit = [
    { id: 'AUD-1', at: tsAt(-1, 9, 5), user: 'Eng. Dilshan Fernando', action: 'Approved', module: 'Materials', ref: 'MIN-2026-0110', prev: 'Pending Approval', next: 'Approved', decision: 'Approved', posting: '' },
    { id: 'AUD-2', at: tsAt(-1, 15, 4), user: 'System (SAP simulated)', action: 'Posting failed', module: 'Petty Cash', ref: 'ADV-2026-0081', prev: 'Approved', next: 'Posting Failed', decision: '', posting: '' },
    { id: 'AUD-3', at: tsAt(-2, 10, 0), user: 'Nadeesha Perera', action: 'Updated overtime multiplier', module: 'System Settings', ref: 'SETTINGS', prev: '1.25', next: '1.5', decision: '', posting: '' },
  ]
  const s: any = { version: 3, projects, sites, wbs, tasks, employees, users, allocations, attendance, leaves, vehicles, tracking, trips, fuel, tempVeh, maintenance, materials, pos, indents, receipts, issues, mreturns, stockCounts, transfers, advances, expenses, progress, settings, master, notifications, integrations, syncQueue, audit, approvals: [], device: { online: true, lang: 'en' }, stockLedger: [], lastSync: tsAt(0, 7, 58) }
  return s
}

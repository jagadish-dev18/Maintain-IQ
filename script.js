/*
 * MaintainIQ
 * A small maintenance tracker built with browser JavaScript.
 * The data lives in localStorage; there is no backend or remote service.
 */

const STORAGE_KEY = 'maintainiq-tickets-v2';
const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const RECENT_DAYS = 7;

const elements = {
  sidebar: document.getElementById('sidebar'),
  mobileScrim: document.getElementById('mobileScrim'),
  menuButton: document.getElementById('menuButton'),
  ticketModal: document.getElementById('ticketModal'),
  ticketForm: document.getElementById('ticketForm'),
  editingTicketId: document.getElementById('editingTicketId'),
  modalTitle: document.getElementById('modalTitle'),
  modalDescription: document.getElementById('modalDescription'),
  saveTicketButton: document.getElementById('saveTicketButton'),
  machineIdInput: document.getElementById('machineIdInput'),
  machineNameInput: document.getElementById('machineNameInput'),
  issueInput: document.getElementById('issueInput'),
  priorityInput: document.getElementById('priorityInput'),
  statusInput: document.getElementById('statusInput'),
  technicianInput: document.getElementById('technicianInput'),
  dueDateInput: document.getElementById('dueDateInput'),
  statsGrid: document.getElementById('statsGrid'),
  activityChart: document.getElementById('activityChart'),
  priorityDonut: document.getElementById('priorityDonut'),
  priorityLegend: document.getElementById('priorityLegend'),
  statusBars: document.getElementById('statusBars'),
  recentTicketRows: document.getElementById('recentTicketRows'),
  recentEmpty: document.getElementById('recentEmpty'),
  ticketRows: document.getElementById('ticketRows'),
  ticketSearch: document.getElementById('ticketSearch'),
  priorityFilter: document.getElementById('priorityFilter'),
  statusFilter: document.getElementById('statusFilter'),
  ticketResultCount: document.getElementById('ticketResultCount'),
  queueFooterText: document.getElementById('queueFooterText'),
  ticketsEmpty: document.getElementById('ticketsEmpty'),
  ticketsEmptyTitle: document.getElementById('ticketsEmptyTitle'),
  ticketsEmptyText: document.getElementById('ticketsEmptyText'),
  queueSummary: document.getElementById('queueSummary'),
  machineSearch: document.getElementById('machineSearch'),
  machineGrid: document.getElementById('machineGrid'),
  machineCount: document.getElementById('machineCount'),
  machinesEmpty: document.getElementById('machinesEmpty'),
  equipmentSummary: document.getElementById('equipmentSummary'),
  toastRegion: document.getElementById('toastRegion')
};

let tickets = loadTickets();
let currentView = 'overview';
let lastFocusedElement = null;
let toastCounter = 0;

function dateOffsetFromToday(offsetDays) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function makeSampleTickets() {
  return [
    { id: 'FT-1008', machineId: 'CNC-01', machineName: 'CNC Milling Machine', issue: 'Spindle vibration above normal level', priority: 'High', status: 'Open', createdAt: dateOffsetFromToday(0), technician: 'A. Mehta', dueDate: dateOffsetFromToday(1) },
    { id: 'FT-1007', machineId: 'PKG-03', machineName: 'Packaging Conveyor', issue: 'Belt alignment needs adjustment', priority: 'Medium', status: 'In Progress', createdAt: dateOffsetFromToday(-1), technician: 'S. Rao', dueDate: dateOffsetFromToday(2) },
    { id: 'FT-1006', machineId: 'CMP-02', machineName: 'Air Compressor', issue: 'Pressure reading fluctuates under load', priority: 'High', status: 'Open', createdAt: dateOffsetFromToday(-1), technician: '', dueDate: dateOffsetFromToday(0) },
    { id: 'FT-1005', machineId: 'PRS-01', machineName: 'Hydraulic Press', issue: 'Oil seepage near hose connection', priority: 'High', status: 'In Progress', createdAt: dateOffsetFromToday(-2), technician: 'K. Reddy', dueDate: dateOffsetFromToday(1) },
    { id: 'FT-1004', machineId: 'WLD-02', machineName: 'Welding Station', issue: 'Protective cover is loose', priority: 'Low', status: 'Resolved', createdAt: dateOffsetFromToday(-3), technician: 'P. Singh', dueDate: '' },
    { id: 'FT-1003', machineId: 'PKG-03', machineName: 'Packaging Conveyor', issue: 'Sensor occasionally misses cartons', priority: 'Medium', status: 'Resolved', createdAt: dateOffsetFromToday(-4), technician: 'S. Rao', dueDate: '' },
    { id: 'FT-1002', machineId: 'LAT-04', machineName: 'Precision Lathe', issue: 'Coolant flow is weaker than usual', priority: 'Medium', status: 'Open', createdAt: dateOffsetFromToday(-5), technician: '', dueDate: dateOffsetFromToday(-1) },
    { id: 'FT-1001', machineId: 'WLD-01', machineName: 'Welding Station', issue: 'Foot pedal response delayed', priority: 'Low', status: 'Resolved', createdAt: dateOffsetFromToday(-6), technician: 'P. Singh', dueDate: '' }
  ];
}

function normalizeTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') return null;

  const cleanTicket = {
    id: String(ticket.id || '').trim(),
    machineId: String(ticket.machineId || '').trim(),
    machineName: String(ticket.machineName || '').trim(),
    issue: String(ticket.issue || '').trim(),
    priority: PRIORITIES.includes(ticket.priority) ? ticket.priority : 'Medium',
    status: STATUSES.includes(ticket.status) ? ticket.status : 'Open',
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(String(ticket.createdAt || '')) ? ticket.createdAt : dateOffsetFromToday(0),
    technician: String(ticket.technician || '').trim(),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(ticket.dueDate || '')) ? ticket.dueDate : ''
  };

  if (!cleanTicket.id || !cleanTicket.machineId || !cleanTicket.machineName || !cleanTicket.issue) return null;
  return cleanTicket;
}

function loadTickets() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (savedValue !== null) {
      const parsedTickets = JSON.parse(savedValue);
      if (Array.isArray(parsedTickets)) return parsedTickets.map(normalizeTicket).filter(Boolean);
    }
  } catch (error) {
    console.warn('Saved records could not be read. Demo records are loaded instead.', error);
  }
  return makeSampleTickets();
}

function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    return true;
  } catch (error) {
    console.error('The browser could not save the records.', error);
    showToast('The change is visible, but browser storage could not save it. Check your browser settings.', 'error');
    return false;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatDate(dateText) {
  if (!dateText) return 'Not set';
  const date = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getCounts(list = tickets) {
  return {
    total: list.length,
    open: list.filter(ticket => ticket.status === 'Open').length,
    progress: list.filter(ticket => ticket.status === 'In Progress').length,
    resolved: list.filter(ticket => ticket.status === 'Resolved').length
  };
}

function getSortedTickets(list = tickets) {
  return [...list].sort((first, second) => second.createdAt.localeCompare(first.createdAt) || second.id.localeCompare(first.id));
}

function getNextTicketId() {
  const largestNumber = tickets.reduce((largest, ticket) => {
    const number = Number(ticket.id.replace('FT-', '')) || 1000;
    return Math.max(largest, number);
  }, 1000);
  return `FT-${largestNumber + 1}`;
}

function statusClass(status) {
  if (status === 'In Progress') return 'status-in-progress';
  if (status === 'Resolved') return 'status-resolved';
  return 'status-open';
}

function priorityClass(priority) {
  if (priority === 'High') return 'priority-high';
  if (priority === 'Low') return 'priority-low';
  return 'priority-medium';
}

function machineIconMarkup() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20V9.5l5 2.8V8l5 2.8V4h7v16Z"/><path d="M7 16h2m3 0h2m3 0h2M7 20v-4m5 4v-4m5 4v-4"/></svg>';
}

function actionIcon(name) {
  const icons = {
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/></svg>',
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9 7V4.5h6V7m-8 0 1 13h8l1-13M10 10v6m4-6v6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>'
  };
  return icons[name] || '';
}

function getDueDateMarkup(ticket) {
  if (!ticket.dueDate) return '<span class="muted-cell">Not set</span>';
  const today = dateOffsetFromToday(0);
  const isOverdue = ticket.status !== 'Resolved' && ticket.dueDate < today;
  return `<span class="date-cell ${isOverdue ? 'overdue' : ''}">${isOverdue ? 'Overdue · ' : ''}${escapeHtml(formatDate(ticket.dueDate))}</span>`;
}

function renderStats() {
  const counts = getCounts();
  const resolvedRate = counts.total ? Math.round((counts.resolved / counts.total) * 100) : 0;
  const cards = [
    { label: 'Total work orders', value: counts.total, note: 'All recorded equipment issues', type: 'total', icon: '<svg viewBox="0 0 24 24"><path d="M6 4.5h12A1.5 1.5 0 0 1 19.5 6v14H4.5V6A1.5 1.5 0 0 1 6 4.5Z"/><path d="M8 9h8m-8 4h8m-8 4h5"/></svg>' },
    { label: 'Open issues', value: counts.open, note: 'Waiting for the next action', type: 'open', icon: '<svg viewBox="0 0 24 24"><path d="M12 3.5 21 20H3L12 3.5Z"/><path d="M12 9v4.5m0 3h.01"/></svg>' },
    { label: 'In progress', value: counts.progress, note: 'Repair work underway', type: 'progress', icon: '<svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"/></svg>' },
    { label: 'Resolved', value: counts.resolved, note: `${resolvedRate}% of all reported work`, type: 'resolved', icon: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.2 4.2L19.5 6.5"/></svg>' }
  ];

  elements.statsGrid.innerHTML = cards.map(card => `
    <article class="metric-card metric-${card.type}">
      <div class="metric-top"><span class="metric-label">${card.label}</span><span class="metric-icon" aria-hidden="true">${card.icon}</span></div>
      <strong class="metric-value" data-count-value="${card.value}">${card.value}</strong>
      <div class="metric-foot">${card.note}</div>
    </article>`).join('');

  document.getElementById('sidebarOpenCount').textContent = counts.open;
  document.getElementById('heroResolvedRate').textContent = `${resolvedRate}%`;
  document.getElementById('heroOpenCount').textContent = `${counts.open} open`;
}

function renderActivityChart() {
  const chart = elements.activityChart;
  const dates = [];
  for (let offset = RECENT_DAYS - 1; offset >= 0; offset -= 1) dates.push(dateOffsetFromToday(-offset));

  const dailyCounts = dates.map(date => tickets.filter(ticket => ticket.createdAt === date).length);
  const weeklyTotal = dailyCounts.reduce((sum, value) => sum + value, 0);
  const activeDays = dailyCounts.filter(value => value > 0).length;
  document.getElementById('weekTotal').textContent = weeklyTotal;
  document.getElementById('weekComparison').textContent = weeklyTotal ? `${activeDays} active day${activeDays === 1 ? '' : 's'}` : 'No recent activity';

  const width = 660;
  const height = 218;
  const left = 30;
  const right = 15;
  const top = 18;
  const bottom = 31;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(4, Math.ceil(Math.max(...dailyCounts, 0) / 2) * 2);
  const points = dailyCounts.map((count, index) => ({
    x: left + (plotWidth / (dailyCounts.length - 1)) * index,
    y: top + plotHeight - (count / maxValue) * plotHeight,
    count,
    date: dates[index]
  }));
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;
  let grid = '';
  for (let row = 0; row <= 4; row += 1) {
    const y = top + (plotHeight / 4) * row;
    const label = Math.round(maxValue - (maxValue / 4) * row);
    grid += `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#e8f0eb" stroke-dasharray="4 5"/>`;
    grid += `<text x="${left - 9}" y="${y + 4}" text-anchor="end" fill="#97a79e" font-size="10">${label}</text>`;
  }
  const labels = points.map(point => {
    const date = new Date(`${point.date}T12:00:00`);
    const label = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `<text x="${point.x}" y="${height - 8}" text-anchor="middle" fill="#8d9e95" font-size="10">${label}</text>`;
  }).join('');
  const dots = points.map(point => `<g class="chart-point"><circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="4" fill="#fff" stroke="#f17c61" stroke-width="2.5"/><title>${escapeHtml(formatDate(point.date))}: ${point.count} work order(s)</title></g>`).join('');

  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="presentation" aria-hidden="true">
    <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f17c61" stop-opacity=".2"/><stop offset="100%" stop-color="#f17c61" stop-opacity="0"/></linearGradient></defs>
    ${grid}<path d="${areaPath}" fill="url(#activityFill)"/><path d="${linePath}" fill="none" stroke="#f17c61" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}
  </svg>`;
}

function renderPriorityChart() {
  const counts = {
    High: tickets.filter(ticket => ticket.priority === 'High').length,
    Medium: tickets.filter(ticket => ticket.priority === 'Medium').length,
    Low: tickets.filter(ticket => ticket.priority === 'Low').length
  };
  const total = tickets.length;
  const highPercent = total ? (counts.High / total) * 100 : 0;
  const mediumPercent = total ? (counts.Medium / total) * 100 : 0;
  const lowPercent = total ? (counts.Low / total) * 100 : 0;
  const background = total
    ? `conic-gradient(#f17c61 0 ${highPercent}%, #f4cc67 ${highPercent}% ${highPercent + mediumPercent}%, #4fb9ae ${highPercent + mediumPercent}% ${highPercent + mediumPercent + lowPercent}%)`
    : 'conic-gradient(#edf3ef 0 100%)';
  elements.priorityDonut.style.background = background;
  document.getElementById('priorityTotal').textContent = total;
  elements.priorityDonut.setAttribute('aria-label', `Priority distribution: ${counts.High} high, ${counts.Medium} medium, ${counts.Low} low work orders`);

  const colors = { High: '#f17c61', Medium: '#f4cc67', Low: '#4fb9ae' };
  elements.priorityLegend.innerHTML = PRIORITIES.map(priority => `
    <div class="legend-row"><span class="legend-dot" style="background:${colors[priority]}" aria-hidden="true"></span><span>${priority}</span><strong>${counts[priority]}</strong></div>`).join('');

  const insight = total === 0
    ? 'Add work orders to see priority insights.'
    : counts.High > 0
      ? `${counts.High} high-priority issue${counts.High === 1 ? '' : 's'} ${counts.High === 1 ? 'needs' : 'need'} attention first.`
      : 'No high-priority work orders in the current records.';
  document.getElementById('priorityInsight').innerHTML = `<span class="callout-star" aria-hidden="true">✳</span><span>${escapeHtml(insight)}</span>`;
}

function renderStatusBars() {
  const counts = getCounts();
  const rows = [
    { label: 'Open', value: counts.open, className: 'open', description: 'Waiting for action' },
    { label: 'In progress', value: counts.progress, className: 'progress', description: 'Repair underway' },
    { label: 'Resolved', value: counts.resolved, className: 'resolved', description: 'Work completed' }
  ];
  const total = counts.total || 1;
  elements.statusBars.innerHTML = rows.map(row => `
    <div class="workload-item">
      <div class="workload-top"><span>${row.label}</span><strong>${row.value}</strong></div>
      <div class="workload-track" role="progressbar" aria-label="${row.label} work orders" aria-valuemin="0" aria-valuemax="${counts.total}" aria-valuenow="${row.value}"><div class="workload-fill ${row.className}" style="width:${(row.value / total) * 100}%"></div></div>
    </div>`).join('');

  const unresolved = counts.open + counts.progress;
  document.getElementById('statusInsight').textContent = unresolved
    ? `${unresolved} work order${unresolved === 1 ? '' : 's'} still ${unresolved === 1 ? 'needs' : 'need'} follow-through.`
    : 'Every recorded work order is resolved.';
}

function machineNameMarkup(ticket) {
  return `<div class="work-order-cell"><span class="machine-mark">${machineIconMarkup()}</span><span class="work-order-copy"><strong title="${escapeHtml(ticket.machineName)}">${escapeHtml(ticket.machineName)}</strong><small>${escapeHtml(ticket.id)} · ${escapeHtml(ticket.machineId)}</small></span></div>`;
}

function renderRecentTickets() {
  const recent = getSortedTickets().slice(0, 5);
  elements.recentTicketRows.closest('.table-scroll').classList.toggle('hidden', recent.length === 0);
  elements.recentTicketRows.innerHTML = recent.map(ticket => `
    <tr>
      <td>${machineNameMarkup(ticket)}</td>
      <td><span class="priority-badge ${priorityClass(ticket.priority)}">${escapeHtml(ticket.priority)}</span></td>
      <td><span class="status-badge ${statusClass(ticket.status)}">${escapeHtml(ticket.status)}</span></td>
      <td><span class="date-cell">${escapeHtml(formatDate(ticket.createdAt))}</span></td>
      <td><div class="row-actions"><button class="row-action" type="button" data-action="edit-ticket" data-id="${escapeHtml(ticket.id)}" aria-label="Edit ${escapeHtml(ticket.id)}" title="Edit work order">${actionIcon('edit')}</button></div></td>
    </tr>`).join('');
  elements.recentEmpty.classList.toggle('hidden', recent.length > 0);
}

function getFilteredTickets() {
  const query = elements.ticketSearch.value.trim().toLowerCase();
  const priority = elements.priorityFilter.value;
  const status = elements.statusFilter.value;
  return getSortedTickets().filter(ticket => {
    const searchableText = `${ticket.id} ${ticket.machineId} ${ticket.machineName} ${ticket.issue} ${ticket.technician}`.toLowerCase();
    return (!query || searchableText.includes(query))
      && (priority === 'all' || ticket.priority === priority)
      && (status === 'all' || ticket.status === status);
  });
}

function renderQueueSummary() {
  const counts = getCounts();
  const cards = [
    { label: 'All records', value: counts.total, color: '#4fb9ae' },
    { label: 'High priority', value: tickets.filter(ticket => ticket.priority === 'High' && ticket.status !== 'Resolved').length, color: '#f17c61' },
    { label: 'In progress', value: counts.progress, color: '#f4cc67' },
    { label: 'Resolved', value: counts.resolved, color: '#7fbda8' }
  ];
  elements.queueSummary.innerHTML = cards.map(card => `<div class="queue-mini-stat"><span class="queue-mini-dot" style="background:${card.color}" aria-hidden="true"></span><div><strong>${card.value}</strong><span>${card.label}</span></div></div>`).join('');
}

function renderAllTickets() {
  const filteredTickets = getFilteredTickets();
  elements.ticketResultCount.textContent = `${filteredTickets.length} record${filteredTickets.length === 1 ? '' : 's'}`;
  elements.queueFooterText.textContent = filteredTickets.length === tickets.length
    ? `Showing all ${tickets.length} work order${tickets.length === 1 ? '' : 's'}`
    : `Showing ${filteredTickets.length} of ${tickets.length} work orders`;

  elements.ticketRows.innerHTML = filteredTickets.map(ticket => `
    <tr>
      <td>${machineNameMarkup(ticket)}<div class="issue-subline">${escapeHtml(ticket.issue)}</div></td>
      <td><span class="priority-badge ${priorityClass(ticket.priority)}">${escapeHtml(ticket.priority)}</span></td>
      <td>${ticket.technician ? `<span class="assigned-person"><span class="person-avatar">${escapeHtml(ticket.technician.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase())}</span>${escapeHtml(ticket.technician)}</span>` : '<span class="muted-cell">Unassigned</span>'}</td>
      <td>${getDueDateMarkup(ticket)}</td>
      <td><label class="sr-only" for="status-${escapeHtml(ticket.id)}">Change status for ${escapeHtml(ticket.id)}</label><select class="status-select ${statusClass(ticket.status)}" id="status-${escapeHtml(ticket.id)}" data-action="change-status" data-id="${escapeHtml(ticket.id)}"><option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option><option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In progress</option><option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option></select></td>
      <td><div class="row-actions"><button class="row-action" type="button" data-action="edit-ticket" data-id="${escapeHtml(ticket.id)}" aria-label="Edit ${escapeHtml(ticket.id)}" title="Edit work order">${actionIcon('edit')}</button><button class="row-action danger" type="button" data-action="delete-ticket" data-id="${escapeHtml(ticket.id)}" aria-label="Delete ${escapeHtml(ticket.id)}" title="Delete work order">${actionIcon('delete')}</button></div></td>
    </tr>`).join('');

  const hasResults = filteredTickets.length > 0;
  elements.ticketsEmpty.classList.toggle('hidden', hasResults);
  elements.ticketRows.closest('.table-scroll').classList.toggle('hidden', !hasResults);
  elements.ticketsEmptyTitle.textContent = tickets.length ? 'No matching work orders' : 'No work orders yet';
  elements.ticketsEmptyText.textContent = tickets.length
    ? 'Try changing your search or filters to find the record.'
    : 'Create your first work order to start tracking maintenance.';
  elements.emptyResetButton.classList.toggle('hidden', !tickets.length);
}

function getMachineSummary() {
  const machineMap = new Map();
  tickets.forEach(ticket => {
    const key = ticket.machineId.toLowerCase();
    if (!machineMap.has(key)) {
      machineMap.set(key, { machineId: ticket.machineId, machineName: ticket.machineName, tickets: [] });
    }
    machineMap.get(key).tickets.push(ticket);
  });
  return [...machineMap.values()].map(machine => {
    const open = machine.tickets.filter(ticket => ticket.status === 'Open');
    const progress = machine.tickets.filter(ticket => ticket.status === 'In Progress');
    const resolved = machine.tickets.filter(ticket => ticket.status === 'Resolved');
    const highOpen = open.filter(ticket => ticket.priority === 'High').length;
    const latestTicket = [...machine.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    let health = 'Clear';
    if (highOpen || open.length) health = 'Needs attention';
    else if (progress.length) health = 'Work underway';
    return { ...machine, open: open.length, progress: progress.length, resolved: resolved.length, highOpen, health, latestDate: latestTicket.createdAt };
  }).sort((a, b) => Number(b.open > 0) - Number(a.open > 0) || b.tickets.length - a.tickets.length || a.machineName.localeCompare(b.machineName));
}

function renderMachines() {
  const query = elements.machineSearch.value.trim().toLowerCase();
  const machines = getMachineSummary().filter(machine => `${machine.machineId} ${machine.machineName}`.toLowerCase().includes(query));
  const totalTickets = tickets.length;
  const openIssues = tickets.filter(ticket => ticket.status === 'Open').length;
  elements.equipmentSummary.innerHTML = `<div><strong>Equipment at a glance</strong><p>Machine health is inferred from the work orders saved in this workspace.</p></div><div class="equipment-intro-stat"><strong>${getMachineSummary().length}</strong><span>machines referenced</span></div><div class="equipment-intro-stat"><strong>${openIssues}</strong><span>open issues</span></div><div class="equipment-intro-stat"><strong>${totalTickets}</strong><span>work orders</span></div>`;
  elements.machineCount.textContent = `${machines.length} machine${machines.length === 1 ? '' : 's'}`;

  elements.machineGrid.innerHTML = machines.map((machine, index) => {
    const healthClass = machine.health === 'Needs attention' ? 'health-attention' : machine.health === 'Work underway' ? 'health-active' : 'health-clear';
    const ticketWord = machine.tickets.length === 1 ? 'work order' : 'work orders';
    return `<article class="equipment-card" style="animation-delay:${Math.min(index * 35, 210)}ms">
      <div class="equipment-card-top"><span class="equipment-icon">${machineIconMarkup()}</span><span class="equipment-health ${healthClass}">${escapeHtml(machine.health)}</span></div>
      <h3>${escapeHtml(machine.machineName)}</h3><div class="equipment-id">${escapeHtml(machine.machineId)}</div>
      <div class="equipment-card-meta"><div class="equipment-meta-cell"><span>Open issues</span><strong>${machine.open}</strong></div><div class="equipment-meta-cell"><span>Resolved</span><strong>${machine.resolved}</strong></div><div class="equipment-meta-cell"><span>In progress</span><strong>${machine.progress}</strong></div><div class="equipment-meta-cell"><span>Latest report</span><strong>${escapeHtml(formatDate(machine.latestDate))}</strong></div></div>
      <div class="equipment-card-footer"><span>${machine.tickets.length} ${ticketWord}</span><button class="button button-secondary" type="button" data-action="machine-ticket" data-machine-id="${escapeHtml(machine.machineId)}" data-machine-name="${escapeHtml(machine.machineName)}">Report a fault +</button></div>
    </article>`;
  }).join('');
  elements.machinesEmpty.classList.toggle('hidden', machines.length > 0);
  elements.machineGrid.classList.toggle('hidden', machines.length === 0);
}

function renderApp() {
  renderStats();
  renderActivityChart();
  renderPriorityChart();
  renderStatusBars();
  renderRecentTickets();
  renderQueueSummary();
  renderAllTickets();
  renderMachines();
}

function updateView(viewName) {
  const validViews = ['overview', 'tickets', 'machines'];
  if (!validViews.includes(viewName)) return;
  currentView = viewName;

  document.querySelectorAll('[data-section]').forEach(section => {
    const isActive = section.dataset.section === viewName;
    section.hidden = !isActive;
    section.classList.toggle('active', isActive);
  });
  document.querySelectorAll('[data-view]').forEach(button => {
    const isActive = button.dataset.view === viewName;
    button.classList.toggle('active', isActive);
    if (button.matches('button.nav-link')) {
      if (isActive) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  });
  document.getElementById('currentPageName').textContent = viewName === 'overview' ? 'Overview' : viewName === 'tickets' ? 'Work orders' : 'Equipment';
  closeMobileNavigation();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, type = 'success') {
  const toastId = `toast-${++toastCounter}`;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.id = toastId;
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${type === 'error' ? '!' : '✓'}</span><span class="toast-message">${escapeHtml(message)}</span><button type="button" class="toast-close" aria-label="Dismiss message">×</button>`;
  elements.toastRegion.appendChild(toast);
  const removeToast = () => toast.remove();
  toast.querySelector('.toast-close').addEventListener('click', removeToast);
  window.setTimeout(removeToast, 4200);
}

function clearFormErrors() {
  ['machineId', 'machineName', 'issue'].forEach(field => {
    document.getElementById(`${field}Error`).textContent = '';
    const input = document.getElementById(`${field}Input`);
    input.removeAttribute('aria-invalid');
  });
}

function openModal(ticketId = null, prefillMachine = null) {
  lastFocusedElement = document.activeElement;
  clearFormErrors();
  elements.ticketForm.reset();
  elements.editingTicketId.value = '';
  elements.priorityInput.value = 'Medium';
  elements.statusInput.value = 'Open';
  elements.dueDateInput.min = dateOffsetFromToday(-3650);

  if (ticketId) {
    const ticket = tickets.find(item => item.id === ticketId);
    if (!ticket) return;
    elements.editingTicketId.value = ticket.id;
    elements.machineIdInput.value = ticket.machineId;
    elements.machineNameInput.value = ticket.machineName;
    elements.issueInput.value = ticket.issue;
    elements.priorityInput.value = ticket.priority;
    elements.statusInput.value = ticket.status;
    elements.technicianInput.value = ticket.technician;
    elements.dueDateInput.value = ticket.dueDate;
    elements.modalTitle.textContent = `Edit ${ticket.id}`;
    elements.modalDescription.textContent = 'Update the details or move the work order to its next stage.';
    elements.saveTicketButton.innerHTML = 'Save changes <span aria-hidden="true">→</span>';
  } else {
    elements.modalTitle.textContent = 'Report an issue';
    elements.modalDescription.textContent = 'Capture the details so the team knows what needs attention.';
    elements.saveTicketButton.innerHTML = 'Save work order <span aria-hidden="true">→</span>';
    if (prefillMachine) {
      elements.machineIdInput.value = prefillMachine.machineId || '';
      elements.machineNameInput.value = prefillMachine.machineName || '';
    }
  }

  elements.ticketModal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => elements.machineIdInput.focus(), 30);
}

function closeModal() {
  if (elements.ticketModal.hidden) return;
  elements.ticketModal.hidden = true;
  document.body.classList.remove('modal-open');
  clearFormErrors();
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
}

function validateTicketForm(data) {
  const errors = {};
  if (!data.machineId) errors.machineId = 'Enter a machine ID.';
  else if (data.machineId.length > 24) errors.machineId = 'Keep the machine ID under 25 characters.';
  if (!data.machineName) errors.machineName = 'Enter the machine name.';
  if (!data.issue) errors.issue = 'Describe the equipment issue.';
  else if (data.issue.length < 6) errors.issue = 'Add a little more detail about the issue.';
  return errors;
}

function handleFormSubmit(event) {
  event.preventDefault();
  clearFormErrors();
  const data = {
    machineId: elements.machineIdInput.value.trim().toUpperCase(),
    machineName: elements.machineNameInput.value.trim(),
    issue: elements.issueInput.value.trim(),
    priority: elements.priorityInput.value,
    status: elements.statusInput.value,
    technician: elements.technicianInput.value.trim(),
    dueDate: elements.dueDateInput.value
  };
  const errors = validateTicketForm(data);
  const firstErrorField = Object.keys(errors)[0];
  Object.entries(errors).forEach(([field, message]) => {
    const input = document.getElementById(`${field}Input`);
    document.getElementById(`${field}Error`).textContent = message;
    input.setAttribute('aria-invalid', 'true');
  });
  if (firstErrorField) {
    document.getElementById(`${firstErrorField}Input`).focus();
    return;
  }

  const editingId = elements.editingTicketId.value;
  const wasEditing = Boolean(editingId);
  if (wasEditing) {
    const existingIndex = tickets.findIndex(ticket => ticket.id === editingId);
    if (existingIndex === -1) {
      showToast('This work order could not be found. Please refresh the list.', 'error');
      closeModal();
      return;
    }
    tickets[existingIndex] = { ...tickets[existingIndex], ...data };
  } else {
    tickets.push({ id: getNextTicketId(), createdAt: dateOffsetFromToday(0), ...data });
  }

  const saved = saveTickets();
  renderApp();
  closeModal();
  showToast(wasEditing ? 'Work order updated.' : 'Work order created.', saved ? 'success' : 'error');
}

function handleTicketAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === 'edit-ticket') {
    openModal(id);
    return;
  }
  if (action === 'delete-ticket') {
    const ticket = tickets.find(item => item.id === id);
    if (!ticket) return;
    const shouldDelete = window.confirm(`Delete ${ticket.id} — ${ticket.machineName}? This cannot be undone.`);
    if (!shouldDelete) return;
    tickets = tickets.filter(item => item.id !== id);
    const saved = saveTickets();
    renderApp();
    showToast(saved ? `${id} deleted.` : 'Record deleted in this view, but storage could not be updated.', saved ? 'success' : 'error');
  }
}

function handleStatusChange(event) {
  const select = event.target.closest('select[data-action="change-status"]');
  if (!select) return;
  const ticket = tickets.find(item => item.id === select.dataset.id);
  if (!ticket || !STATUSES.includes(select.value)) return;
  ticket.status = select.value;
  const saved = saveTickets();
  renderApp();
  showToast(saved ? `${ticket.id} moved to ${ticket.status.toLowerCase()}.` : 'Status changed, but browser storage could not be updated.', saved ? 'success' : 'error');
}

function clearFilters() {
  elements.ticketSearch.value = '';
  elements.priorityFilter.value = 'all';
  elements.statusFilter.value = 'all';
  renderAllTickets();
}

function exportTickets() {
  const rows = getFilteredTickets();
  if (!rows.length) {
    showToast('There are no work orders to export.', 'error');
    return;
  }
  const headers = ['Ticket ID', 'Machine ID', 'Machine Name', 'Issue', 'Priority', 'Status', 'Technician', 'Reported Date', 'Target Date'];
  const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows.map(ticket => [ticket.id, ticket.machineId, ticket.machineName, ticket.issue, ticket.priority, ticket.status, ticket.technician, ticket.createdAt, ticket.dueDate])]
    .map(row => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'maintainiq-work-orders.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} work order${rows.length === 1 ? '' : 's'} to CSV.`);
}

function restoreSampleData() {
  if (!window.confirm('Restore the original demo records? Your current local records will be replaced.')) return;
  tickets = makeSampleTickets();
  const saved = saveTickets();
  renderApp();
  showToast(saved ? 'Demo records restored.' : 'Demo records loaded, but browser storage could not be updated.', saved ? 'success' : 'error');
}

function openMobileNavigation() {
  elements.sidebar.classList.add('mobile-open');
  elements.mobileScrim.hidden = false;
  elements.menuButton.setAttribute('aria-expanded', 'true');
  elements.menuButton.setAttribute('aria-label', 'Close navigation');
}

function closeMobileNavigation() {
  elements.sidebar.classList.remove('mobile-open');
  elements.mobileScrim.hidden = true;
  elements.menuButton.setAttribute('aria-expanded', 'false');
  elements.menuButton.setAttribute('aria-label', 'Open navigation');
}

function handleGlobalClick(event) {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) {
    event.preventDefault();
    updateView(viewButton.dataset.view);
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (actionButton && actionButton.dataset.action === 'add') {
    openModal();
    return;
  }
  if (actionButton && actionButton.dataset.action === 'machine-ticket') {
    openModal(null, { machineId: actionButton.dataset.machineId, machineName: actionButton.dataset.machineName });
    return;
  }
  if (event.target.closest('#topAddButton, #heroAddButton, #ticketsAddButton')) {
    openModal();
    return;
  }
  if (event.target.closest('#modalCloseButton, #cancelModalButton')) {
    closeModal();
    return;
  }
  if (event.target === elements.ticketModal) {
    closeModal();
    return;
  }
  if (event.target.closest('#clearFiltersButton, #emptyResetButton')) {
    clearFilters();
    return;
  }
  if (event.target.closest('#exportButton')) {
    exportTickets();
    return;
  }
  if (event.target.closest('#restoreSamplesButton')) {
    restoreSampleData();
    return;
  }
  if (event.target.closest('#profileButton')) {
    showToast('MaintainIQ stores work orders locally in this browser. No account is connected.');
    return;
  }
  if (event.target.closest('.toast-close')) event.target.closest('.toast')?.remove();
}

function keepFocusInsideModal(event) {
  if (event.key === 'Escape' && !elements.ticketModal.hidden) {
    closeModal();
    return;
  }
  if (event.key !== 'Tab' || elements.ticketModal.hidden) return;
  const focusable = [...elements.ticketModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]')]
    .filter(element => element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindEvents() {
  document.addEventListener('click', handleGlobalClick);
  elements.ticketForm.addEventListener('submit', handleFormSubmit);
  elements.recentTicketRows.addEventListener('click', handleTicketAction);
  elements.ticketRows.addEventListener('click', handleTicketAction);
  elements.ticketRows.addEventListener('change', handleStatusChange);
  elements.ticketSearch.addEventListener('input', renderAllTickets);
  elements.priorityFilter.addEventListener('change', renderAllTickets);
  elements.statusFilter.addEventListener('change', renderAllTickets);
  elements.machineSearch.addEventListener('input', renderMachines);
  elements.menuButton.addEventListener('click', () => {
    if (elements.sidebar.classList.contains('mobile-open')) closeMobileNavigation();
    else openMobileNavigation();
  });
  elements.mobileScrim.addEventListener('click', closeMobileNavigation);
  document.addEventListener('keydown', keepFocusInsideModal);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) closeMobileNavigation();
  });
}

function startApp() {
  bindEvents();
  renderApp();
  // Keep the starter data available after the first page refresh.
  try {
    if (localStorage.getItem(STORAGE_KEY) === null) saveTickets();
  } catch (error) {
    console.warn('This browser may block localStorage in the current viewing mode.', error);
  }
}

startApp();

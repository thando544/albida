export const recipient = '263785617589';
export function reportMessage(report) {
  return ["*ALBIDA KITCHEN*", "*Chef's Service Report*", '', `Date: ${report.date}`, `Chef on duty: ${report.chef}`, `Service: ${report.service}`, `Covers: ${report.covers}`, '', '*Service overview*', report.overview, '', '*Menu served*', report.menu, '', '*Dishes served*', ...report.dishes.map(d=>`${d.quantity} × ${d.name}`), '', '*Dietary requirements*', report.dietary || 'None recorded', '', '*Turndown service*', report.turndown || 'None recorded', '', '*Guest feedback*', report.feedback || 'None recorded', '', '*Conclusion*', report.conclusion || 'None recorded', '', '*Additional notes*', report.notes || 'None recorded'].join('\n');
}
export function whatsappUrl(report) {
  return `https://wa.me/${recipient}?text=${encodeURIComponent(reportMessage(report))}`;
}

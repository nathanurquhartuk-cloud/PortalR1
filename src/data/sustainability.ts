// Sustainability best practice dashboard: Scope 3 transport emissions for Radiopharma and Clinical Supply Logistics,
// measured to the GLEC Framework / ISO 14083, with the practices that move the number.

export const SUSTAINABILITY = {
  period: 'Year to date · Radiopharma and Clinical Supply Logistics',
  headline: [
    { label: 'Scope 3 transport CO₂e', value: '312 t', delta: '−9% per shipment vs last year', tone: 'ok' as const },
    { label: 'CO₂e per shipment', value: '94 kg', delta: 'Target 85 kg by Q4 2027', tone: 'ok' as const },
    { label: 'Best practices adopted', value: '7 of 12', delta: '3 in progress · 2 recommended', tone: 'warn' as const },
    { label: 'Avoided this year', value: '41 t', delta: 'Consolidation, reusables, mode shift', tone: 'ok' as const },
  ],
  // kg CO₂e per shipment, November to October
  perShipment: [104, 103, 102, 101, 99, 98, 97, 96, 96, 95, 94, 94],
  months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  byMode: [
    { mode: 'Air freight', share: 71, tonnes: 221, note: 'Unavoidable for time-critical lanes; SAF credits cover 12%' },
    { mode: 'Road · dedicated vehicle', share: 19, tonnes: 59, note: 'Falls as EU legs consolidate into milk runs' },
    { mode: 'Road · consolidated', share: 7, tonnes: 22, note: 'Up from 3% last year' },
    { mode: 'Dry ice and packaging', share: 3, tonnes: 10, note: 'Reusable shippers and right-sized dry ice' },
  ],
  byLine: [
    { line: 'Radiopharma', perShipment: 118, trend: -6, note: 'Short-shelf-life doses stay on direct flights; gains come from packaging and last mile' },
    { line: 'Clinical Supply Logistics', perShipment: 76, trend: -12, note: 'Consolidation and reusable shippers are doing most of the work' },
  ],
  practices: [
    { id: 'p1', name: 'Reusable temperature-controlled shippers', status: 'Adopted', coverage: '62% of consignments', impact: '−18 t CO₂e / year', detail: 'Validated reusable shippers on every recurring lane; single-use only where return logistics are not viable.' },
    { id: 'p2', name: 'Consolidated EU road milk runs', status: 'Adopted', coverage: '18% of EU road legs', impact: '−9 t CO₂e / year', detail: 'Fixed-day consolidated collections from Camberley and the Frankfurt hub for non-urgent clinical supply.' },
    { id: 'p3', name: 'Right-sized dry ice', status: 'Adopted', coverage: 'All frozen lanes', impact: '−4 t CO₂e / year', detail: 'Dry ice quantity set from lane duration and ambient profile rather than a fixed fill; replenished in transit when needed.' },
    { id: 'p4', name: 'GLEC / ISO 14083 emissions reporting', status: 'Adopted', coverage: 'All shipments', impact: 'Audit-ready Scope 3', detail: 'Per-shipment CO₂e calculated to ISO 14083 with monthly offset-ready reports per service line.' },
    { id: 'p5', name: 'Direct flights for radiopharma doses', status: 'Adopted', coverage: '94% of doses', impact: 'Lower decay waste', detail: 'Fewer connections mean fewer doses lost to decay, which avoids re-manufacture and re-shipment.' },
    { id: 'p6', name: 'Electric last-mile vehicles', status: 'Adopted', coverage: 'London, Berlin, São Paulo', impact: '−3 t CO₂e / year', detail: 'Electric vans on hub-to-hospital legs where range and charging are proven.' },
    { id: 'p7', name: 'Paperless documentation', status: 'Adopted', coverage: 'OK to Send, PoD, temperature of record', impact: 'No courier paperwork', detail: 'Customs documents, proofs of delivery and temperature records are digital end to end.' },
    { id: 'p8', name: 'Sustainable aviation fuel credits', status: 'In progress', coverage: '12% of air freight', impact: '−7 t CO₂e / year at 25%', detail: 'Book-and-claim SAF credits on the LHR → GRU and LHR → BOM lanes; scaling to 25% in 2027.' },
    { id: 'p9', name: 'Shipment consolidation by study', status: 'In progress', coverage: 'NVS-CORE-201 pilot', impact: '−5 t CO₂e / year', detail: 'Combine site resupply and IMP returns on the same lane and day where protocol windows allow.' },
    { id: 'p10', name: 'Reusable shipper returns from Brazil', status: 'In progress', coverage: '2 of 5 lanes', impact: '−6 t CO₂e / year', detail: 'Return loops for reusable shippers from São Paulo and Campinas; Porto Alegre and Rio next.' },
    { id: 'p11', name: 'Sea-air for non-urgent clinical returns', status: 'Recommended', coverage: 'IMP returns for destruction', impact: '−4 t CO₂e / year', detail: 'Returns bound for destruction rarely need air freight; a sea-air routing cuts emissions by about 60%.' },
    { id: 'p12', name: 'Supplier emissions data in booking', status: 'Recommended', coverage: 'Quote and booking', impact: 'Decision at the point of booking', detail: 'Show CO₂e alongside price and transit time on every quote so the lower-carbon option is a conscious choice.' },
  ] as { id: string; name: string; status: 'Adopted' | 'In progress' | 'Recommended'; coverage: string; impact: string; detail: string }[],
  targets: [
    { label: 'CO₂e per shipment', now: 94, target: 85, unit: 'kg', by: 'Q4 2027' },
    { label: 'Reusable shipper coverage', now: 62, target: 80, unit: '%', by: 'Q4 2027' },
    { label: 'SAF share of air freight', now: 12, target: 25, unit: '%', by: 'Q4 2027' },
    { label: 'Consolidated EU road legs', now: 18, target: 30, unit: '%', by: 'Q2 2027' },
  ],
}

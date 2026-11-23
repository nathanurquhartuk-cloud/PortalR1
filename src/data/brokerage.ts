// Brokerage (OK to Send), Release 1 MVP: visibility of the OK to Send process for every cross-border shipment with the
// Customs brokerage add-on. Four steps (Documents, Request OK to Send, Review, OK to Send), documents with upload, commentary
// from Customer Service and the broker as written on the Salesforce case, and an activity log. Seeded from the workspace's own jobs; dates are relative to today.
import { daysFrom, fmtDayMonth, fmtMonDay } from '../lib/dates'

export type Direction = 'Export' | 'Import'
export type ClearanceRoute = 'wc' | 'external' | 'blanket'
export type OkStatus = 'docs' | 'action' | 'review' | 'broker' | 'ok' | 'hold'
export type DocStatus = 'needed' | 'checking' | 'amend' | 'ok'

export interface DocIssue { check: string; fix: string }
export interface BrokerDoc {
  id: string
  name: string
  guidance: string
  checks: string[]
  fails: DocIssue[][]      // scripted result per upload attempt; [] passes
  samples: string[]        // sample file names for the demo
  status: DocStatus
  attempts: number
  file?: string
  version?: number
  uploadedAt?: string
  issues: DocIssue[]
  resolved: DocIssue[]
  forcePass?: boolean
}
// Commentary written by World Courier Customer Service or the broker on the OK to Send case in Salesforce (read-only here)
export interface Commentary {
  id: string
  at: string
  who: string               // person · team
  text: string
  doc?: string              // document id this relates to
}
export interface BrokerageShipment {
  job: string
  order: string
  direction: Direction
  serviceLine: string
  tier: string
  lane: string              // "GB → BR"
  origin: { place: string; country: string; code: string }
  destination: { place: string; country: string; code: string }
  goods: string
  route: ClearanceRoute
  broker: string            // team or company
  specialist: string        // named contact
  blanketId?: string
  status: OkStatus
  deadline: { label: string; at: Date }
  requestedAt?: string
  okAt?: string
  delivered?: boolean       // shipment complete; stays visible under All
  docs: BrokerDoc[]
  commentary: Commentary[]  // newest first
  activity: { at: string; text: string }[]
  fee: string
}

const t = (day: number, time: string) => `${fmtMonDay(daysFrom(day))} ${time}`
const atTime = (day: number, h: number, m = 0) => { const d = daysFrom(day); d.setHours(h, m, 0, 0); return d }
const doc = (id: string, name: string, guidance: string, checks: string[], fails: DocIssue[][], samples: string[], state: Partial<BrokerDoc> = {}): BrokerDoc =>
  ({ id, name, guidance, checks, fails, samples, status: 'needed', attempts: 0, issues: [], resolved: [], ...state })
const ok = (file: string, day: number, time: string, version = 1): Partial<BrokerDoc> => ({ status: 'ok', attempts: version, file, version, uploadedAt: t(day, time) })

// ----- Document rules by destination (placeholders for the Document Library rules) -----
const CI = (country: string, extra: string) => doc('ci', 'Commercial invoice',
  `${country}: ${extra}`,
  ['Shipper and consignee names and addresses', 'Description of goods with HS code', 'Incoterm', 'Currency and total value', 'Country of origin', 'Signed and dated'],
  [[{ check: 'Description of goods with HS code', fix: 'The description is generic ("pharmaceutical samples"). State the product, strength and pack size and add the HS code, then upload the invoice again.' }]],
  ['Commercial_invoice_1187.pdf', 'Commercial_invoice_1187_v2.pdf'])
const PL = doc('pl', 'Packing list',
  'Carton count, gross and net weights must match the commercial invoice line by line.',
  ['Number of cartons', 'Gross and net weight per carton', 'Description of contents', 'Matches the commercial invoice'],
  [], ['Packing_list_1187.pdf'])
const DGD_CLASS7 = doc('dgd', 'Shipper’s declaration (Class 7)',
  'Radioactive material: UN number, radionuclide, activity in MBq, transport index and category label must match the package.',
  ['UN number and proper shipping name', 'Radionuclide and activity (MBq)', 'Transport index and category', 'Packaging type and approval', 'Emergency contact', 'Shipper signature and date'],
  [], ['Class7_declaration.pdf'])
const COA = doc('coa', 'Certificate of analysis',
  'Batch number and expiry on the certificate must match the packing list.',
  ['Batch number', 'Expiry date', 'Manufacturer', 'Release signature'],
  [], ['CoA_batch_24K118.pdf'])
const ANVISA = doc('li', 'ANVISA import licence (LI)',
  'Brazil: the LI must be deferred or approved before arrival and name the consignee exactly as on the invoice.',
  ['LI number', 'Consignee matches the invoice', 'Product and quantity match the shipment', 'Valid on the arrival date'],
  [[{ check: 'Consignee matches the invoice', fix: 'The LI names "Hosp. E. Dornelles"; the invoice says "Hospital Ernesto Dornelles". Use the registered name on both and upload again.' }]],
  ['ANVISA_LI_26-0871234.pdf', 'ANVISA_LI_26-0871234_corrected.pdf'])
const RETURNS_INVOICE = doc('ci', 'Proforma invoice (IMP returns)',
  'Returned investigational product: describe the IMP, strength and quantity, state "Returned goods, no commercial value" and give a customs value for duty purposes.',
  ['Shipper (site) and consignee (sponsor)', 'IMP description, strength and quantity', 'Customs value and currency', '"Returned goods, no commercial value" statement', 'Signed and dated'],
  [[{ check: 'Customs value and currency', fix: 'Customs value is blank. HMRC needs a nominal value per carton (for example GBP 10) with the currency, then upload again.' }]],
  ['Proforma_invoice_IMP_returns.pdf', 'Proforma_invoice_IMP_returns_v2.pdf'])
const RECON = doc('pl', 'Packing list and reconciliation',
  'Carton count and unit counts must match the site drug accountability log for the returned lots.',
  ['Number of cartons', 'Lot numbers and unit counts', 'Matches the site accountability log', 'Temperature condition stated'],
  [], ['Packing_list_reconciliation.pdf'])
const RGR = doc('rgr', 'Proof of original export (returned goods relief)',
  'UK import: returned goods relief needs the original export declaration (MRN) so duty and VAT are not charged again on the IMP.',
  ['Original export MRN', 'Goods match the original export', 'Exported within the last 3 years', 'Same importer as the original exporter'],
  [[{ check: 'Original export MRN', fix: 'The MRN quoted is 17 characters; a UK MRN has 18. Check the original export declaration and upload again.' }]],
  ['Export_declaration_MRN.pdf', 'Export_declaration_MRN_v2.pdf'])
const IOR = doc('ior', 'Importer of record details',
  'UK import: EORI number, VAT registration and the deferment or postponed VAT choice for the importer of record.',
  ['EORI number (GB)', 'VAT registration', 'Duty and VAT payment method', 'Authorised signatory'],
  [], ['Importer_of_record_AZ_UK.pdf'])

export const BROKERAGE_SEED: BrokerageShipment[] = [
  // ---------------- Exports ----------------
  {
    job: '261402288CL', order: 'ORD-2026-008', direction: 'Export', serviceLine: 'Clinical Supply Logistics', tier: 'Critical',
    lane: 'GB → BR', origin: { place: 'Byfleet', country: 'United Kingdom', code: 'GB' }, destination: { place: 'Campinas', country: 'Brazil', code: 'BR' },
    goods: 'AZD-4573 50 mg vials · clinical trial material · 2–8 °C', route: 'wc', broker: 'World Courier Customs · São Paulo', specialist: 'Rafael Souza',
    status: 'action', deadline: { label: 'Inspection window closes', at: atTime(1, 10, 0) }, requestedAt: t(-2, '16:40'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), status: 'amend', attempts: 1, file: 'Commercial_invoice_1142.pdf', version: 1, uploadedAt: t(-3, '10:05'), issues: [{ check: 'Description of goods with HS code', fix: 'The description is generic ("pharmaceutical samples"). State the product, strength and pack size and add NCM/HS 3002.15.90, then upload the invoice again.' }], resolved: [], samples: ['Commercial_invoice_1142.pdf', 'Commercial_invoice_1142_v2.pdf'], forcePass: true },
      { ...PL, ...ok('Packing_list_1142.pdf', -3, '10:06') },
      { ...ANVISA, ...ok('ANVISA_LI_26-0865512.pdf', -3, '10:08') },
      { ...COA, ...ok('CoA_batch_24K118.pdf', -3, '10:09') },
    ],
    commentary: [
      { id: 'c1', at: t(0, '07:55'), who: 'Rafael Souza · WC Customs São Paulo', doc: 'ci', text: 'Receita Federal selected the consignment for the yellow channel (document inspection) because the invoice describes the goods as "pharmaceutical samples". Please upload a revised commercial invoice stating "AZD-4573 50 mg vials, clinical trial material, 24 vials" with NCM/HS 3002.15.90. With that I expect release before the inspection window closes tomorrow morning.' },
      { id: 'c2', at: t(-1, '09:20'), who: 'Rafael Souza · WC Customs São Paulo', text: 'OK to Send given. Import declaration (DI) registered on arrival at GRU.' },
      { id: 'c3', at: t(-2, '16:40'), who: 'World Courier Customer Service · Salesforce', text: 'Request OK to Send received with 4 documents checked. Passed to WC Customs São Paulo for review.' },
    ],
    activity: [
      { at: t(0, '07:55'), text: 'Destination amendment required · yellow channel inspection at GRU' },
      { at: t(-1, '09:20'), text: 'OK to Send given by WC Customs São Paulo' },
      { at: t(-2, '16:40'), text: 'Request OK to Send submitted' },
      { at: t(-3, '10:09'), text: '4 of 4 documents checked' },
    ],
    fee: 'Customs brokerage add-on · $340',
  },
  {
    job: '261405510CL', order: 'ORD-2026-005', direction: 'Export', serviceLine: 'Clinical Supply Logistics', tier: 'Critical',
    lane: 'GB → BR', origin: { place: 'Byfleet', country: 'United Kingdom', code: 'GB' }, destination: { place: 'São Paulo', country: 'Brazil', code: 'BR' },
    goods: 'IMP lot 24M311 · frozen on dry ice · 3 cartons', route: 'wc', broker: 'World Courier Customs · São Paulo', specialist: 'Rafael Souza',
    status: 'review', deadline: { label: 'Review due before departure', at: atTime(0, 22, 0) }, requestedAt: t(0, '08:12'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), ...ok('Commercial_invoice_1198.pdf', 0, '08:02') },
      { ...PL, ...ok('Packing_list_1198.pdf', 0, '08:03') },
      { ...ANVISA, ...ok('ANVISA_LI_26-0871901.pdf', 0, '08:05') },
      { ...COA, ...ok('CoA_batch_24M311.pdf', 0, '08:06') },
    ],
    commentary: [
      { id: 'c1', at: t(0, '08:12'), who: 'World Courier Customer Service · Salesforce', text: 'Request OK to Send received with 4 documents checked. WC Customs São Paulo is reviewing; typical review time on this lane is 2 hours.' },
    ],
    activity: [
      { at: t(0, '08:12'), text: 'Request OK to Send submitted' },
      { at: t(0, '08:06'), text: '4 of 4 documents checked' },
    ],
    fee: 'Customs brokerage add-on · $340',
  },
  {
    job: '261396071CL', order: 'ORD-2026-009', direction: 'Export', serviceLine: 'Radiopharma', tier: 'Critical',
    lane: 'GB → BR', origin: { place: 'Burton upon Trent', country: 'United Kingdom', code: 'GB' }, destination: { place: 'Porto Alegre', country: 'Brazil', code: 'BR' },
    goods: 'Radiopharmaceutical · Class 7 UN2915 · 2–8 °C', route: 'wc', broker: 'World Courier Customs · São Paulo', specialist: 'Rafael Souza',
    status: 'ok', deadline: { label: 'Customs release expected', at: atTime(1, 12, 0) }, requestedAt: t(-4, '14:02'), okAt: t(-3, '09:30'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), ...ok('Commercial_invoice_1187_v2.pdf', -4, '13:40', 2), resolved: [{ check: 'Currency and total value', fix: 'Total value was blank.' }] },
      { ...PL, ...ok('Packing_list_1187.pdf', -4, '13:41') },
      { ...DGD_CLASS7, ...ok('Class7_declaration_1187.pdf', -4, '13:45') },
      { ...ANVISA, ...ok('ANVISA_LI_26-0871234.pdf', -4, '13:50') },
      { ...doc('cnen', 'CNEN authorisation', 'Brazil: radioactive material needs the CNEN import authorisation for the receiving nuclear medicine service.', ['Authorisation number', 'Receiving service matches the consignee', 'Radionuclide and activity covered', 'Valid on arrival'], [], ['CNEN_authorisation_HED.pdf']), ...ok('CNEN_authorisation_HED.pdf', -4, '13:52') },
    ],
    commentary: [
      { id: 'c1', at: t(0, '06:20'), who: 'Rafael Souza · WC Customs São Paulo', text: 'DI registered at GRU and parametrised to the green channel. ANVISA release in progress; customs release expected by 12:00 tomorrow, in time for the LA 3290 connection to Porto Alegre.' },
      { id: 'c2', at: t(-3, '09:30'), who: 'Rafael Souza · WC Customs São Paulo', text: 'OK to Send given. All five documents match the ANVISA and CNEN records.' },
      { id: 'c3', at: t(-4, '14:02'), who: 'World Courier Customer Service · Salesforce', text: 'Request OK to Send received with 5 documents checked.' },
    ],
    activity: [
      { at: t(0, '06:20'), text: 'Customs entry registered at GRU · green channel (commentary from WC Customs)' },
      { at: t(-3, '09:30'), text: 'OK to Send given' },
      { at: t(-4, '14:02'), text: 'Request OK to Send submitted' },
      { at: t(-4, '13:52'), text: '5 of 5 documents checked' },
    ],
    fee: 'Customs brokerage add-on · $420',
  },
  {
    job: '261408871CL', order: 'ORD-2026-007', direction: 'Export', serviceLine: 'Radiopharma', tier: 'Critical',
    lane: 'GB → DE', origin: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' }, destination: { place: 'Berlin', country: 'Germany', code: 'DE' },
    goods: 'Radiopharmaceutical · Class 7 UN2915 · 1 package', route: 'blanket', broker: 'World Courier Customs · Frankfurt', specialist: 'Jonas Weber', blanketId: 'BID-2026-DE-0147',
    status: 'ok', deadline: { label: 'Delivery window', at: atTime(1, 8, 0) }, requestedAt: t(0, '03:05'), okAt: t(0, '03:06'),
    docs: [
      { ...doc('ci', 'Commercial invoice', 'Must be an exact match to the invoice on file for Blanket ID BID-2026-DE-0147.', ['Invoice number matches the document on file', 'Shipper and consignee match the document on file', 'Description and HS code match the document on file', 'Currency and value match the document on file'], [], ['Commercial_invoice_AZ-BER-0147.pdf']), ...ok('Commercial_invoice_AZ-BER-0147.pdf', 0, '02:50') },
      { ...doc('pl', 'Packing list', 'Must be an exact match to the packing list on file for this Blanket ID.', ['Package count and weight match the document on file', 'Description matches the document on file'], [], ['Packing_list_AZ-BER-0147.pdf']), ...ok('Packing_list_AZ-BER-0147.pdf', 0, '02:51') },
      { ...doc('dgd', 'Shipper’s declaration (Class 7)', 'Must be an exact match to the declaration on file, with today’s activity and transport index.', ['UN number and radionuclide match the document on file', 'Activity and transport index for this package', 'Signature and date'], [], ['Class7_declaration_AZ-BER.pdf']), ...ok('Class7_declaration_AZ-BER.pdf', 0, '02:55') },
    ],
    commentary: [
      { id: 'c1', at: t(0, '06:40'), who: 'Jonas Weber · WC Customs Frankfurt', text: 'Import entry pre-lodged in ATLAS for arrival at BER. No action needed.' },
      { id: 'c2', at: t(0, '03:06'), who: 'World Courier Customer Service · Salesforce', text: 'OK to Send given under Blanket ID BID-2026-DE-0147. Documents match the documents on file; the importing office approved this lane in advance.' },
    ],
    activity: [
      { at: t(0, '06:40'), text: 'Import entry pre-lodged (ATLAS)' },
      { at: t(0, '03:06'), text: 'OK to Send given under Blanket ID' },
      { at: t(0, '02:55'), text: '3 of 3 documents matched the Blanket ID Library' },
    ],
    fee: 'Customs brokerage add-on · $260',
  },
  // ---------------- Imports ----------------
  {
    job: '261425108CL', order: 'ORD-2026-016', direction: 'Import', serviceLine: 'Clinical Supply Logistics', tier: 'Critical',
    lane: 'BR → GB', origin: { place: 'Porto Alegre', country: 'Brazil', code: 'BR' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'IMP returns · AZD-4573 50 mg vials · 2–8 °C · 4 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'docs', deadline: { label: 'Importer of record needed before arrival', at: atTime(1, 6, 15) },
    docs: [
      { ...RETURNS_INVOICE, ...ok('Proforma_invoice_IMP_returns_0412_v2.pdf', -1, '16:58', 2), resolved: [{ check: 'Customs value and currency', fix: 'Customs value was blank.' }] },
      { ...RECON, ...ok('Packing_list_reconciliation_0412.pdf', -1, '16:59') },
      { ...RGR, ...ok('Export_declaration_MRN_0412.pdf', -1, '17:05') },
      { ...IOR },
    ],
    commentary: [
      { id: 'c1', at: t(0, '08:05'), who: 'Hannah Price · WC Customs Heathrow', doc: 'ior', text: 'To lodge the CDS entry under returned goods relief I need the importer of record for AstraZeneca UK: GB EORI and the VAT choice (postponed VAT accounting recommended). Please upload the importer of record form.' },
      { id: 'c2', at: t(-1, '17:20'), who: 'World Courier Customer Service · Salesforce', text: '3 of 4 documents checked. The importer of record details are outstanding before OK to Send can be requested.' },
    ],
    activity: [
      { at: t(0, '08:05'), text: 'WC Customs Heathrow asked for the importer of record' },
      { at: t(-1, '17:05'), text: '3 of 4 documents checked' },
    ],
    fee: 'Customs brokerage add-on · $180',
  },
  {
    job: '261425331CL', order: 'ORD-2026-015', direction: 'Import', serviceLine: 'Clinical Supply Logistics', tier: 'Optimised',
    lane: 'IN → GB', origin: { place: 'Mumbai', country: 'India', code: 'IN' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'IMP returns · AZD-9833 25 mg tablets · ambient · 2 cartons', route: 'external', broker: 'Albion Customs Ltd (your appointed broker)', specialist: 'Priya Chandra',
    status: 'broker', deadline: { label: 'Broker review due before arrival', at: atTime(2, 5, 50) }, requestedAt: t(0, '09:30'),
    docs: [
      { ...RETURNS_INVOICE, ...ok('Proforma_invoice_IMP_returns_0288.pdf', 0, '09:10') },
      { ...RECON, ...ok('Packing_list_reconciliation_0288.pdf', 0, '09:11') },
      { ...RGR, ...ok('Export_declaration_MRN_0288.pdf', 0, '09:15') },
      { ...IOR, ...ok('Importer_of_record_AZ_UK.pdf', 0, '09:20') },
    ],
    commentary: [
      { id: 'c1', at: t(0, '11:05'), who: 'Priya Chandra · Albion Customs', text: 'Documents received. Checking the original export MRN against CDS for returned goods relief; OK to Send will be confirmed before the flight lands at LHR.' },
      { id: 'c2', at: t(0, '09:30'), who: 'World Courier Customer Service · Salesforce', text: 'Request OK to Send received with 4 documents checked and passed to Albion Customs Ltd. World Courier does not review documents on this lane; the appointed broker is responsible for the review.' },
    ],
    activity: [
      { at: t(0, '11:05'), text: 'Appointed broker acknowledged the documents' },
      { at: t(0, '09:30'), text: 'Request OK to Send submitted · external broker' },
      { at: t(0, '09:20'), text: '4 of 4 documents checked' },
    ],
    fee: 'Customs brokerage add-on · documents only · $120',
  },
  {
    job: '261425490CL', order: 'ORD-2026-014', direction: 'Import', serviceLine: 'Clinical Supply Logistics', tier: 'Optimised',
    lane: 'SG → GB', origin: { place: 'Singapore', country: 'Singapore', code: 'SG' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'IMP returns · AZD-9833 25 mg tablets · frozen on dry ice · 3 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'docs', deadline: { label: 'Documents due before pick-up', at: atTime(2, 9, 0) },
    docs: [
      { ...RETURNS_INVOICE, ...ok('Proforma_invoice_IMP_returns_0107.pdf', 0, '10:40') },
      { ...RECON },
      { ...RGR },
      { ...IOR, ...ok('Importer_of_record_AZ_UK.pdf', 0, '10:45') },
    ],
    commentary: [
      { id: 'c1', at: t(0, '10:45'), who: 'World Courier Customer Service · Salesforce', text: '2 of 4 documents checked. The packing list with reconciliation and the proof of original export are needed before OK to Send can be requested.' },
    ],
    activity: [
      { at: t(0, '10:45'), text: '2 of 4 documents checked' },
      { at: t(-1, '14:00'), text: 'Shipment booked with Customs brokerage add-on' },
    ],
    fee: 'Customs brokerage add-on · $180',
  },
  {
    job: '261418220CL', order: 'ORD-2026-004', direction: 'Import', serviceLine: 'Clinical Supply Logistics', tier: 'Critical',
    lane: 'BR → GB', origin: { place: 'São Paulo', country: 'Brazil', code: 'BR' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'IMP returns · AZD-4573 50 mg vials · 2–8 °C · 6 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'ok', delivered: true, deadline: { label: 'Delivered', at: atTime(-5, 11, 20) }, requestedAt: t(-8, '15:10'), okAt: t(-8, '16:45'),
    docs: [
      { ...RETURNS_INVOICE, ...ok('Proforma_invoice_IMP_returns_0391.pdf', -8, '14:50') },
      { ...RECON, ...ok('Packing_list_reconciliation_0391.pdf', -8, '14:51') },
      { ...RGR, ...ok('Export_declaration_MRN_0391.pdf', -8, '14:55') },
      { ...IOR, ...ok('Importer_of_record_AZ_UK.pdf', -8, '15:00') },
    ],
    commentary: [
      { id: 'c1', at: t(-5, '08:10'), who: 'Hannah Price · WC Customs Heathrow', text: 'Entry cleared under returned goods relief with no inspection; duty and VAT nil. Released to the WC London hub for delivery to the Macclesfield returns store.' },
      { id: 'c2', at: t(-8, '16:45'), who: 'Hannah Price · WC Customs Heathrow', text: 'OK to Send given. CDS entry pre-lodged.' },
      { id: 'c3', at: t(-8, '15:10'), who: 'World Courier Customer Service · Salesforce', text: 'Request OK to Send received with 4 documents checked.' },
    ],
    activity: [
      { at: t(-5, '11:20'), text: 'Delivered to AstraZeneca Macclesfield returns store' },
      { at: t(-5, '08:10'), text: 'Customs released · returned goods relief' },
      { at: t(-8, '16:45'), text: 'OK to Send given' },
      { at: t(-8, '15:10'), text: 'Request OK to Send submitted' },
    ],
    fee: 'Customs brokerage add-on · $180',
  },
]

export const STATUS_LABEL: Record<OkStatus, string> = {
  docs: 'Awaiting your documents',
  action: 'Amendment needed',
  review: 'In review',
  broker: 'Pending your broker',
  ok: 'OK to Send',
  hold: 'On hold',
}
export const STATUS_TONE: Record<OkStatus, 'ok' | 'warn' | 'bad' | 'info' | 'brand' | undefined> = {
  docs: 'warn', action: 'bad', review: 'info', broker: 'info', ok: 'ok', hold: 'bad',
}
export const ROUTE_LABEL: Record<ClearanceRoute, string> = { wc: 'World Courier Customs', external: 'Your appointed broker', blanket: 'Blanket ID (pre-approved lane)' }
export const fmtDeadline = (d: Date) => `${fmtDayMonth(d)} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

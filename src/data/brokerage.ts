// Brokerage (OK to Send): customs documents, review and clearance for every shipment that crosses a border
// and has the Customs brokerage add-on. Seeded from the workspace's own jobs; dates are relative to today.
import { daysFrom, fmtDayMonth, fmtMonDay } from '../lib/dates'

export type Direction = 'Export' | 'Import'
export type ClearanceRoute = 'wc' | 'external' | 'blanket'
export type OkStatus = 'docs' | 'action' | 'review' | 'broker' | 'ok' | 'clearing' | 'cleared' | 'hold'
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
export interface BrokerMessage {
  id: string
  from: 'broker' | 'you' | 'system'
  who: string
  at: string
  text: string
  needsReply?: boolean
  doc?: string             // document id this relates to
  quick?: string[]         // suggested replies
}
export interface CustomsEntry {
  regime: string
  entryNumber?: string
  mrn?: string
  hs: string
  description: string
  value: string
  incoterm: string
  dutiesEstimate: string
  channel?: string
  lodged?: string
  released?: string
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
  docs: BrokerDoc[]
  messages: BrokerMessage[]
  activity: { at: string; text: string }[]
  entry: CustomsEntry
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
const DGD_DRYICE = doc('dgd', 'Dangerous goods declaration',
  'Dry ice: show UN1845, Class 9 and the net quantity of dry ice in kg for each carton. Biological samples travel as UN3373 Category B.',
  ['UN number and proper shipping name', 'Class and packing instruction', 'Net quantity of dry ice per carton (kg)', 'Emergency contact number', 'Shipper signature and date'],
  [[{ check: 'Shipper signature and date', fix: 'The declaration is not signed. Sign and date it, then upload it again.' }]],
  ['DG_declaration_1187.pdf', 'DG_declaration_1187_signed.pdf'])
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
const CDSCO = doc('cdsco', 'CDSCO import licence (Form 11)',
  'India: the Test Licence must name the consignee exactly and cover the product and quantity shipped.',
  ['Licence number', 'Licence holder matches the consignee', 'Product and quantity covered', 'Valid on the arrival date'],
  [[{ check: 'Licence holder matches the consignee', fix: 'The licence names "Tata Memorial Centre"; the consignee is "Tata Memorial Hospital". Confirm the registered importer with the site and upload the matching licence.' }]],
  ['CDSCO_Form11_TMH.pdf', 'CDSCO_Form11_TMH_v2.pdf'])
const PROFORMA = doc('ci', 'Proforma invoice (no commercial value)',
  'Samples: give a customs value for duty purposes and the words "No commercial value". Describe the samples, not the study.',
  ['Shipper and consignee', 'Description of samples with HS code 3002.12', 'Customs value and currency', '"No commercial value" statement', 'Signed and dated'],
  [[{ check: 'Customs value and currency', fix: 'Customs value is blank. HMRC needs a nominal value per carton (for example GBP 10) with the currency, then upload again.' }]],
  ['Proforma_invoice_samples.pdf', 'Proforma_invoice_samples_v2.pdf'])
const IOR = doc('ior', 'Importer of record details',
  'UK import: EORI number, VAT registration and the deferment or postponed VAT choice for the importer of record.',
  ['EORI number (GB)', 'VAT registration', 'Duty and VAT payment method', 'Authorised signatory'],
  [], ['Importer_of_record_AZ_UK.pdf'])
const SAMPLES_DECL = doc('bio', 'Biological samples declaration',
  'UK import: confirm the samples are human-origin, non-infectious (UN3373 Category B) and the receiving laboratory holds the relevant HTA licence.',
  ['Sample type and origin', 'Non-infectious confirmation', 'Receiving laboratory and HTA licence', 'Signed by the study team'],
  [], ['Biological_samples_declaration.pdf'])

export const BROKERAGE_SEED: BrokerageShipment[] = [
  // ---------------- Exports ----------------
  {
    job: '261402288CL', order: 'ORD-2026-008', direction: 'Export', serviceLine: 'Clinical Supply Logistics', tier: 'Critical',
    lane: 'GB → BR', origin: { place: 'Byfleet', country: 'United Kingdom', code: 'GB' }, destination: { place: 'Campinas', country: 'Brazil', code: 'BR' },
    goods: 'AZD-4573 50 mg vials · clinical trial material · 2–8 °C', route: 'wc', broker: 'World Courier Customs · São Paulo', specialist: 'Rafael Souza',
    status: 'action', deadline: { label: 'Inspection window closes', at: atTime(0, 18, 0) }, requestedAt: t(-2, '16:40'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), status: 'amend', attempts: 1, file: 'Commercial_invoice_1142.pdf', version: 1, uploadedAt: t(-3, '10:05'), issues: [{ check: 'Description of goods with HS code', fix: 'The description is generic ("pharmaceutical samples"). State the product, strength and pack size and add NCM/HS 3002.15.90, then upload the invoice again.' }], resolved: [], samples: ['Commercial_invoice_1142.pdf', 'Commercial_invoice_1142_v2.pdf'], forcePass: true },
      { ...PL, ...ok('Packing_list_1142.pdf', -3, '10:06') },
      { ...ANVISA, ...ok('ANVISA_LI_26-0865512.pdf', -3, '10:08') },
      { ...COA, ...ok('CoA_batch_24K118.pdf', -3, '10:09') },
    ],
    messages: [
      { id: 'm1', from: 'system', who: 'OK to Send', at: t(-2, '16:40'), text: 'Request OK to Send sent with 4 documents checked.' },
      { id: 'm2', from: 'broker', who: 'Rafael Souza · WC Customs São Paulo', at: t(-1, '09:20'), text: 'OK to Send given. Import declaration (DI) registered on arrival.' },
      { id: 'm3', from: 'broker', who: 'Rafael Souza · WC Customs São Paulo', at: t(0, '07:55'), text: 'Receita Federal selected the consignment for the yellow channel (document inspection) because the invoice describes the goods as "pharmaceutical samples". Please confirm the NCM/HS code is 3002.15.90 and that I can describe the goods as "AZD-4573 50 mg vials, clinical trial material, 24 vials", then upload a revised invoice. With that I expect release today.', needsReply: true, doc: 'ci', quick: ['Confirmed, 3002.15.90 and that description are correct', 'Not sure, please check with the study team'] },
    ],
    activity: [
      { at: t(0, '07:55'), text: 'Destination amendment required · yellow channel inspection at GRU' },
      { at: t(-1, '09:20'), text: 'OK to Send given by WC Customs São Paulo' },
      { at: t(-2, '16:40'), text: 'Request OK to Send submitted' },
      { at: t(-3, '10:09'), text: '4 of 4 documents checked' },
    ],
    entry: { regime: 'Import declaration (DI) · Brazil', entryNumber: 'DI 26/2217834-1', mrn: 'UK export MRN 26GB0K2L8M9N4P7Q3R', hs: '3002.15.90', description: 'AZD-4573 50 mg vials · clinical trial material · 24 vials', value: 'USD 9,600 (customs value, no commercial sale)', incoterm: 'DAP Campinas', dutiesEstimate: 'Exempt · clinical trial import (RDC 172)', channel: 'Yellow · document inspection', lodged: t(-1, '06:10') },
    fee: 'Customs brokerage add-on · $340',
  },
  {
    job: '261410034CL', order: 'ORD-2026-006', direction: 'Export', serviceLine: 'Commercial Supply Logistics', tier: 'Critical',
    lane: 'GB → IN', origin: { place: 'Burton upon Trent', country: 'United Kingdom', code: 'GB' }, destination: { place: 'Mumbai', country: 'India', code: 'IN' },
    goods: 'Finished product · 2–8 °C · 6 cartons', route: 'wc', broker: 'World Courier Customs · Mumbai', specialist: 'Anita Desai',
    status: 'docs', deadline: { label: 'Documents due before pick-up', at: atTime(1, 5, 20) },
    docs: [
      { ...CI('India', 'Indian customs need the IEC of the importer and the HS code on the invoice; values in the invoice currency.'), ...ok('Commercial_invoice_1203.pdf', -1, '15:12') },
      { ...PL, ...ok('Packing_list_1203.pdf', -1, '15:13') },
      { ...COA, ...ok('CoA_batch_25A302.pdf', -1, '15:14') },
      { ...CDSCO },
    ],
    messages: [
      { id: 'm1', from: 'broker', who: 'Anita Desai · WC Customs Mumbai', at: t(-1, '16:30'), text: 'Three documents are checked. I still need the CDSCO Test Licence (Form 11) naming Tata Memorial Hospital as the importer. Once it is uploaded I will pre-lodge the Bill of Entry so clearance starts before the flight lands.', needsReply: false, doc: 'cdsco' },
    ],
    activity: [
      { at: t(-1, '16:30'), text: 'WC Customs Mumbai asked for the CDSCO import licence' },
      { at: t(-1, '15:14'), text: '3 of 4 documents checked' },
      { at: t(-2, '11:00'), text: 'Shipment booked with Customs brokerage add-on' },
    ],
    entry: { regime: 'Bill of Entry · India (ICEGATE)', hs: '3004.90.99', description: 'Finished pharmaceutical product · 6 cartons · 2–8 °C', value: 'USD 41,200', incoterm: 'DAP Mumbai', dutiesEstimate: 'BCD 10% + IGST 12% · ≈ USD 9,310 (importer account)' },
    fee: 'Customs brokerage add-on · $390',
  },
  {
    job: '261405510CL', order: 'ORD-2026-005', direction: 'Export', serviceLine: 'Clinical Supply Logistics', tier: 'Critical',
    lane: 'GB → BR', origin: { place: 'Byfleet', country: 'United Kingdom', code: 'GB' }, destination: { place: 'São Paulo', country: 'Brazil', code: 'BR' },
    goods: 'IMP lot 24M311 · 2–8 °C · 3 cartons', route: 'wc', broker: 'World Courier Customs · São Paulo', specialist: 'Rafael Souza',
    status: 'review', deadline: { label: 'Review due before departure', at: atTime(0, 22, 0) }, requestedAt: t(0, '08:12'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), ...ok('Commercial_invoice_1198.pdf', 0, '08:02') },
      { ...PL, ...ok('Packing_list_1198.pdf', 0, '08:03') },
      { ...ANVISA, ...ok('ANVISA_LI_26-0871901.pdf', 0, '08:05') },
      { ...COA, ...ok('CoA_batch_24M311.pdf', 0, '08:06') },
    ],
    messages: [
      { id: 'm1', from: 'system', who: 'OK to Send', at: t(0, '08:12'), text: 'Request OK to Send sent with 4 documents checked. WC Customs São Paulo is reviewing; typical review time on this lane is 2 hours.' },
    ],
    activity: [
      { at: t(0, '08:12'), text: 'Request OK to Send submitted' },
      { at: t(0, '08:06'), text: '4 of 4 documents checked' },
    ],
    entry: { regime: 'Import declaration (DI) · Brazil', mrn: 'UK export MRN pending departure', hs: '3002.15.90', description: 'IMP lot 24M311 · clinical trial material · 3 cartons', value: 'USD 7,400 (customs value)', incoterm: 'DAP São Paulo', dutiesEstimate: 'Exempt · clinical trial import (RDC 172)' },
    fee: 'Customs brokerage add-on · $340',
  },
  {
    job: '261396071CL', order: 'ORD-2026-009', direction: 'Export', serviceLine: 'Radiopharma', tier: 'Critical',
    lane: 'GB → BR', origin: { place: 'Burton upon Trent', country: 'United Kingdom', code: 'GB' }, destination: { place: 'Porto Alegre', country: 'Brazil', code: 'BR' },
    goods: 'Radiopharmaceutical · Class 7 UN2915 · 2–8 °C', route: 'wc', broker: 'World Courier Customs · São Paulo', specialist: 'Rafael Souza',
    status: 'clearing', deadline: { label: 'Release expected', at: atTime(1, 12, 0) }, requestedAt: t(-4, '14:02'), okAt: t(-3, '09:30'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), ...ok('Commercial_invoice_1187_v2.pdf', -4, '13:40', 2), resolved: [{ check: 'Currency and total value', fix: 'Total value was blank.' }] },
      { ...PL, ...ok('Packing_list_1187.pdf', -4, '13:41') },
      { ...DGD_CLASS7, ...ok('Class7_declaration_1187.pdf', -4, '13:45') },
      { ...ANVISA, ...ok('ANVISA_LI_26-0871234.pdf', -4, '13:50') },
      { ...doc('cnen', 'CNEN authorisation', 'Brazil: radioactive material needs the CNEN import authorisation for the receiving nuclear medicine service.', ['Authorisation number', 'Receiving service matches the consignee', 'Radionuclide and activity covered', 'Valid on arrival'], [], ['CNEN_authorisation_HED.pdf']), ...ok('CNEN_authorisation_HED.pdf', -4, '13:52') },
    ],
    messages: [
      { id: 'm1', from: 'broker', who: 'Rafael Souza · WC Customs São Paulo', at: t(0, '06:20'), text: 'DI registered at GRU and parametrised to the green channel. ANVISA release is in progress; I expect customs release by 12:00 tomorrow, in time for the LA 3290 connection to Porto Alegre.' },
      { id: 'm2', from: 'broker', who: 'Rafael Souza · WC Customs São Paulo', at: t(-3, '09:30'), text: 'OK to Send given. All five documents match the ANVISA and CNEN records.' },
      { id: 'm3', from: 'system', who: 'OK to Send', at: t(-4, '14:02'), text: 'Request OK to Send sent with 5 documents checked.' },
    ],
    activity: [
      { at: t(0, '06:20'), text: 'Customs entry registered at GRU · green channel' },
      { at: t(-3, '09:30'), text: 'OK to Send given' },
      { at: t(-4, '14:02'), text: 'Request OK to Send submitted' },
      { at: t(-4, '13:52'), text: '5 of 5 documents checked' },
    ],
    entry: { regime: 'Import declaration (DI) · Brazil', entryNumber: 'DI 26/2219102-7', mrn: 'UK export MRN 26GB1A4D7F2H9K3M6P', hs: '2844.43.00', description: 'Radiopharmaceutical · Class 7 UN2915 · 1 package', value: 'USD 18,900', incoterm: 'DAP Porto Alegre', dutiesEstimate: 'Exempt · hospital use (Lei 8.010)', channel: 'Green · automatic', lodged: t(0, '06:20') },
    fee: 'Customs brokerage add-on · $420',
  },
  {
    job: '261416022CL', order: 'ORD-2026-002', direction: 'Export', serviceLine: 'Central Lab & Biostorage', tier: 'Critical',
    lane: 'IE → BR', origin: { place: 'Dublin', country: 'Ireland', code: 'IE' }, destination: { place: 'Rio de Janeiro', country: 'Brazil', code: 'BR' },
    goods: 'Frozen clinical samples · dry ice UN1845 · 2 cartons', route: 'external', broker: 'Nova Aduaneira Ltda (your appointed broker)', specialist: 'Camila Ferreira',
    status: 'broker', deadline: { label: 'Broker review due before arrival', at: atTime(1, 7, 30) }, requestedAt: t(-1, '12:15'),
    docs: [
      { ...CI('Brazil', 'Receita Federal matches the description to the NCM/HS code; generic descriptions are routed to inspection.'), ...ok('Commercial_invoice_IE-2210.pdf', -1, '11:50') },
      { ...PL, ...ok('Packing_list_IE-2210.pdf', -1, '11:51') },
      { ...DGD_DRYICE, ...ok('DG_declaration_IE-2210_signed.pdf', -1, '12:05', 2), resolved: [{ check: 'Shipper signature and date', fix: 'The declaration was not signed.' }] },
      { ...ANVISA, ...ok('ANVISA_LI_26-0870011.pdf', -1, '12:10') },
    ],
    messages: [
      { id: 'm1', from: 'system', who: 'OK to Send', at: t(-1, '12:15'), text: 'Request OK to Send sent with 4 documents checked and passed to Nova Aduaneira Ltda. World Courier does not review documents on this lane; your appointed broker is responsible for the review.' },
      { id: 'm2', from: 'broker', who: 'Camila Ferreira · Nova Aduaneira', at: t(-1, '15:40'), text: 'Documents received. Reviewing the LI against the ANVISA system; I will confirm OK to Send before the flight lands at GIG.' },
    ],
    activity: [
      { at: t(-1, '15:40'), text: 'Appointed broker acknowledged the documents' },
      { at: t(-1, '12:15'), text: 'Request OK to Send submitted · external broker' },
      { at: t(-1, '12:10'), text: '4 of 4 documents checked' },
    ],
    entry: { regime: 'Import declaration (DI) · Brazil · appointed broker', hs: '3002.12.90', description: 'Frozen human clinical samples · 2 cartons · dry ice', value: 'USD 400 (nominal, no commercial value)', incoterm: 'DAP Rio de Janeiro', dutiesEstimate: 'Exempt · diagnostic samples' },
    fee: 'Customs brokerage add-on · documents only · $120',
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
    messages: [
      { id: 'm1', from: 'system', who: 'OK to Send', at: t(0, '03:06'), text: 'OK to Send given under Blanket ID BID-2026-DE-0147. Your documents match the documents on file; the importing office approved this lane in advance.' },
      { id: 'm2', from: 'broker', who: 'Jonas Weber · WC Customs Frankfurt', at: t(0, '06:40'), text: 'Import entry pre-lodged in ATLAS for arrival at BER. No action needed from you.' },
    ],
    activity: [
      { at: t(0, '06:40'), text: 'Import entry pre-lodged (ATLAS)' },
      { at: t(0, '03:06'), text: 'OK to Send given under Blanket ID' },
      { at: t(0, '02:55'), text: '3 of 3 documents matched the Blanket ID Library' },
    ],
    entry: { regime: 'UK export declaration (CDS) + EU import (ATLAS)', entryNumber: 'ATLAS pre-lodged · AT/C/42/551907', mrn: '26GB7Q2W5E8R1T4Y6U', hs: '2844.43.00', description: 'Radiopharmaceutical · Class 7 UN2915 · 1 package', value: 'EUR 12,400', incoterm: 'DAP Berlin', dutiesEstimate: 'Duty 0% · EUSt 19% ≈ EUR 2,356 (Charité deferment)', channel: 'Pre-lodged', lodged: t(0, '06:40') },
    fee: 'Customs brokerage add-on · $260',
  },
  // ---------------- Imports ----------------
  {
    job: '261425108CL', order: 'ORD-2026-016', direction: 'Import', serviceLine: 'Central Lab & Biostorage', tier: 'Critical',
    lane: 'BR → GB', origin: { place: 'Porto Alegre', country: 'Brazil', code: 'BR' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'Frozen human samples · UN3373 · dry ice UN1845 · 4 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'action', deadline: { label: 'Entry must be lodged before arrival', at: atTime(1, 6, 15) }, requestedAt: t(-1, '17:20'),
    docs: [
      { ...PROFORMA, ...ok('Proforma_invoice_HED-0412_v2.pdf', -1, '16:58', 2), resolved: [{ check: 'Customs value and currency', fix: 'Customs value was blank.' }] },
      { ...PL, ...ok('Packing_list_HED-0412.pdf', -1, '16:59') },
      { ...DGD_DRYICE, ...ok('DG_declaration_HED-0412_signed.pdf', -1, '17:02') },
      { ...SAMPLES_DECL, ...ok('Biological_samples_declaration_HED-0412.pdf', -1, '17:05') },
      { ...IOR },
    ],
    messages: [
      { id: 'm1', from: 'broker', who: 'Hannah Price · WC Customs Heathrow', at: t(0, '08:05'), text: 'To lodge the CDS entry I need the importer of record for AstraZeneca UK: please confirm the GB EORI and whether you want postponed VAT accounting. Samples under 3002.12 are duty free; VAT is accounted for by the importer. Upload the importer of record form or reply with the EORI.', needsReply: true, doc: 'ior', quick: ['Use GB 123 4567 89 000 with postponed VAT accounting', 'I will upload the importer of record form'] },
      { id: 'm2', from: 'system', who: 'OK to Send', at: t(-1, '17:20'), text: 'Request OK to Send sent with 4 of 5 documents checked. The importer of record details are outstanding.' },
    ],
    activity: [
      { at: t(0, '08:05'), text: 'WC Customs Heathrow asked for the importer of record' },
      { at: t(-1, '17:20'), text: 'Request OK to Send submitted with 1 document outstanding' },
      { at: t(-1, '17:05'), text: '4 of 5 documents checked' },
    ],
    entry: { regime: 'UK import entry (CDS)', hs: '3002.12.00', description: 'Human clinical samples · frozen · 4 cartons · no commercial value', value: 'GBP 40 (nominal)', incoterm: 'DAP Macclesfield', dutiesEstimate: 'Duty 0% · VAT 20% on GBP 40 ≈ GBP 8 (postponed VAT if elected)' },
    fee: 'Customs brokerage add-on · $180',
  },
  {
    job: '261425331CL', order: 'ORD-2026-015', direction: 'Import', serviceLine: 'Central Lab & Biostorage', tier: 'Optimised',
    lane: 'IN → GB', origin: { place: 'Mumbai', country: 'India', code: 'IN' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'Ambient serum samples · UN3373 · 2 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'review', deadline: { label: 'Arrival at LHR', at: atTime(2, 5, 50) }, requestedAt: t(0, '09:30'),
    docs: [
      { ...PROFORMA, ...ok('Proforma_invoice_TMH-0288.pdf', 0, '09:10') },
      { ...PL, ...ok('Packing_list_TMH-0288.pdf', 0, '09:11') },
      { ...SAMPLES_DECL, ...ok('Biological_samples_declaration_TMH-0288.pdf', 0, '09:15') },
      { ...IOR, ...ok('Importer_of_record_AZ_UK.pdf', 0, '09:20') },
    ],
    messages: [
      { id: 'm1', from: 'system', who: 'OK to Send', at: t(0, '09:30'), text: 'Request OK to Send sent with 4 documents checked. WC Customs Heathrow is reviewing and will pre-lodge the CDS entry.' },
    ],
    activity: [
      { at: t(0, '09:30'), text: 'Request OK to Send submitted' },
      { at: t(0, '09:20'), text: '4 of 4 documents checked' },
    ],
    entry: { regime: 'UK import entry (CDS)', hs: '3002.12.00', description: 'Human serum samples · ambient · 2 cartons · no commercial value', value: 'GBP 20 (nominal)', incoterm: 'DAP Macclesfield', dutiesEstimate: 'Duty 0% · VAT ≈ GBP 4 (postponed VAT)' },
    fee: 'Customs brokerage add-on · $180',
  },
  {
    job: '261425490CL', order: 'ORD-2026-014', direction: 'Import', serviceLine: 'Central Lab & Biostorage', tier: 'Optimised',
    lane: 'SG → GB', origin: { place: 'Singapore', country: 'Singapore', code: 'SG' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'Frozen PBMC samples · UN3373 · dry ice · 3 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'docs', deadline: { label: 'Documents due before pick-up', at: atTime(2, 9, 0) },
    docs: [
      { ...PROFORMA, ...ok('Proforma_invoice_NCCS-0107.pdf', 0, '10:40') },
      { ...PL },
      { ...DGD_DRYICE },
      { ...SAMPLES_DECL, ...ok('Biological_samples_declaration_NCCS-0107.pdf', 0, '10:44') },
      { ...IOR, ...ok('Importer_of_record_AZ_UK.pdf', 0, '10:45') },
    ],
    messages: [
      { id: 'm1', from: 'system', who: 'OK to Send', at: t(0, '10:45'), text: '3 of 5 documents checked. Upload the packing list and the dangerous goods declaration to request OK to Send.' },
    ],
    activity: [
      { at: t(0, '10:45'), text: '3 of 5 documents checked' },
      { at: t(-1, '14:00'), text: 'Shipment booked with Customs brokerage add-on' },
    ],
    entry: { regime: 'UK import entry (CDS)', hs: '3002.12.00', description: 'Human PBMC samples · frozen · 3 cartons · no commercial value', value: 'GBP 30 (nominal)', incoterm: 'DAP Macclesfield', dutiesEstimate: 'Duty 0% · VAT ≈ GBP 6 (postponed VAT)' },
    fee: 'Customs brokerage add-on · $180',
  },
  {
    job: '261418220CL', order: 'ORD-2026-004', direction: 'Import', serviceLine: 'Central Lab & Biostorage', tier: 'Critical',
    lane: 'BR → GB', origin: { place: 'São Paulo', country: 'Brazil', code: 'BR' }, destination: { place: 'Macclesfield', country: 'United Kingdom', code: 'GB' },
    goods: 'Frozen human samples · UN3373 · dry ice · 6 cartons', route: 'wc', broker: 'World Courier Customs · Heathrow', specialist: 'Hannah Price',
    status: 'cleared', deadline: { label: 'Delivered', at: atTime(-5, 11, 20) }, requestedAt: t(-8, '15:10'), okAt: t(-8, '16:45'),
    docs: [
      { ...PROFORMA, ...ok('Proforma_invoice_HIAE-0391.pdf', -8, '14:50') },
      { ...PL, ...ok('Packing_list_HIAE-0391.pdf', -8, '14:51') },
      { ...DGD_DRYICE, ...ok('DG_declaration_HIAE-0391_signed.pdf', -8, '14:55') },
      { ...SAMPLES_DECL, ...ok('Biological_samples_declaration_HIAE-0391.pdf', -8, '14:58') },
      { ...IOR, ...ok('Importer_of_record_AZ_UK.pdf', -8, '15:00') },
    ],
    messages: [
      { id: 'm1', from: 'broker', who: 'Hannah Price · WC Customs Heathrow', at: t(-5, '08:10'), text: 'Entry cleared with no inspection. Duty nil, VAT accounted for under postponed VAT accounting. Released to the WC London hub for delivery.' },
      { id: 'm2', from: 'broker', who: 'Hannah Price · WC Customs Heathrow', at: t(-8, '16:45'), text: 'OK to Send given. CDS entry pre-lodged.' },
    ],
    activity: [
      { at: t(-5, '11:20'), text: 'Delivered to AstraZeneca Macclesfield' },
      { at: t(-5, '08:10'), text: 'Customs released · no inspection' },
      { at: t(-8, '16:45'), text: 'OK to Send given' },
      { at: t(-8, '15:10'), text: 'Request OK to Send submitted' },
    ],
    entry: { regime: 'UK import entry (CDS)', entryNumber: 'CDS 26GB4F8H2K6M9P1R3T', hs: '3002.12.00', description: 'Human clinical samples · frozen · 6 cartons · no commercial value', value: 'GBP 60 (nominal)', incoterm: 'DAP Macclesfield', dutiesEstimate: 'Duty nil · VAT GBP 12 (postponed)', channel: 'Cleared · route 6 (no inspection)', lodged: t(-8, '16:50'), released: t(-5, '08:10') },
    fee: 'Customs brokerage add-on · $180',
  },
]

export const STATUS_LABEL: Record<OkStatus, string> = {
  docs: 'Awaiting your documents',
  action: 'Action needed',
  review: 'In review',
  broker: 'Pending your broker',
  ok: 'OK to Send',
  clearing: 'Clearing customs',
  cleared: 'Cleared',
  hold: 'On hold',
}
export const STATUS_TONE: Record<OkStatus, 'ok' | 'warn' | 'bad' | 'info' | 'brand' | undefined> = {
  docs: 'warn', action: 'bad', review: 'info', broker: 'info', ok: 'ok', clearing: 'brand', cleared: 'ok', hold: 'bad',
}
export const ROUTE_LABEL: Record<ClearanceRoute, string> = { wc: 'World Courier Customs', external: 'Your appointed broker', blanket: 'Blanket ID (pre-approved lane)' }
export const fmtDeadline = (d: Date) => `${fmtDayMonth(d)} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

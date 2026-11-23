// Templates for every document a customer can upload in Brokerage (OK to Send).
// Each template is a fillable form: the fields the destination checks, what to enter, and the rules we apply on upload.
import { daysFrom, fmtDayMonthYear } from '../lib/dates'

export interface TemplateField { label: string; hint: string; example?: string }
export interface DocTemplate {
  id: string
  name: string                 // matches the document name used in Brokerage
  aliases?: string[]           // other document names this template serves
  purpose: string
  destinations: string[]
  version: string
  updated: string
  fields: TemplateField[]
  rules: string[]              // what the instant check looks for
  tips: string[]
}

const upd = (d: number) => fmtDayMonthYear(daysFrom(d))

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'TPL-CI', name: 'Commercial invoice', purpose: 'Declares the goods, their value and the parties to customs at origin and destination. Used for every export.',
    destinations: ['Brazil', 'Germany', 'India', 'All exports'], version: 'v3.2', updated: upd(-20),
    fields: [
      { label: 'Shipper (exporter) name and address', hint: 'Legal entity exactly as registered; include EORI / tax number', example: 'Novartis Pharmaceuticals UK Limited · GB EORI' },
      { label: 'Consignee name and address', hint: 'The importer of record at destination; must match the import licence', example: 'Hospital de Clínicas da Unicamp · CNPJ' },
      { label: 'Invoice number and date', hint: 'Unique; the same number appears on the packing list' },
      { label: 'Description of goods', hint: 'Product, strength, pack size and intended use; no generic terms such as "pharmaceutical samples"', example: 'JDQ-4573 50 mg vials · clinical trial material · 24 vials' },
      { label: 'HS / commodity code', hint: 'Six-digit HS plus the destination subheading where known', example: '3002.15.90 (Brazil NCM)' },
      { label: 'Quantity, unit value and total', hint: 'Per line; total in the invoice currency' },
      { label: 'Currency', hint: 'ISO code', example: 'USD' },
      { label: 'Incoterm and place', hint: 'Incoterms 2020', example: 'DAP Campinas' },
      { label: 'Country of origin', hint: 'Where the goods were manufactured, not shipped from' },
      { label: 'Signature, name and date', hint: 'Authorised signatory of the shipper' },
    ],
    rules: ['Shipper and consignee present and matching the booking', 'Description includes product, strength and pack size', 'HS code present', 'Incoterm present', 'Currency and total value present', 'Signed and dated'],
    tips: ['Receita Federal routes generic descriptions to inspection; name the product.', 'For clinical trial material add "no commercial value, value for customs purposes only" and still give a value.'],
  },
  {
    id: 'TPL-PL', name: 'Packing list', purpose: 'Lists what is in each carton so customs and the receiving site can reconcile the consignment against the invoice.',
    destinations: ['All exports'], version: 'v2.4', updated: upd(-20),
    fields: [
      { label: 'Invoice number', hint: 'Same as the commercial invoice' },
      { label: 'Number of cartons', hint: 'Total and numbered 1 of n' },
      { label: 'Per carton: contents, quantity, lot', hint: 'Line for each product in each carton' },
      { label: 'Gross and net weight per carton', hint: 'kg, two decimals' },
      { label: 'Dimensions per carton', hint: 'cm, L × W × H' },
      { label: 'Temperature condition', hint: 'Ambient, 2–8 °C, frozen, dry ice quantity' },
      { label: 'Marks and shipper reference', hint: 'Matches the carton labels' },
    ],
    rules: ['Carton count stated', 'Gross and net weight per carton', 'Contents described', 'Totals match the commercial invoice'],
    tips: ['Weights that differ from the air waybill delay clearance; weigh after packing with dry ice.'],
  },
  {
    id: 'TPL-DGD7', name: 'Shipper’s declaration (Class 7)', purpose: 'IATA Shipper’s Declaration for radioactive material. Required for every radiopharmaceutical consignment.',
    destinations: ['All Radiopharma'], version: 'v4.0', updated: upd(-35),
    fields: [
      { label: 'UN number and proper shipping name', hint: 'As the dangerous goods list', example: 'UN2915 Radioactive material, Type A package' },
      { label: 'Class and subsidiary risk', hint: 'Class 7; note any subsidiary risk' },
      { label: 'Radionuclide and physical / chemical form', hint: 'For example Lu-177, liquid' },
      { label: 'Activity (MBq / GBq) per package', hint: 'At the time of shipment' },
      { label: 'Category and transport index', hint: 'I-White, II-Yellow or III-Yellow with TI' },
      { label: 'Package type and identification mark', hint: 'Type A / B(U) with the approval mark where applicable' },
      { label: 'Number and type of packages, dimensions', hint: 'Overpack details if used' },
      { label: '24-hour emergency contact', hint: 'Name and number reachable throughout transit' },
      { label: 'Shipper signature, name, place and date', hint: 'Trained and certified signatory' },
    ],
    rules: ['UN number and proper shipping name', 'Radionuclide and activity', 'Transport index and category', 'Packaging type and approval', 'Emergency contact', 'Signed and dated'],
    tips: ['Activity and TI must match the package label at acceptance; the airline measures.'],
  },
  {
    id: 'TPL-DGD9', name: 'Dangerous goods declaration', aliases: ['Dangerous goods declaration (dry ice)'], purpose: 'Declaration for dry ice (UN1845, Class 9) and biological substances Category B (UN3373) on frozen consignments.',
    destinations: ['All frozen lanes'], version: 'v3.1', updated: upd(-35),
    fields: [
      { label: 'UN number and proper shipping name', hint: 'UN1845 Dry ice (Carbon dioxide, solid); UN3373 Biological substance, Category B where applicable' },
      { label: 'Class and packing instruction', hint: 'Class 9, PI 954; UN3373 PI 650' },
      { label: 'Net quantity of dry ice per package (kg)', hint: 'Whole kilograms' },
      { label: 'Number of packages', hint: '' },
      { label: 'Emergency contact number', hint: '24-hour' },
      { label: 'Shipper signature and date', hint: '' },
    ],
    rules: ['UN number and proper shipping name', 'Class and packing instruction', 'Net quantity of dry ice per carton', 'Emergency contact number', 'Signed and dated'],
    tips: ['Dry ice replenished in transit is recorded on the order; the declared quantity is the quantity at tender.'],
  },
  {
    id: 'TPL-COA', name: 'Certificate of analysis', purpose: 'Confirms the batch meets specification; destinations use it to match lot, expiry and manufacturer to the licence.',
    destinations: ['Brazil', 'India'], version: 'v1.8', updated: upd(-60),
    fields: [
      { label: 'Product name and strength', hint: 'As on the packing list' },
      { label: 'Batch / lot number', hint: 'Exactly as printed on the pack' },
      { label: 'Manufacture and expiry dates', hint: '' },
      { label: 'Manufacturer and site', hint: 'Licensed site address' },
      { label: 'Tests, specification and results', hint: 'Assay, purity, sterility, endotoxin as applicable' },
      { label: 'Release signature (QP / QA)', hint: 'Name, role, date' },
    ],
    rules: ['Batch number present', 'Expiry date present', 'Manufacturer stated', 'Release signature'],
    tips: ['Batch and expiry on the certificate are checked against the packing list line by line.'],
  },
  {
    id: 'TPL-LI', name: 'ANVISA import licence (LI)', purpose: 'Brazilian import licence for medicines and clinical trial material, deferred or approved in Siscomex before arrival.',
    destinations: ['Brazil'], version: 'v2.0', updated: upd(-45),
    fields: [
      { label: 'LI number', hint: '10-digit Siscomex reference', example: '26/0871234-5' },
      { label: 'Importer (consignee) name and CNPJ', hint: 'Must match the commercial invoice exactly' },
      { label: 'Product description and NCM', hint: 'As registered with ANVISA' },
      { label: 'Quantity and unit', hint: 'Covers the quantity shipped' },
      { label: 'Validity dates', hint: 'Valid on the arrival date' },
      { label: 'Study / protocol reference', hint: 'For clinical trial material (RDC 172)' },
    ],
    rules: ['LI number present', 'Consignee matches the invoice', 'Product and quantity match the shipment', 'Valid on arrival'],
    tips: ['Abbreviated hospital names on the LI are the most common cause of amendment; use the registered name.'],
  },
  {
    id: 'TPL-CNEN', name: 'CNEN authorisation', purpose: 'Brazilian nuclear regulator authorisation for the receiving nuclear medicine service to import radioactive material.',
    destinations: ['Brazil · Radiopharma'], version: 'v1.3', updated: upd(-45),
    fields: [
      { label: 'Authorisation number', hint: 'CNEN reference' },
      { label: 'Receiving service and institution', hint: 'Matches the consignee' },
      { label: 'Radionuclide and maximum activity', hint: 'Covers the activity shipped' },
      { label: 'Validity dates', hint: 'Valid on arrival' },
      { label: 'Responsible radiation protection officer', hint: 'Name and licence' },
    ],
    rules: ['Authorisation number', 'Receiving service matches the consignee', 'Radionuclide and activity covered', 'Valid on arrival'],
    tips: [],
  },
  {
    id: 'TPL-PROF', name: 'Proforma invoice (IMP returns)', aliases: ['Proforma invoice (no commercial value)'], purpose: 'Values returned investigational product or samples for customs when there is no sale.',
    destinations: ['United Kingdom imports'], version: 'v2.2', updated: upd(-15),
    fields: [
      { label: 'Shipper (site) name and address', hint: 'The clinical site returning the goods' },
      { label: 'Consignee (sponsor) name, address and EORI', hint: 'Importer of record in the UK' },
      { label: 'Description, strength and quantity', hint: 'IMP, lot and unit count; or sample type and count' },
      { label: 'HS / commodity code', hint: '3004 for medicinal product; 3002.12 for samples' },
      { label: 'Customs value and currency', hint: 'Nominal value per carton for duty purposes', example: 'GBP 10 per carton' },
      { label: 'Statement', hint: '"Returned goods, no commercial value" or "Samples, no commercial value"' },
      { label: 'Signature and date', hint: '' },
    ],
    rules: ['Shipper and consignee', 'Description with HS code', 'Customs value and currency', 'No commercial value statement', 'Signed and dated'],
    tips: ['A blank value is the most common failure; HMRC needs a number even for returns.'],
  },
  {
    id: 'TPL-RECON', name: 'Packing list and reconciliation', purpose: 'Packing list for IMP returns with the drug accountability reconciliation per lot.',
    destinations: ['United Kingdom imports'], version: 'v1.5', updated: upd(-15),
    fields: [
      { label: 'Study and site', hint: 'Protocol and site number' },
      { label: 'Number of cartons', hint: '' },
      { label: 'Per lot: units dispensed, returned, destroyed on site', hint: 'Totals must reconcile to the site accountability log' },
      { label: 'Accountability log reference', hint: 'Signed log page or system reference' },
      { label: 'Temperature condition', hint: 'Ambient, 2–8 °C or frozen with dry ice quantity' },
      { label: 'Site signature and date', hint: 'Pharmacist or study coordinator' },
    ],
    rules: ['Number of cartons', 'Lot numbers and unit counts', 'Matches the site accountability log', 'Temperature condition stated'],
    tips: [],
  },
  {
    id: 'TPL-RGR', name: 'Proof of original export (returned goods relief)', purpose: 'Evidence of the original UK export so duty and VAT are not charged again when the IMP returns.',
    destinations: ['United Kingdom imports'], version: 'v1.2', updated: upd(-15),
    fields: [
      { label: 'Original export declaration MRN', hint: '18-character UK MRN', example: '26GB0K2L8M9N4P7Q3R' },
      { label: 'Export date', hint: 'Within the last 3 years' },
      { label: 'Goods and quantity exported', hint: 'Must match what is returning' },
      { label: 'Exporter EORI', hint: 'Same legal entity as the importer' },
      { label: 'Copy of the export declaration or C88 / CDS extract', hint: 'Attach' },
    ],
    rules: ['Original export MRN (18 characters)', 'Goods match the original export', 'Exported within 3 years', 'Same importer as the original exporter'],
    tips: ['A 17-character MRN is a typo; check the original declaration.'],
  },
  {
    id: 'TPL-IOR', name: 'Importer of record details', purpose: 'Who the import entry is lodged for, how duty and VAT are paid and who is authorised to instruct the broker.',
    destinations: ['United Kingdom imports', 'Germany'], version: 'v1.6', updated: upd(-15),
    fields: [
      { label: 'Legal entity name and address', hint: 'Registered name' },
      { label: 'EORI number', hint: 'GB EORI for UK entries', example: 'GB 123 4567 89 000' },
      { label: 'VAT registration number', hint: '' },
      { label: 'Duty and VAT payment method', hint: 'Postponed VAT accounting, deferment account (with number) or pay on entry' },
      { label: 'Authorised signatory', hint: 'Name, role, email, signature and date' },
    ],
    rules: ['EORI number', 'VAT registration', 'Duty and VAT payment method', 'Authorised signatory'],
    tips: ['Postponed VAT accounting avoids paying import VAT up front on returns and samples.'],
  },
  {
    id: 'TPL-BID', name: 'Blanket ID document set', purpose: 'Cover sheet for a pre-approved lane: lists the documents on file in the Blanket ID Library that each shipment must match exactly.',
    destinations: ['Germany · Radiopharma', 'Any Blanket ID lane'], version: 'v1.0', updated: upd(-30),
    fields: [
      { label: 'Blanket ID number', hint: 'BID-YYYY-CC-NNNN', example: 'BID-2026-DE-0147' },
      { label: 'Lane and consignee', hint: 'Origin, destination and receiving department' },
      { label: 'Documents on file', hint: 'Invoice number, packing list reference, declaration reference' },
      { label: 'Approved by and validity', hint: 'Importing office, approval date, expiry' },
      { label: 'Per-shipment variables', hint: 'Activity, transport index and date are the only fields that change' },
    ],
    rules: ['Invoice number matches the document on file', 'Shipper and consignee match', 'Description and HS code match', 'Currency and value match'],
    tips: ['Change anything else and the shipment leaves the Blanket ID route and needs a full review.'],
  },
]

export const templateFor = (docName: string) => TEMPLATES.find((t) => t.name === docName || t.aliases?.includes(docName))

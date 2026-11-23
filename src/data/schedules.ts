// Generated from the deployed portal bundle; dates are relative to today so the demo always reads as live.

export const SCHEDULES = [
  {
    id: "radiopharma",
    name: "Radiopharma",
    shortDesc: "Time-critical radiopharmaceutical logistics",
    reference: "MSA-AZ-2026 \u00b7 Schedule 2",
    status: "Active",
    tierSummary: "Critical tier (strict pick up and delivery included) + Data Analytics add-on",
    startDate: "1 Jul 2026",
    renewalDate: "31 Dec 2027",
    noticePeriod: "90 days",
    sla: "30-minute response \u00b7 time-definite",
    volume: "150+ shipments / month",
    utilisation: 118,
    currency: "USD",
    rates: [
      {
        item: "Critical tier transport \u00b7 door to door (UK \u2192 EU)",
        tier: "Critical",
        rate: "24,900",
        unit: "per shipment",
        note: "Strict pick up and delivery windows included"
      },
      {
        item: "Critical tier transport \u00b7 door to door (UK domestic)",
        tier: "Critical",
        rate: "36,400",
        unit: "per shipment",
        note: "Dedicated vehicle \u00b7 two-driver"
      },
      {
        item: "Data Analytics add-on",
        tier: "Critical",
        rate: "3,600",
        unit: "per shipment",
        note: "Predictive excursion risk \u00b7 temperature of record \u00b7 benchmarking"
      },
      {
        item: "Class 7 handling and documentation (UN2915)",
        tier: "Critical",
        rate: "4,250",
        unit: "per shipment"
      },
      {
        item: "Type A packaging and shielding",
        tier: "Critical",
        rate: "980 \u2013 1,450",
        unit: "per unit"
      },
      {
        item: "Temperature monitoring device",
        tier: "Critical",
        rate: "390",
        unit: "per device"
      }
    ],
    surcharges: [
      "Fuel and security surcharge \u00b7 indexed monthly (currently 6.1%)",
      "Waiting time beyond 45 min \u00b7 95 / 15 min",
      "Weekend and bank holiday collection \u00b7 +18%"
    ],
    capabilities: [
      "Class 7 expertise",
      "Patient-specific deliveries",
      "Global regulatory support",
      "Dedicated handling",
      "24/7 control tower",
      "Full audit trail"
    ],
    valuePromise: [
      "Time-definite delivery inside the decay window",
      "Fully compliant, no manual steps in the chain",
      "Integrated DG & regulatory compliance",
      "98% on-time delivery guarantee"
    ],
    amendments: [
      {
        date: "12 Sep 2026",
        title: "Amendment 2 \u00b7 Data Analytics add-on added to all Critical tier shipments",
        by: "Approved \u00b7 AZ Procurement / WC Commercial"
      },
      {
        date: "1 Jul 2026",
        title: "Amendment 1 \u00b7 strict pick up and delivery windows bundled into Critical tier",
        by: "Approved"
      }
    ],
    linked: {
      orders: 6,
      invoices: 4,
      openValue: "$42,500"
    }
  },
  {
    id: "clinical",
    name: "Clinical Supply Logistics",
    shortDesc: "Logistics for clinical trial materials",
    reference: "MSA-AZ-2026 \u00b7 Schedule 3",
    status: "Active",
    tierSummary: "Critical and Optimised tiers \u00b7 selected per shipment",
    startDate: "1 Oct 2026",
    renewalDate: "30 Sep 2027",
    noticePeriod: "90 days",
    sla: "30-minute response (Critical) \u00b7 2-hour (Optimised)",
    volume: "300+ shipments / month",
    utilisation: 41,
    currency: "USD",
    rates: [
      {
        item: "Critical tier \u00b7 depot to site (EU)",
        tier: "Critical",
        rate: "2,980",
        unit: "per shipment",
        note: "First-patient-in, rescue and re-supply inside 24 h"
      },
      {
        item: "Optimised tier \u00b7 depot to site (EU)",
        tier: "Optimised",
        rate: "1,240",
        unit: "per shipment",
        note: "Scheduled site resupply \u00b7 consolidated"
      },
      {
        item: "Optimised tier \u00b7 depot to site (APAC)",
        tier: "Optimised",
        rate: "640",
        unit: "per shipment",
        note: "Singapore depot \u00b7 regional road and air"
      },
      {
        item: "Qualified 2\u20138 \u00b0C shipper",
        tier: "Both",
        rate: "165",
        unit: "per shipper"
      },
      {
        item: "Temperature monitoring device",
        tier: "Both",
        rate: "58",
        unit: "per device"
      },
      {
        item: "IMP returns collection and destruction certificate",
        tier: "Both",
        rate: "420",
        unit: "per collection"
      },
      {
        item: "Depot storage \u00b7 2\u20138 \u00b0C",
        tier: "Both",
        rate: "9",
        unit: "per pallet position / day",
        note: "Frankfurt, Singapore, Boston depots"
      }
    ],
    surcharges: [
      "Fuel and security surcharge \u00b7 indexed monthly",
      "Out-of-hours site delivery \u00b7 +22%",
      "Customs and import licence handling at cost"
    ],
    capabilities: [
      "IMPs, AIMs, comparators, ancillary supplies",
      "Depot, site and investigator shipments",
      "Study and site level visibility",
      "Temperature-controlled transport",
      "Global regulatory expertise",
      "Returns and destruction"
    ],
    valuePromise: [
      "Site delivery inside the protocol window",
      "Study-level visibility of every shipment and depot balance",
      "Critical tier for first-patient-in and rescue shipments",
      "Optimised tier for scheduled site resupply",
      "97% on-time delivery guarantee"
    ],
    amendments: [
      {
        date: "1 Oct 2026",
        title: "Schedule 3 signed \u00b7 Critical and Optimised tiers for studies AZ-ONC-301, AZ-CORE-201, AZ-CGT-101, AZ-RAD-404",
        by: "Approved \u00b7 AZ Clinical Supply Chain / WC Commercial"
      }
    ],
    linked: {
      orders: 3,
      invoices: 2,
      openValue: "$10,029"
    }
  }
]

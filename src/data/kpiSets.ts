// Generated from the deployed portal bundle; dates are relative to today so the demo always reads as live.

export const KPI_SETS = {
  "Clinical Supply Logistics": {
    sub: "Protocol-window delivery, customs readiness, temperature integrity and incident response for clinical trial material.",
    subscribed: true,
    metrics: [
      ["Site deliveries in window", "97%", "Within protocol delivery window", true],
      ["OK to Send first time", "94%", "Documents accepted without amendment", true],
      ["Temperature integrity", "99.1%", "Shipments without an excursion", true],
      ["Open incidents", "1", "Customs query \u00b7 Camberley import", false]
    ],
    bars: [88, 90, 93, 95, 96, 96, 97],
    labels: ["Window adherence", "OK to Send first time", "Temperature integrity", "Returns and destruction"],
    vals: [97, 94, 99, 94],
    detail: [
      {
        label: "Site delivery adherence by study and site",
        sub: "Drill down by study, site or shipment",
        to: "/studies"
      },
      {
        label: "OK to Send and customs clearance",
        sub: "Documents, review time and amendments by lane",
        to: "/brokerage"
      },
      {
        label: "Investigations (CAPA)",
        sub: "Temperature excursions and delivery failures with corrective actions",
        to: "/documents?kind=capa"
      }
    ]
  },
  Radiopharma: {
    sub: "Dose-level precision, route resilience and time-to-administration protection.",
    subscribed: true,
    metrics: [
      ["Doses scheduled", "124", "Current planning window", true],
      ["Site delivery adherence", "96%", "Within appointment window", true],
      ["Dose utilisation", "92%", "Scheduled doses used", true],
      ["Rescue interventions", "4", "Proactively coordinated", false]
    ],
    bars: [91, 94, 90, 96, 95, 97, 96],
    labels: ["Dose window compliance", "Product release handoffs", "Route risk control", "Dose utilisation"],
    vals: [96, 98, 93, 92],
    detail: [
      {
        label: "Live dose delivery countdown",
        sub: "Decay margin per shipment",
        to: "/tracking?orderNumber=261408871CL"
      },
      {
        label: "Release-to-dispatch chain",
        sub: "Audit-ready evidence when available",
        to: "/tracking"
      },
      {
        label: "Route and customs risk",
        sub: "Predictive risk by lane",
        to: "/shipments/live"
      },
      {
        label: "Dose utilisation and cost per dose",
        sub: "Data Analytics add-on",
        to: "/analytics?page=spend"
      }
    ]
  },
}

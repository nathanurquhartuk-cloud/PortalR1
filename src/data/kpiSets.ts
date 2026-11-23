// Generated from the deployed portal bundle; dates are relative to today so the demo always reads as live.

export const KPI_SETS = {
  "Clinical Supply Logistics": {
    sub: "Site resupply reliability, depot readiness, protocol-window delivery and returns control.",
    subscribed: true,
    metrics: [
      ["Site deliveries in window", "97%", "Within protocol delivery window", true],
      ["Depot order-to-dispatch", "6.4 h", "Median \u00b7 Critical tier 2.1 h", true],
      ["Stock-out events avoided", "9", "Proactive replenishment \u00b7 90 days", true],
      ["Sites below threshold", "2", "Replenishment booked for both", false]
    ],
    bars: [88, 90, 93, 95, 96, 96, 97],
    labels: ["Window adherence", "Depot readiness", "Temperature integrity", "Returns and destruction"],
    vals: [97, 98, 99, 94],
    detail: [
      {
        label: "Site resupply by study and depot",
        sub: "Drill down by study, site or shipment",
        to: "/studies"
      },
      {
        label: "Depot order-to-dispatch and pick accuracy",
        sub: "Frankfurt, Singapore, Boston, London",
        to: "/studies"
      },
      {
        label: "Expiry and returns control by lot",
        sub: "Audit-ready destruction certificates",
        to: "/studies"
      },
      {
        label: "First-patient-in and rescue lead time",
        sub: "Critical tier shipments \u00b7 90 days",
        to: "/tracking"
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

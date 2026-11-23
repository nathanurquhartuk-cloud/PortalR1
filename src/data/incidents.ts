// Incident response: every incident is notified to the customer within 15 minutes of being identified and resolved within 2 hours.
import { daysFrom, fmtMonDay } from '../lib/dates'

export type IncidentLine = 'Radiopharma' | 'Clinical Supply Logistics'
export interface Incident {
  id: string
  job: string
  line: IncidentLine
  type: string
  summary: string
  identified: string        // when World Courier identified it
  notifyMins: number        // minutes from identification to customer notification
  resolveMins?: number      // minutes from identification to resolution; undefined while open
  status: 'Resolved' | 'Open'
}

const at = (day: number, time: string) => `${fmtMonDay(daysFrom(day))} ${time}`

export const INCIDENTS: Incident[] = [
  { id: 'INC-2026-0412', job: '261408871CL', line: 'Radiopharma', type: 'Lane risk', summary: 'Storm cell over Frankfurt threatened the FRA road leg; re-routed via Berlin direct.', identified: at(0, '06:48'), notifyMins: 4, resolveMins: 24, status: 'Resolved' },
  { id: 'INC-2026-0409', job: '261396071CL', line: 'Radiopharma', type: 'Temperature excursion', summary: '0.9 °C above range for 41 minutes during a tarmac dwell at GRU; logger confirmed recovery.', identified: at(-1, '09:12'), notifyMins: 6, resolveMins: 98, status: 'Resolved' },
  { id: 'INC-2026-0405', job: '261396071CL', line: 'Radiopharma', type: 'Device battery', summary: 'Logger battery below 15%; replacement logger fitted at the São Paulo hub.', identified: at(-1, '14:30'), notifyMins: 9, resolveMins: 71, status: 'Resolved' },
  { id: 'INC-2026-0398', job: '261380004CL', line: 'Radiopharma', type: 'Delivery window', summary: 'Receiving department unattended at the appointment time; rebooked within the activity window.', identified: at(-24, '09:05'), notifyMins: 3, resolveMins: 36, status: 'Resolved' },
  { id: 'INC-2026-0411', job: '261402288CL', line: 'Clinical Supply Logistics', type: 'Customs hold', summary: 'Yellow channel inspection at GRU on the invoice description; revised invoice requested.', identified: at(0, '07:40'), notifyMins: 15, resolveMins: 146, status: 'Resolved' },
  { id: 'INC-2026-0407', job: '261405510CL', line: 'Clinical Supply Logistics', type: 'Temperature excursion', summary: '1.6 °C below range in transit; dry ice replenished and the lot re-qualified.', identified: at(0, '04:02'), notifyMins: 5, resolveMins: 58, status: 'Resolved' },
  { id: 'INC-2026-0403', job: '261425108CL', line: 'Clinical Supply Logistics', type: 'Customs query', summary: 'Importer of record needed to lodge the CDS entry before arrival at LHR.', identified: at(0, '07:55'), notifyMins: 10, status: 'Open' },
  { id: 'INC-2026-0396', job: '261418220CL', line: 'Clinical Supply Logistics', type: 'Delivery window', summary: 'Returns store closed for stock count; delivery moved to 11:20 the same morning.', identified: at(-5, '08:40'), notifyMins: 7, resolveMins: 112, status: 'Resolved' },
]

// 30-day service levels per service line (the list above shows the most recent cases)
export const INCIDENT_SLA: Record<IncidentLine, { incidents: number; notified15: number; resolved2h: number; medianNotify: string; medianResolve: string; notifyTrend: number[]; resolveTrend: number[] }> = {
  Radiopharma: { incidents: 17, notified15: 100, resolved2h: 94, medianNotify: '4 min', medianResolve: '46 min', notifyTrend: [94, 96, 100, 100, 100, 100, 100], resolveTrend: [82, 86, 88, 90, 92, 94, 94] },
  'Clinical Supply Logistics': { incidents: 24, notified15: 96, resolved2h: 88, medianNotify: '7 min', medianResolve: '1 h 12 m', notifyTrend: [88, 90, 92, 92, 95, 96, 96], resolveTrend: [74, 78, 80, 83, 85, 86, 88] },
}
export const SLA = { notifyMins: 15, resolveMins: 120 }
export const fmtMins = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} m`)

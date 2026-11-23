import { create } from 'zustand'
import { OrderChange } from './orders'
import { useNotifications } from './notifications'

// Decisions the customer takes on order changes (extras proposed in transit, e.g. dry ice replenishment)
interface State {
  decisions: Record<string, 'Approved' | 'Declined'>
  decide: (change: OrderChange, orderId: string, jobNumber: string | undefined, status: 'Approved' | 'Declined') => void
}
export const useChanges = create<State>((set) => ({
  decisions: {},
  decide: (change, orderId, jobNumber, status) => {
    set((s) => ({ decisions: { ...s.decisions, [change.id]: status } }))
    const n = useNotifications.getState()
    n.items.filter((x) => x.kind === 'change' && x.needsAction && x.to.includes(orderId)).forEach((x) => n.dismiss(x.id))
    n.add({ id: `chg-${change.id}-${Date.now()}`, kind: 'change', tone: status === 'Approved' ? 'success' : 'info', title: `${change.title} ${status.toLowerCase()} · ${orderId}`, message: status === 'Approved' ? `${change.detail} ${change.cost ? change.cost + ' will appear on the invoice at the agreed rate.' : ''}`.trim() : `Declined. World Courier will keep the current dry ice charge and monitor the temperature of record.`, time: 'Just now', unread: true, to: `/shipments?job=${jobNumber || ''}&changes=1`, cta: 'See the order' })
  },
}))
export const statusOf = (c: OrderChange, decisions: Record<string, 'Approved' | 'Declined'>): OrderChange['status'] => decisions[c.id] || c.status

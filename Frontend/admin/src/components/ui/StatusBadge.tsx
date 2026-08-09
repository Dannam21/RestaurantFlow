import type { TableStatus } from '../../types/admin'

export function StatusBadge({ status, children }: { status: TableStatus; children: React.ReactNode }) {
  return <span className={`status-badge status-${status}`}><i aria-hidden="true" />{children}</span>
}

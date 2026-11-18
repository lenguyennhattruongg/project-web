/**
 * Admin System Audit Trail Page (#/admin/audit)
 * Immutable log of critical business actions, status transitions, and recorded reasons.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { formatDateTime } from '../../utils/format.js';

export class AdminAuditPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-audit container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Nhật Ký Kiểm Toán Nghiệp Vụ (Audit Logs)'),
        h('p', { className: 'page-subtitle text-muted' },
          'Ghi nhận bất biến toàn bộ hành động thay đổi trạng thái phòng, phân công, hoàn cọc và lý do bắt buộc.'
        )
      )
    );

    const logs = sharedStore.data.auditLogs;

    const card = h('div', { className: 'card-dark p-3' },
      h('div', { className: 'table-scroll-wrapper' },
        h('table', { className: 'ui-data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { scope: 'col' }, 'Thời điểm'),
              h('th', { scope: 'col' }, 'Người thực hiện'),
              h('th', { scope: 'col' }, 'Hành động'),
              h('th', { scope: 'col' }, 'Đối tượng'),
              h('th', { scope: 'col' }, 'Chi tiết nghiệp vụ & Lý do')
            )
          ),
          h('tbody', {},
            ...logs.map((log) =>
              h('tr', {},
                h('td', { className: 'text-muted' }, formatDateTime(log.created_at)),
                h('td', {}, h('strong', {}, log.actor_name)),
                h('td', {}, h('span', { className: 'badge-action-code' }, log.action)),
                h('td', { className: 'text-light' }, `${log.target_type} #${log.target_id}`),
                h('td', { className: 'text-muted' }, log.details)
              )
            )
          )
        )
      )
    );

    container.appendChild(card);
    this.mountPoint.appendChild(container);
  }
}

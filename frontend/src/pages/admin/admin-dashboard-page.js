/**
 * Admin Operational Dashboard (#/admin/dashboard)
 * Operational Queue: Rooms needing DM, rooms needing venue, rooms waiting admin decision, failed refunds.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';

export class AdminDashboardPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-dashboard container' });

    const user = auth.getUser();
    if (!user || user.role !== 'ADMIN') {
      this.router.navigate('/403');
      return;
    }

    container.appendChild(
      h('div', { className: 'page-header flex-between' },
        h('div', {},
          h('h1', { className: 'page-title' }, 'Trung Tâm Điều Hành Quản Trị (Admin Desk)'),
          h('p', { className: 'page-subtitle text-muted' },
            'Hàng đợi nghiệp vụ thời gian thực: Phân công Quản trò, duyệt phòng vật lý và xử lý sự cố.'
          )
        ),
        h('div', { className: 'quick-nav-pills' },
          h('a', { className: 'btn btn-secondary btn-sm mr-2', href: '#/admin/rooms' }, 'Quản lý phòng'),
          h('a', { className: 'btn btn-secondary btn-sm', href: '#/admin/refunds' }, 'Xử lý hoàn tiền')
        )
      )
    );

    const res = await apiService.getAdminQueue();
    const queue = res.data;

    // Queue Cards Summary
    const queueMetrics = h('div', { className: 'admin-queue-metrics-grid' },
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Phòng chờ xếp Quản trò (DM):'),
        h('div', { className: 'metric-value' },
          h('strong', { className: queue.waiting_dm.length > 0 ? 'text-amber' : 'text-light' }, String(queue.waiting_dm.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/dm-assignments' }, 'Xếp DM ngay →')
      ),
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Phòng chờ chốt phòng vật lý:'),
        h('div', { className: 'metric-value' },
          h('strong', { className: queue.waiting_org.length > 0 ? 'text-cyan' : 'text-light' }, String(queue.waiting_org.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/venues' }, 'Gán phòng quán →')
      ),
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Chờ Admin quyết định (Hết hạn thay thế):'),
        h('div', { className: 'metric-value' },
          h('strong', { className: queue.waiting_decision.length > 0 ? 'text-purple' : 'text-light' }, String(queue.waiting_decision.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/rooms' }, 'Xử lý quyết định →')
      ),
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Hoàn cọc thất bại (Cần thử lại):'),
        h('div', { className: 'metric-value' },
          h('strong', { className: queue.refunds_failed.length > 0 ? 'text-danger' : 'text-emerald' }, String(queue.refunds_failed.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/refunds' }, 'Retry hoàn tiền →')
      )
    );
    container.appendChild(queueMetrics);

    // Urgent Action Lists
    const urgentSection = h('div', { className: 'admin-urgent-section mt-4' });

    // Table of rooms needing DM
    urgentSection.appendChild(
      h('div', { className: 'urgent-card card-dark p-3 mb-4' },
        h('h3', { className: 'card-title mb-2' }, `1. Các Phòng Đã Đủ Người, Cần Gán Quản Trò (${queue.waiting_dm.length})`),
        queue.waiting_dm.length === 0
          ? h('p', { className: 'text-muted' }, 'Không có phòng nào đang chờ xếp DM.')
          : h('div', { className: 'table-scroll-wrapper' },
              h('table', { className: 'ui-data-table' },
                h('thead', {},
                  h('tr', {},
                    h('th', { scope: 'col' }, 'Mã phòng'),
                    h('th', { scope: 'col' }, 'Giờ bắt đầu ca'),
                    h('th', { scope: 'col' }, 'Số thành viên'),
                    h('th', { scope: 'col' }, 'Hành động')
                  )
                ),
                h('tbody', {},
                  ...queue.waiting_dm.map((r) =>
                    h('tr', {},
                      h('td', {}, h('strong', {}, r.code)),
                      h('td', {}, formatDateTime(r.session_start_time)),
                      h('td', {}, `${r.participants.length} người`),
                      h('td', {},
                        h('a', { className: 'btn btn-primary btn-sm', href: `#/admin/dm-assignments?room_id=${r.id}` }, 'Gán DM ngay')
                      )
                    )
                  )
                )
              )
            )
      )
    );

    container.appendChild(urgentSection);
    this.mountPoint.appendChild(container);
  }
}

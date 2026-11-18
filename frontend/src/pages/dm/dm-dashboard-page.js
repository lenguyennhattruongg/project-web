/**
 * DM Dashboard Page (#/dm/dashboard)
 * DM Desk: Pending assignments, upcoming sessions, and 12-hour preparation markers.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';

export class DmDashboardPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-dm-dashboard container' });

    const user = auth.getUser();
    if (!user || user.role !== 'DM') {
      this.router.navigate('/403');
      return;
    }

    container.appendChild(
      h('div', { className: 'page-header flex-between' },
        h('div', {},
          h('h1', { className: 'page-title' }, `Bàn Làm Việc DM — ${user.name}`),
          h('p', { className: 'page-subtitle text-muted' },
            'Theo dõi các ca phân công dẫn dắt, mốc chuẩn bị kịch bản và vận hành phiên chơi tại quán.'
          )
        ),
        h('a', { className: 'btn btn-secondary', href: '#/dm/availability' },
          renderIcon('calendar'), ' Cập Nhật Lịch Rảnh'
        )
      )
    );

    const res = await apiService.getDmAssignments();
    const assignments = res.data;
    const pendingList = assignments.filter((a) => a.dm_assignment.status === 'PENDING');
    const acceptedList = assignments.filter((a) => a.dm_assignment.status === 'ACCEPTED');

    // Metrics Row
    const metricsRow = h('div', { className: 'dm-metrics-row' },
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Phân công chờ phản hồi:'),
        h('div', { className: 'metric-value' },
          h('strong', { className: pendingList.length > 0 ? 'text-amber' : 'text-light' }, String(pendingList.length))
        ),
        h('p', { className: 'text-muted' }, 'Cần chấp nhận hoặc từ chối kèm lý do cụ thể.')
      ),
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Phiên chơi sắp tới:'),
        h('div', { className: 'metric-value' },
          h('strong', { className: 'highlight-gold' }, String(acceptedList.length))
        ),
        h('p', { className: 'text-muted' }, 'Các ca bạn đã nhận dẫn dắt.')
      ),
      h('div', { className: 'metric-card card-dark' },
        h('span', { className: 'metric-label text-muted' }, 'Quy chuẩn chuẩn bị (V16):'),
        h('div', { className: 'metric-value' },
          h('strong', { className: 'text-emerald' }, '≥ 12 Giờ')
        ),
        h('p', { className: 'text-muted' }, 'Khoảng đệm tối thiểu để DM nắm kịch bản & đạo cụ.')
      )
    );
    container.appendChild(metricsRow);

    // Pending Assignments Section
    const pendingSection = h('div', { className: 'dm-section card-dark p-3 mt-4' },
      h('div', { className: 'section-header-row flex-between' },
        h('h3', { className: 'card-title' }, `Phân Công Chờ Tiếp Nhận (${pendingList.length})`),
        h('a', { className: 'link-gold', href: '#/dm/assignments' }, 'Xem chi tiết tất cả →')
      ),
      pendingList.length === 0
        ? h('p', { className: 'text-muted' }, 'Hiện không có phân công nào đang chờ phản hồi.')
        : h('div', { className: 'assignments-grid' },
            ...pendingList.map((item) =>
              h('div', { className: 'assignment-item-card' },
                h('div', { className: 'assignment-top' },
                  h('span', { className: 'room-code' }, item.room_code),
                  renderStatusBadge('PENDING', 'Chờ bạn nhận')
                ),
                h('p', { className: 'text-muted' }, 'Giờ chơi: ', h('strong', { className: 'text-light' }, formatDateTime(item.session_start_time))),
                h('div', { className: 'item-actions mt-2' },
                  h('a', { className: 'btn btn-sm btn-primary', href: `#/dm/assignments` }, 'Xử lý phân công')
                )
              )
            )
          )
    );
    container.appendChild(pendingSection);

    this.mountPoint.appendChild(container);
  }
}

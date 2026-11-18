/**
 * Admin Operational Dashboard (#/admin/dashboard)
 * Master Tactical Ops Center — Dark Cinematic Luxury
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime, formatCurrency } from '../../utils/format.js';

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

    // Header
    container.appendChild(
      h('div', { className: 'page-header flex-between' },
        h('div', {},
          h('div', { className: 'dossier-badge-pill' },
            renderIcon('shield', 'text-gold'),
            'TACTICAL OPERATIONS DESK // ROOT PRIVILEGE'
          ),
          h('h1', { className: 'page-title' }, 'Trung Tâm Điều Hành Quản Trị'),
          h('p', { className: 'page-subtitle text-muted' },
            'Hàng đợi điều phối nghiệp vụ thời gian thực: Phân công Quản trò, phân bổ mật thất, giải quyết sự cố và kiểm soát dòng tiền cọc.'
          )
        ),
        h('div', { className: 'quick-nav-pills flex-align-center' },
          h('a', { className: 'btn btn-secondary btn-sm mr-2', href: '#/admin/rooms' }, renderIcon('list'), ' Quản lý phòng'),
          h('a', { className: 'btn btn-primary btn-sm', href: '#/admin/dm-assignments' }, renderIcon('user'), ' Điều phối DM')
        )
      )
    );

    // Transparent Demo Badge Banner
    container.appendChild(
      h('div', { className: 'tactical-badge-banner' },
        h('span', { className: 'tactical-badge-tag' }, 'DEMO MODE • CLIENT ADAPTER OPERATIONAL'),
        h('span', { className: 'text-muted' },
          `ĐĂNG NHẬP: `,
          h('strong', { className: 'text-gold' }, user.name),
          ` (QUYỀN TỐI CAO // SHARED MEMORY STORE)`
        )
      )
    );

    const res = await apiService.getAdminQueue();
    const queue = res.data;
    const allRefunds = sharedStore.data.refunds || [];
    const pendingRefunds = allRefunds.filter((r) => r.status === 'REQUESTED');
    const recentAudits = (sharedStore.data.auditLogs || []).slice(0, 5);

    // 5-Item Integrated Metrics Strip
    const metricsStrip = h('div', { className: 'admin-metrics-strip strip-5' },
      h('div', { className: 'metric-strip-item' },
        h('span', { className: 'metric-strip-label' }, 'Phòng Chờ DM'),
        h('div', { className: 'metric-strip-value' },
          h('strong', { className: queue.waiting_dm.length > 0 ? 'text-amber' : 'text-light' }, String(queue.waiting_dm.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/dm-assignments', style: { fontSize: '0.8rem' } }, 'Điều phối DM →')
      ),
      h('div', { className: 'metric-strip-item' },
        h('span', { className: 'metric-strip-label' }, 'Chờ Chốt Phòng Quán'),
        h('div', { className: 'metric-strip-value' },
          h('strong', { className: queue.waiting_org.length > 0 ? 'text-cyan' : 'text-light' }, String(queue.waiting_org.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/venues', style: { fontSize: '0.8rem' } }, 'Gán phòng quán →')
      ),
      h('div', { className: 'metric-strip-item' },
        h('span', { className: 'metric-strip-label' }, 'Chờ Quyết Định Quản Trị'),
        h('div', { className: 'metric-strip-value' },
          h('strong', { className: queue.waiting_decision.length > 0 ? 'text-danger' : 'text-light' }, String(queue.waiting_decision.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/rooms', style: { fontSize: '0.8rem' } }, 'Xử lý quyết định →')
      ),
      h('div', { className: 'metric-strip-item' },
        h('span', { className: 'metric-strip-label' }, 'Hoàn Cọc Chờ Duyệt'),
        h('div', { className: 'metric-strip-value' },
          h('strong', { className: pendingRefunds.length > 0 ? 'text-gold' : 'text-light' }, String(pendingRefunds.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/refunds', style: { fontSize: '0.8rem' } }, 'Sổ cái hoàn tiền →')
      ),
      h('div', { className: 'metric-strip-item' },
        h('span', { className: 'metric-strip-label' }, 'Hoàn Tiền Thất Bại (Retry)'),
        h('div', { className: 'metric-strip-value' },
          h('strong', { className: queue.refunds_failed.length > 0 ? 'text-danger' : 'text-emerald' }, String(queue.refunds_failed.length))
        ),
        h('a', { className: 'link-gold', href: '#/admin/refunds', style: { fontSize: '0.8rem' } }, 'Thử lại giao dịch →')
      )
    );
    container.appendChild(metricsStrip);

    // Tactical Fast Access Grid
    const navBar = h('div', { className: 'tactical-filter-bar mb-4' },
      h('a', { className: 'tactical-filter-btn', href: '#/admin/rooms' }, 'DANH SÁCH GAME ROOMS'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/dm-assignments' }, 'ĐIỀU PHỐI & THU HỒI DM'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/venues' }, 'KHÔNG GIAN VẬT LÝ & LỊCH'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/refunds' }, 'DUYỆT HOÀN CỌC (24H RULE)'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/games' }, 'BẢNG GIÁ & KỊCH BẢN (42)'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/promotions' }, 'ƯU ĐÃI & QUYẾT ĐỊNH #7'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/sessions' }, 'LỊCH TRÌNH CA CHƠI'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/users' }, 'TÀI KHOẢN & PHÂN QUYỀN (RBAC)'),
      h('a', { className: 'tactical-filter-btn', href: '#/admin/audit' }, 'NHẬT KÝ KIỂM TOÁN (AUDIT)')
    );
    container.appendChild(navBar);

    // Urgent Action Lists
    const urgentSection = h('div', { className: 'admin-urgent-section mt-4' });

    // Urgent 1: Rooms waiting for DM
    urgentSection.appendChild(
      h('div', { className: 'tactical-card mb-4' },
        h('div', { className: 'tactical-section-header' },
          h('h3', { className: 'tactical-section-title' },
            renderIcon('user', 'text-amber'),
            `1. Các Vụ Án Đã Đủ Người, Cần Gán Quản Trò (${queue.waiting_dm.length})`
          ),
          h('span', { className: 'tactical-mono-tag' }, '// DISPATCH-DM-QUEUE')
        ),
        queue.waiting_dm.length === 0
          ? h('p', { className: 'text-muted' }, 'Hiện tại không có phòng nào đang chờ phân công DM.')
          : h('div', { className: 'table-scroll-wrapper' },
              h('table', { className: 'ui-data-table' },
                h('thead', {},
                  h('tr', {},
                    h('th', { scope: 'col' }, 'Mã phòng'),
                    h('th', { scope: 'col' }, 'Kịch bản'),
                    h('th', { scope: 'col' }, 'Giờ bắt đầu ca'),
                    h('th', { scope: 'col' }, 'Thám tử'),
                    h('th', { scope: 'col' }, 'Hành động')
                  )
                ),
                h('tbody', {},
                  ...queue.waiting_dm.map((r) => {
                    const game = sharedStore.data.games.find((g) => g.id === r.game_id);
                    return h('tr', {},
                      h('td', {}, h('strong', { className: 'highlight-gold' }, r.code)),
                      h('td', {}, game?.title || r.game_id),
                      h('td', {}, formatDateTime(r.session_start_time)),
                      h('td', {}, `${r.participants.length} người`),
                      h('td', {},
                        h('a', { className: 'btn btn-primary btn-sm', href: `#/admin/dm-assignments?room_id=${r.id}` }, 'Gán DM ngay →')
                      )
                    );
                  })
                )
              )
            )
      )
    );

    // Urgent 2: Rooms waiting for Venue
    urgentSection.appendChild(
      h('div', { className: 'tactical-card mb-4' },
        h('div', { className: 'tactical-section-header' },
          h('h3', { className: 'tactical-section-title' },
            renderIcon('door', 'text-cyan'),
            `2. Các Phòng Đã Chấp Nhận DM, Chờ Chốt Mật Thất Quán (${queue.waiting_org.length})`
          ),
          h('span', { className: 'tactical-mono-tag' }, '// VENUE-ORG-QUEUE')
        ),
        queue.waiting_org.length === 0
          ? h('p', { className: 'text-muted' }, 'Hiện không có phòng nào đang chờ chốt địa điểm vật lý.')
          : h('div', { className: 'table-scroll-wrapper' },
              h('table', { className: 'ui-data-table' },
                h('thead', {},
                  h('tr', {},
                    h('th', { scope: 'col' }, 'Mã phòng'),
                    h('th', { scope: 'col' }, 'Quản trò (DM)'),
                    h('th', { scope: 'col' }, 'Giờ bắt đầu'),
                    h('th', { scope: 'col' }, 'Quy mô người'),
                    h('th', { scope: 'col' }, 'Hành động')
                  )
                ),
                h('tbody', {},
                  ...queue.waiting_org.map((r) =>
                    h('tr', {},
                      h('td', {}, h('strong', { className: 'highlight-gold' }, r.code)),
                      h('td', {}, r.dm_assignment?.dm_name || 'Đã phân công'),
                      h('td', {}, formatDateTime(r.session_start_time)),
                      h('td', {}, `${r.participants.length} người chơi + 1 DM`),
                      h('td', {},
                        h('a', { className: 'btn btn-primary btn-sm', href: `#/admin/venues?room_id=${r.id}` }, 'Chốt mật thất →')
                      )
                    )
                  )
                )
              )
            )
      )
    );

    // Urgent 3: Live Audit Intelligence Stream
    urgentSection.appendChild(
      h('div', { className: 'tactical-card mb-4' },
        h('div', { className: 'tactical-section-header' },
          h('h3', { className: 'tactical-section-title' },
            renderIcon('clock', 'text-gold'),
            '3. Dòng Nhật Ký Nghiệp Vụ Gần Nhất (Audit Intelligence Stream)'
          ),
          h('a', { className: 'link-gold', href: '#/admin/audit', style: { fontSize: '0.85rem' } }, 'Xem toàn bộ sổ cái →')
        ),
        h('div', { className: 'table-scroll-wrapper' },
          h('table', { className: 'ui-data-table' },
            h('thead', {},
              h('tr', {},
                h('th', { scope: 'col' }, 'Thời điểm'),
                h('th', { scope: 'col' }, 'Tác nhân'),
                h('th', { scope: 'col' }, 'Hành động'),
                h('th', { scope: 'col' }, 'Chi tiết nghiệp vụ & Lý do')
              )
            ),
            h('tbody', {},
              ...recentAudits.map((log) =>
                h('tr', {},
                  h('td', { className: 'text-muted', style: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem' } }, formatDateTime(log.created_at)),
                  h('td', {}, h('strong', { className: 'text-light' }, log.actor_name), ` (${log.actor_role || 'ADMIN'})`),
                  h('td', {}, h('span', { className: 'buffer-pill safe' }, log.action)),
                  h('td', { className: 'text-secondary' }, log.details || log.reason || '-')
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

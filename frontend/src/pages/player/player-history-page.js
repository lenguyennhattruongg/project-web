/**
 * Player History Page (#/player/history)
 * Lists historical GameRooms, separate participation records, payment receipts, and refund requests.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime, formatCurrency } from '../../utils/format.js';

export class PlayerHistoryPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-player-history container' });

    const user = auth.getUser();
    if (!user) {
      this.router.navigate('/login');
      return;
    }

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Lịch Sử Hoạt Động & Đặt Cọc'),
        h('p', { className: 'page-subtitle text-muted' },
          'Theo dõi toàn bộ các phiên chơi đã tham gia, hóa đơn cọc và trạng thái yêu cầu hoàn tiền.'
        )
      )
    );

    const res = await apiService.getPublicRooms();
    const myRooms = res.data.filter((r) =>
      r.participants.some((p) => p.user_id === user.id)
    );

    // 1. Participated Rooms Table
    const roomsSection = h('div', { className: 'history-section card-dark mb-4' },
      h('h3', { className: 'section-title mb-3' }, 'Lịch Sử Các Phiên Chơi'),
      myRooms.length === 0
        ? h('p', { className: 'text-muted' }, 'Chưa có phiên chơi nào.')
        : h('div', { className: 'table-scroll-wrapper' },
            h('table', { className: 'ui-data-table' },
              h('thead', {},
                h('tr', {},
                  h('th', { scope: 'col' }, 'Mã phòng'),
                  h('th', { scope: 'col' }, 'Kịch bản'),
                  h('th', { scope: 'col' }, 'Giờ chơi'),
                  h('th', { scope: 'col' }, 'Trạng thái phòng'),
                  h('th', { scope: 'col' }, 'Trạng thái ghế của bạn'),
                  h('th', { scope: 'col' }, 'Chi tiết')
                )
              ),
              h('tbody', {},
                ...myRooms.map((room) => {
                  const part = room.participants.find((p) => p.user_id === user.id);
                  return h('tr', {},
                    h('td', {}, h('strong', {}, room.code)),
                    h('td', {}, room.game_details?.title || 'Kịch bản Jubensha'),
                    h('td', { className: 'text-muted' }, formatDateTime(room.session_start_time)),
                    h('td', {}, renderStatusBadge(room.status)),
                    h('td', {}, renderStatusBadge(part?.status || 'UNKNOWN')),
                    h('td', {},
                      h('a', { className: 'btn btn-sm btn-secondary', href: `#/player/rooms/${room.id}` }, 'Xem phòng')
                    )
                  );
                })
              )
            )
          )
    );
    container.appendChild(roomsSection);

    // 2. Deposit & Refund Records
    const depositSection = h('div', { className: 'history-section card-dark' },
      h('h3', { className: 'section-title mb-3' }, 'Giao Dịch Cọc (50.000 VNĐ / Lượt) & Hoàn Cọc'),
      h('div', { className: 'table-scroll-wrapper' },
        h('table', { className: 'ui-data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { scope: 'col' }, 'Mã giao dịch'),
              h('th', { scope: 'col' }, 'Phòng liên quan'),
              h('th', { scope: 'col' }, 'Loại khoản thu'),
              h('th', { scope: 'col' }, 'Số tiền'),
              h('th', { scope: 'col' }, 'Trạng thái'),
              h('th', { scope: 'col' }, 'Ghi chú / Mốc hoàn cọc')
            )
          ),
          h('tbody', {},
            h('tr', {},
              h('td', {}, 'MOCK-TX-84920'),
              h('td', {}, 'PHONG-005'),
              h('td', {}, 'Cọc giữ chỗ 1 người'),
              h('td', { className: 'highlight-gold' }, '50.000 ₫'),
              h('td', {}, renderStatusBadge('PAID', 'Đã ghi nhận')),
              h('td', { className: 'text-muted' }, 'Khấu trừ vào tổng hóa đơn khi chơi')
            ),
            h('tr', {},
              h('td', {}, 'REFUND-REQ-01'),
              h('td', {}, 'PHONG-006'),
              h('td', {}, 'Hoàn tiền cọc'),
              h('td', { className: 'text-amber' }, '50.000 ₫'),
              h('td', {}, renderStatusBadge('REQUESTED', 'Đang chờ Admin duyệt')),
              h('td', { className: 'text-muted' }, 'Đã gửi trước 24h, đủ điều kiện xét')
            )
          )
        )
      )
    );
    container.appendChild(depositSection);

    this.mountPoint.appendChild(container);
  }
}

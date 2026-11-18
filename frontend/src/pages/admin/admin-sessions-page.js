/**
 * Admin Sessions & Schedule Proposals Management Page (#/admin/sessions)
 * Schedule tracking, proposing new schedules, and emergency cancellation (Reason Dialog required).
 */
import { h, renderIcon } from '../../utils/dom.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { showReasonDialog } from '../../components/reason-dialog.js';
import { showToast } from '../../components/toast.js';

export class AdminSessionsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-sessions container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Quản Lý Ca Chơi & Đề Xuất Đổi Lịch'),
        h('p', { className: 'page-subtitle text-muted' },
          'Theo dõi tiến độ các phiên chơi thực tế tại quán và điều phối đề xuất dời lịch.'
        )
      )
    );

    const roomsWithSessions = sharedStore.data.gameRooms.filter((r) =>
      ['READY_FOR_SESSION', 'COMPLETED', 'CANCELLED'].includes(r.status) || r.session || r.schedule_proposal
    );

    const card = h('div', { className: 'card-dark p-3' },
      h('div', { className: 'table-scroll-wrapper' },
        h('table', { className: 'ui-data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { scope: 'col' }, 'Mã phòng'),
              h('th', { scope: 'col' }, 'Giờ bắt đầu ca'),
              h('th', { scope: 'col' }, 'Phòng vật lý'),
              h('th', { scope: 'col' }, 'Quản trò DM'),
              h('th', { scope: 'col' }, 'Trạng thái'),
              h('th', { scope: 'col' }, 'Thao tác Admin')
            )
          ),
          h('tbody', {},
            ...roomsWithSessions.map((room) =>
              h('tr', {},
                h('td', {}, h('strong', {}, room.code)),
                h('td', { className: 'text-muted' }, formatDateTime(room.session_start_time)),
                h('td', {}, room.physical_room?.name || '—'),
                h('td', {}, room.dm_assignment?.dm_name || 'Chưa gán'),
                h('td', {}, renderStatusBadge(room.session?.status || room.status)),
                h('td', {},
                  h('div', { className: 'table-action-btns' },
                    h('button', {
                      className: 'btn btn-sm btn-secondary text-danger',
                      onclick: () => this.handleEmergencyCancel(room),
                    }, 'Hủy khẩn cấp')
                  )
                )
              )
            )
          )
        )
      )
    );

    container.appendChild(card);
    this.mountPoint.appendChild(container);
  }

  handleEmergencyCancel(room) {
    showReasonDialog({
      title: `Hủy khẩn cấp ca chơi ${room.code}`,
      actionKey: 'ADMIN_EMERGENCY_CANCEL_SESSION',
      placeholder: 'Bắt buộc nêu lý do hủy khẩn cấp (mất điện, sự cố an toàn, vi phạm nghiêm trọng)...',
      confirmLabel: 'Xác nhận hủy khẩn cấp',
      onSubmit: (reason) => {
        if (room.session) room.session.status = 'CANCELLED';
        room.status = 'CANCELLED';
        room.cancel_reason = reason;
        sharedStore.save(sharedStore.data);
        showToast(`Đã hủy khẩn cấp ca chơi ${room.code}.`, 'success');
        this.render();
      },
    });
  }
}

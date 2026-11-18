/**
 * DM Assignments Page (#/dm/assignments)
 * Accept or Reject (Mandatory ReasonDialog) assignments. Rejection does NOT cancel the room.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { showReasonDialog } from '../../components/reason-dialog.js';
import { showToast } from '../../components/toast.js';

export class DmAssignmentsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-dm-assignments container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Danh Sách Phân Công Dẫn Truyện'),
        h('p', { className: 'page-subtitle text-muted' },
          'Tiếp nhận điều phối phòng chơi từ Ban Quản Trị. Từ chối yêu cầu bắt buộc cung cấp lý do rõ ràng.'
        )
      )
    );

    const res = await apiService.getDmAssignments();
    const assignments = res.data;

    const card = h('div', { className: 'assignments-list-card card-dark p-3' });

    if (assignments.length === 0) {
      card.appendChild(h('p', { className: 'text-muted' }, 'Chưa có phân công nào được giao cho bạn.'));
    } else {
      const list = h('div', { className: 'assignments-vertical-list' });

      for (const item of assignments) {
        const gameRes = await apiService.getGameById(item.game_id);
        const game = gameRes.data;
        const status = item.dm_assignment.status;
        const isPending = status === 'PENDING';

        const row = h('div', { className: 'assignment-row card-dark mb-3' },
          h('div', { className: 'row-top flex-between' },
            h('div', {},
              h('span', { className: 'room-code' }, item.room_code),
              h('h3', { className: 'item-title' }, game.title)
            ),
            renderStatusBadge(status)
          ),
          h('div', { className: 'row-meta text-muted mt-2' },
            h('div', {}, renderIcon('calendar'), ' Giờ bắt đầu phiên: ', h('strong', { className: 'text-light' }, formatDateTime(item.session_start_time))),
            h('div', {}, renderIcon('users'), ` Số thành viên trong phòng: ${item.participants_count} người`),
            h('div', {}, renderIcon('shield'), ' Chuẩn bị tối thiểu: ≥ 12 giờ trước ca chơi')
          ),
          h('div', { className: 'row-actions mt-3 flex-between' },
            h('a', { className: 'btn btn-secondary btn-sm', href: `#/dm/rooms/${item.room_id}` }, 'Xem chi tiết phòng & kịch bản'),
            isPending
              ? h('div', { className: 'action-btns' },
                  h('button', {
                    className: 'btn btn-primary btn-sm mr-2',
                    onclick: () => this.handleAccept(item.room_id),
                  }, renderIcon('check'), ' Nhận phân công'),
                  h('button', {
                    className: 'btn btn-secondary btn-sm text-danger',
                    onclick: () => this.handleReject(item.room_id),
                  }, renderIcon('x'), ' Từ chối ca')
                )
              : null
          )
        );
        list.appendChild(row);
      }
      card.appendChild(list);
    }

    container.appendChild(card);
    this.mountPoint.appendChild(container);
  }

  async handleAccept(roomId) {
    try {
      await apiService.dmRespond(roomId, true);
      showToast('Đã tiếp nhận phân công thành công!', 'success');
      this.render();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  handleReject(roomId) {
    showReasonDialog({
      title: 'Từ chối phân công dẫn dắt',
      actionKey: 'DM_REJECT_ASSIGNMENT',
      placeholder: 'Vui lòng nêu rõ lý do từ chối (bận lịch, chưa nắm kịch bản, lý do sức khỏe)...',
      confirmLabel: 'Xác nhận từ chối',
      onSubmit: async (reason) => {
        try {
          await apiService.dmRespond(roomId, false, reason);
          showToast('Đã từ chối phân công và gửi lý do tới Ban Quản Trị.', 'info');
          this.render();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
    });
  }
}

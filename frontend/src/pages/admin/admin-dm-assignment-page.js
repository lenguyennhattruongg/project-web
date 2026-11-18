/**
 * Admin DM Assignment Coordination Page (#/admin/dm-assignments)
 * Assign GM staff to ready rooms, cancel pending, revoke accepted assignments (Reason Dialog required).
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { showReasonDialog } from '../../components/reason-dialog.js';
import { showToast } from '../../components/toast.js';

export class AdminDmAssignmentPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-dm-assign container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Điều Phối & Phân Công Quản Trò (DM)'),
        h('p', { className: 'page-subtitle text-muted' },
          'Gán Quản trò cho các phòng đã gom đủ điều kiện thành lập. Đảm bảo mốc chuẩn bị ≥ 12 giờ.'
        )
      )
    );

    const rooms = sharedStore.data.gameRooms;
    const dmStaff = sharedStore.data.dmStaff;

    const waitingDmRooms = rooms.filter((r) => r.status === 'WAITING_FOR_DM');

    const card = h('div', { className: 'assign-card card-dark p-3' },
      h('h3', { className: 'card-title mb-3' }, `Phòng Đang Cần Phân Công DM (${waitingDmRooms.length})`),
      waitingDmRooms.length === 0
        ? h('p', { className: 'text-muted' }, 'Tất cả các phòng đều đã được gán Quản trò.')
        : h('div', { className: 'assign-list' },
            ...waitingDmRooms.map((room) => {
              const game = sharedStore.data.games.find((g) => g.id === room.game_id);
              let selectedDmId = dmStaff[0]?.id;

              return h('div', { className: 'assign-item-row p-3 mb-3 card-dark', style: { border: '1px solid var(--color-border-subtle)' } },
                h('div', { className: 'item-top flex-between' },
                  h('div', {},
                    h('span', { className: 'room-code' }, room.code),
                    h('h4', { className: 'item-title' }, game?.title || 'Kịch bản')
                  ),
                  renderStatusBadge(room.status)
                ),
                h('p', { className: 'text-muted mt-1' }, 'Giờ bắt đầu: ', h('strong', { className: 'text-light' }, formatDateTime(room.session_start_time))),
                h('div', { className: 'assign-controls-row flex-align-center mt-3' },
                  h('label', { className: 'mr-2 text-muted', style: { fontSize: '0.85rem' } }, 'Chọn Quản trò:'),
                  h('select', {
                    className: 'form-control mr-3',
                    style: { maxWidth: '280px' },
                    onchange: (e) => { selectedDmId = e.target.value; },
                  },
                    ...dmStaff.map((dm) =>
                      h('option', { value: dm.id }, `${dm.name} (${dm.experience_rooms} ca • ⭐ ${dm.rating})`)
                    )
                  ),
                  h('button', {
                    className: 'btn btn-primary btn-sm',
                    onclick: async () => {
                      try {
                        await apiService.adminAssignDm(room.id, selectedDmId);
                        showToast(`Đã phân công DM cho phòng ${room.code}.`, 'success');
                        this.render();
                      } catch (err) {
                        showToast(err.message, 'error');
                      }
                    },
                  }, renderIcon('check'), ' Xác nhận gán DM')
                )
              );
            })
          )
    );

    container.appendChild(card);
    this.mountPoint.appendChild(container);
  }
}

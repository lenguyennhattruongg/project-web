/**
 * Admin Physical Venues & Capacity Coordination Page (#/admin/venues)
 * Manages physical rooms, ensures capacity accommodates both players and DM, locks venue & schedule.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';

export class AdminVenuesPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-venues container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Quản Lý Không Gian & Phòng Chơi Vật Lý'),
        h('p', { className: 'page-subtitle text-muted' },
          'Kiểm tra sức chứa (tính cả Quản trò DM), tránh trùng lịch và chốt phòng vật lý mở thời hạn đặt cọc.'
        )
      )
    );

    const physicalRooms = sharedStore.data.physicalRooms;
    const gameRooms = sharedStore.data.gameRooms;
    const waitingOrgRooms = gameRooms.filter((r) => r.status === 'WAITING_FOR_ORGANIZATION');

    // 1. Pending Assignment to Physical Room
    const pendingCard = h('div', { className: 'venue-pending-card card-dark p-3 mb-4' },
      h('h3', { className: 'card-title mb-3' }, `Phòng Chờ Chốt Không Gian Vật Lý (${waitingOrgRooms.length})`),
      waitingOrgRooms.length === 0
        ? h('p', { className: 'text-muted' }, 'Không có phòng nào đang chờ chốt địa điểm vật lý.')
        : h('div', { className: 'pending-org-list' },
            ...waitingOrgRooms.map((room) => {
              const game = sharedStore.data.games.find((g) => g.id === room.game_id);
              let selectedPhyRoomId = physicalRooms[0]?.id;

              return h('div', { className: 'org-item-row p-3 mb-2 card-dark', style: { border: '1px solid var(--color-border-subtle)' } },
                h('div', { className: 'item-top flex-between' },
                  h('div', {},
                    h('strong', { className: 'room-code' }, room.code),
                    h('span', { className: 'ml-2 text-light' }, game?.title)
                  ),
                  renderStatusBadge(room.status)
                ),
                h('p', { className: 'text-muted mt-1' }, 'Giờ chơi: ', h('strong', { className: 'text-light' }, formatDateTime(room.session_start_time))),
                h('div', { className: 'assign-venue-row flex-align-center mt-3' },
                  h('label', { className: 'mr-2 text-muted', style: { fontSize: '0.85rem' } }, 'Chọn phòng quán:'),
                  h('select', {
                    className: 'form-control mr-3',
                    style: { maxWidth: '320px' },
                    onchange: (e) => { selectedPhyRoomId = e.target.value; },
                  },
                    ...physicalRooms.map((p) =>
                      h('option', { value: p.id, disabled: p.status !== 'AVAILABLE' },
                        `${p.name} (Sức chứa: ${p.capacity} người cả DM) - ${p.status === 'AVAILABLE' ? 'Trống' : 'Bảo trì'}`
                      )
                    )
                  ),
                  h('button', {
                    className: 'btn btn-primary btn-sm',
                    onclick: async () => {
                      try {
                        await apiService.adminConfirmVenue(room.id, selectedPhyRoomId);
                        showToast(`Đã chốt phòng vật lý cho ${room.code} và mở cọc 2 giờ cho từng thành viên!`, 'success');
                        this.render();
                      } catch (err) {
                        showToast(err.message, 'error');
                      }
                    },
                  }, renderIcon('check'), ' Chốt phòng & Mở đặt cọc')
                )
              );
            })
          )
    );
    container.appendChild(pendingCard);

    // 2. Physical Rooms List
    const venueListCard = h('div', { className: 'venues-list-card card-dark p-3' },
      h('h3', { className: 'card-title mb-3' }, 'Danh Sách Phòng Mật Thất Tại Quán'),
      h('div', { className: 'venues-grid' },
        ...physicalRooms.map((p) =>
          h('div', { className: 'venue-box p-3 mb-2 card-dark', style: { border: '1px solid var(--color-border-subtle)' } },
            h('div', { className: 'flex-between' },
              h('h4', { className: 'highlight-gold' }, p.name),
              renderStatusBadge(p.status === 'AVAILABLE' ? 'READY_FOR_SESSION' : 'CANCELLED', p.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo trì')
            ),
            h('p', { className: 'text-muted mt-1' }, `Sức chứa tối đa: ${p.capacity} người (Bao gồm cả Quản trò DM)`)
          )
        )
      )
    );
    container.appendChild(venueListCard);

    this.mountPoint.appendChild(container);
  }
}

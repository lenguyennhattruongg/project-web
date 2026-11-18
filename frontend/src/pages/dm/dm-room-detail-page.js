/**
 * DM Room Detail Page (#/dm/rooms/:id)
 * Read-only operational overview of assigned room, player roster, and physical venue.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { renderParticipantRing } from '../../components/participant-ring.js';

export class DmRoomDetailPage {
  constructor(mountPoint, { params, router }) {
    this.mountPoint = mountPoint;
    this.roomId = params.id;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-dm-room-detail container' });

    try {
      const res = await apiService.getRoomById(this.roomId);
      const room = res.data;
      const game = room.game_details;

      container.appendChild(
        h('div', { className: 'page-nav-back flex-between' },
          h('a', { className: 'btn-back', href: '#/dm/assignments' }, renderIcon('chevronLeft'), ' Về danh sách phân công'),
          h('a', { className: 'btn btn-primary', href: `#/dm/sessions/${room.id}` }, 'Đi tới bảng điều khiển ca chơi →')
        )
      );

      const header = h('div', { className: 'room-hero-card card-dark' },
        h('div', { className: 'code-row flex-between' },
          h('span', { className: 'room-code' }, room.code),
          renderStatusBadge(room.status)
        ),
        h('h1', { className: 'room-title' }, `Kịch bản: ${game.title}`),
        h('div', { className: 'room-meta-grid text-muted' },
          h('div', {}, renderIcon('calendar'), ' Giờ chơi: ', h('strong', { className: 'text-light' }, formatDateTime(room.session_start_time))),
          h('div', {}, renderIcon('shield'), ` Chuẩn bị tối thiểu: ≥ 12 giờ trước ca`),
          h('div', {}, renderIcon('sparkles'), room.physical_room ? ` Phòng quán: ${room.physical_room.name}` : ' Chưa chốt phòng vật lý')
        )
      );
      container.appendChild(header);

      const grid = h('div', { className: 'dm-detail-grid mt-4' },
        // Left: Table
        h('div', { className: 'table-card card-dark text-center' },
          h('h3', { className: 'card-title' }, 'Bàn Tròn Người Chơi'),
          renderParticipantRing({
            participants: room.participants,
            minPlayers: game.min_players,
            maxPlayers: game.max_players,
            size: 320,
          })
        ),
        // Right: Roster
        h('div', { className: 'roster-card card-dark p-3' },
          h('h3', { className: 'card-title mb-2' }, 'Danh Sách Người Chơi Thực Tế'),
          h('div', { className: 'roster-list' },
            ...room.participants.map((p) =>
              h('div', { className: 'roster-item flex-between p-2 mb-1', style: { borderBottom: '1px solid var(--color-border-subtle)' } },
                h('div', {},
                  h('strong', {}, p.name),
                  h('span', { className: 'text-muted', style: { fontSize: '0.8rem', display: 'block' } }, `ID: ${p.user_id}`)
                ),
                renderStatusBadge(p.status)
              )
            )
          )
        )
      );
      container.appendChild(grid);

      this.mountPoint.appendChild(container);
    } catch (err) {
      container.appendChild(
        h('div', { className: 'error-state text-danger' }, err.message)
      );
      this.mountPoint.appendChild(container);
    }
  }
}

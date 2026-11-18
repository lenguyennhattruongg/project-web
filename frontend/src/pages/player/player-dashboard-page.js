/**
 * Player Dashboard Page (#/player/dashboard)
 * Shows user's active GameRooms, next critical deadline, active quota (X/3), and quick alerts.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { renderCountdown } from '../../components/countdown.js';
import { formatDateTime } from '../../utils/format.js';

export class PlayerDashboardPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-player-dashboard container' });

    const user = auth.getUser();
    if (!user) {
      this.router.navigate('/login');
      return;
    }

    // 1. Dashboard Header
    const header = h('div', { className: 'dashboard-header flex-between' },
      h('div', {},
        h('h1', { className: 'dashboard-title' }, `Xin chào, ${user.name.split(' ')[0]}!`),
        h('p', { className: 'dashboard-subtitle text-muted' },
          'Quản lý các phòng chơi bạn đang tham gia hoặc khởi tạo.'
        )
      ),
      h('div', { className: 'dashboard-header-actions' },
        h('a', { className: 'btn btn-primary', href: '#/player/create-room' },
          renderIcon('plus'), ' Mở Phòng Chơi Mới'
        )
      )
    );
    container.appendChild(header);

    // 2. Metrics & Quota Overview (X/3 rooms)
    this.metricsContainer = h('div', { className: 'dashboard-metrics-grid' },
      h('div', { className: 'loading-pulse' }, 'Đang tính toán hạn chót và hạn ngạch phòng...')
    );
    container.appendChild(this.metricsContainer);

    // 3. Rooms Feed (My Created & Joined Rooms)
    this.roomsContainer = h('div', { className: 'my-rooms-section mt-4' });
    container.appendChild(this.roomsContainer);

    this.mountPoint.appendChild(container);

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    const user = auth.getUser();
    try {
      const res = await apiService.getPublicRooms();
      const allRooms = res.data;

      // Filter rooms where user is participant or creator
      const myRooms = allRooms.filter((r) =>
        r.creator_id === user.id ||
        r.participants.some((p) => p.user_id === user.id && !['LEFT', 'CANCELLED_UNPAID', 'CANCELLED_BY_ADMIN'].includes(p.status))
      );

      // Quota: Created active rooms (max 3)
      const myCreatedActive = allRooms.filter(
        (r) => r.creator_id === user.id && !['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(r.status)
      );

      // Render Metrics
      this.metricsContainer.innerHTML = '';
      this.metricsContainer.appendChild(
        h('div', { className: 'metric-card card-dark' },
          h('span', { className: 'metric-label text-muted' }, 'Phòng bạn đã mở:'),
          h('div', { className: 'metric-value' },
            h('strong', { className: myCreatedActive.length >= 3 ? 'text-danger' : 'highlight-gold' },
              `${myCreatedActive.length}`
            ),
            h('span', { className: 'metric-sub' }, ' / 3 tối đa')
          ),
          h('p', { className: 'metric-hint text-muted' }, 'Mỗi người chơi được mở tối đa 3 phòng đang hoạt động cùng lúc.')
        )
      );

      this.metricsContainer.appendChild(
        h('div', { className: 'metric-card card-dark' },
          h('span', { className: 'metric-label text-muted' }, 'Phòng đang tham gia:'),
          h('div', { className: 'metric-value' },
            h('strong', {}, String(myRooms.length)),
            h('span', { className: 'metric-sub' }, ' phòng')
          ),
          h('p', { className: 'metric-hint text-muted' }, 'Bao gồm các phòng đang tuyển, chờ cọc và đã sẵn sàng.')
        )
      );

      this.metricsContainer.appendChild(
        h('div', { className: 'metric-card card-dark' },
          h('span', { className: 'metric-label text-muted' }, 'Hồ sơ học sinh - sinh viên:'),
          h('div', { className: 'metric-value' },
            user.student_verified
              ? h('span', { className: 'badge-verified text-emerald' }, '✓ Đã xác minh HSSV')
              : h('span', { className: 'badge-unverified text-muted' }, 'Chưa đăng ký HSSV')
          ),
          h('p', { className: 'metric-hint text-muted' },
            user.student_verified
              ? 'Áp dụng giảm 20.000đ/người từ Thứ 2 đến Thứ 5 (09:00–19:00).'
              : 'Xác minh tại quán để hưởng ưu đãi HSSV.'
          )
        )
      );

      // Render Rooms
      this.roomsContainer.innerHTML = '';
      this.roomsContainer.appendChild(
        h('h2', { className: 'section-title mb-3' }, `Danh Sách Phòng Của Bạn (${myRooms.length})`)
      );

      if (myRooms.length === 0) {
        this.roomsContainer.appendChild(
          h('div', { className: 'empty-state card-dark text-center' },
            h('p', { className: 'text-muted' }, 'Bạn chưa tham gia hoặc tạo phòng chơi nào.'),
            h('div', { className: 'mt-3' },
              h('a', { className: 'btn btn-primary mr-2', href: '#/player/create-room' }, 'Tạo phòng mới'),
              h('a', { className: 'btn btn-secondary', href: '#/rooms' }, 'Khám phá phòng đang mở')
            )
          )
        );
        return;
      }

      const grid = h('div', { className: 'my-rooms-grid' });
      for (const room of myRooms) {
        const gameRes = await apiService.getGameById(room.game_id);
        const game = gameRes.data;
        const isCreator = room.creator_id === user.id;

        const card = h('div', { className: 'room-card card-dark' },
          h('div', { className: 'room-card-header' },
            h('div', { className: 'code-tag-group' },
              h('span', { className: 'room-code' }, room.code),
              isCreator ? h('span', { className: 'badge-creator' }, 'Chủ phòng') : null
            ),
            renderStatusBadge(room.status)
          ),
          h('h3', { className: 'room-game-title' },
            h('a', { href: `#/player/rooms/${room.id}` }, game.title)
          ),
          h('div', { className: 'room-meta text-muted' },
            h('div', {}, renderIcon('calendar'), ' Giờ chơi: ', h('strong', {}, formatDateTime(room.session_start_time))),
            h('div', {}, renderIcon('users'), ` Thành viên: ${room.participants.length}/${game.max_players} người`)
          ),
          room.formation_deadline && room.status === 'FORMING'
            ? h('div', { className: 'room-deadline-box' },
                renderCountdown(room.formation_deadline, { label: 'Hạn gom người' })
              )
            : null,
          h('div', { className: 'room-card-footer flex-between mt-3' },
            h('span', { className: 'text-muted', style: { fontSize: '0.85rem' } },
              room.dm_assignment ? `DM: ${room.dm_assignment.dm_name}` : 'Chưa xếp DM'
            ),
            h('a', { className: 'btn btn-primary btn-sm', href: `#/player/rooms/${room.id}` }, 'Vào phòng chi tiết →')
          )
        );
        grid.appendChild(card);
      }
      this.roomsContainer.appendChild(grid);
    } catch (err) {
      this.roomsContainer.innerHTML = `<div class="error-state text-danger">${err.message}</div>`;
    }
  }
}

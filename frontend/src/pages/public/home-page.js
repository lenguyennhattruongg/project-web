/**
 * Public Home Page (#/)
 * Cinematic Noir Hero, 6-Step How-To-Play Guide, 2 Strict Policy Commitments, Featured Games & Rooms.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { BRAND } from '../../content/brand.js';
import { apiService } from '../../api/api-service.js';
import { generateGamePosterSvg } from '../../content/assets.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { renderCountdown } from '../../components/countdown.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

export class HomePage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-home' });

    // 1. Cinematic Hero Section
    const hero = h('section', { className: 'home-hero' },
      h('div', { className: 'hero-ambient-glow' }),
      h('div', { className: 'hero-content container' },
        h('span', { className: 'hero-eyebrow' }, renderIcon('sparkles'), ' TRẢI NGHIỆM JUBENSHA THƯỢNG HẠNG'),
        h('h1', { className: 'hero-title' },
          'Vén Màn Bí Ẩn.', h('br'),
          h('span', { className: 'hero-title-accent' }, 'Tìm Ra Kẻ Thủ Ác.')
        ),
        h('p', { className: 'hero-subtitle' }, BRAND.subheading),
        h('div', { className: 'hero-actions' },
          h('a', { className: 'btn btn-primary btn-lg', href: '#/games' },
            'Khám phá 42 Kịch Bản', renderIcon('chevronRight')
          ),
          h('a', { className: 'btn btn-secondary btn-lg', href: '#/rooms' },
            'Gia nhập phòng chơi'
          )
        )
      )
    );
    container.appendChild(hero);

    // 2. Strict Policy Commitments (Chỉ 2 cam kết được phép)
    const commitmentsSection = h('section', { className: 'home-commitments section-dark' },
      h('div', { className: 'container' },
        h('div', { className: 'section-header text-center' },
          h('h2', { className: 'section-title' }, 'Cam Kết Dịch Vụ Minh Bạch'),
          h('p', { className: 'section-desc text-muted' }, 'Chính sách vận hành rõ ràng, an tâm trải nghiệm cùng hội bạn.')
        ),
        h('div', { className: 'commitments-grid' },
          ...BRAND.COMMITMENTS.map((c) =>
            h('div', { className: 'commitment-card' },
              h('div', { className: 'commitment-icon-box' }, renderIcon('shield', 'shield-icon')),
              h('h3', { className: 'commitment-title' }, c.title),
              h('p', { className: 'commitment-desc text-muted' }, c.desc)
            )
          )
        )
      )
    );
    container.appendChild(commitmentsSection);

    // 3. 6 Steps How-To-Play Guide
    const howToPlay = h('section', { className: 'home-how-to-play container' },
      h('div', { className: 'section-header' },
        h('span', { className: 'section-tag' }, 'QUY TRÌNH THAM GIA'),
        h('h2', { className: 'section-title' }, 'Cách Thức Đặt Phòng & Nhập Vai'),
        h('p', { className: 'section-desc text-muted' }, 'Tự do ghép đội, phân công Quản trò chuyên nghiệp và tận hưởng trọn vẹn kịch bản.')
      ),
      h('div', { className: 'how-to-play-grid' },
        ...BRAND.HOW_TO_PLAY_STEPS.map((step) =>
          h('div', { className: 'step-card' },
            h('span', { className: 'step-number' }, `0${step.step}`),
            h('h4', { className: 'step-title' }, step.title),
            h('p', { className: 'step-desc text-muted' }, step.desc)
          )
        )
      )
    );
    container.appendChild(howToPlay);

    // 4. Featured Games & Live Open Rooms
    const liveSection = h('section', { className: 'home-live-section section-dark' },
      h('div', { className: 'container' },
        h('div', { className: 'section-header flex-between' },
          h('div', {},
            h('span', { className: 'section-tag' }, 'ĐANG DIỄN RA'),
            h('h2', { className: 'section-title' }, 'Phòng Chơi Đang Tuyển Thành Viên')
          ),
          h('a', { className: 'link-gold', href: '#/rooms' }, 'Xem tất cả phòng →')
        ),
        h('div', { className: 'live-rooms-feed', id: 'home-live-rooms-feed' },
          h('div', { className: 'loading-pulse' }, 'Đang tải danh sách phòng...')
        )
      )
    );
    container.appendChild(liveSection);

    // 5. Footer
    const footer = h('footer', { className: 'app-footer' },
      h('div', { className: 'container footer-content' },
        h('div', { className: 'footer-brand' },
          h('h3', { className: 'brand-name' }, BRAND.name),
          h('p', { className: 'text-muted' }, BRAND.tagline)
        ),
        h('div', { className: 'footer-meta text-muted' },
          '© 2026 Kịch Bản Sát V16 • Nền tảng đặt phòng chơi Jubensha trực tuyến.'
        )
      )
    );
    container.appendChild(footer);

    this.mountPoint.appendChild(container);

    // Fetch and populate live forming rooms
    this.loadFeaturedRooms();
  }

  async loadFeaturedRooms() {
    const feed = this.mountPoint.querySelector('#home-live-rooms-feed');
    if (!feed) return;

    try {
      const res = await apiService.getPublicRooms({ status: 'FORMING' });
      feed.innerHTML = '';

      const rooms = res.data.slice(0, 3);
      if (rooms.length === 0) {
        feed.appendChild(h('p', { className: 'text-muted' }, 'Hiện chưa có phòng nào đang tuyển. Hãy là người mở phòng đầu tiên!'));
        return;
      }

      const grid = h('div', { className: 'featured-rooms-grid' });
      for (const room of rooms) {
        const game = await apiService.getGameById(room.game_id);
        const card = h('div', { className: 'room-card' },
          h('div', { className: 'room-card-header' },
            h('span', { className: 'room-code' }, room.code),
            renderStatusBadge(room.status)
          ),
          h('h4', { className: 'room-game-title' }, game.data.title),
          h('div', { className: 'room-meta-row text-muted' },
            h('span', {}, renderIcon('calendar'), ' ', formatDateTime(room.session_start_time)),
            h('span', {}, renderIcon('users'), ` ${room.participants.length}/${game.data.max_players} người`)
          ),
          room.formation_deadline
            ? h('div', { className: 'room-deadline-box' },
                renderCountdown(room.formation_deadline, { label: 'Hạn tuyển' })
              )
            : null,
          h('div', { className: 'room-card-footer' },
            h('a', { className: 'btn btn-sm btn-secondary', href: `#/rooms/${room.id}` }, 'Chi tiết phòng'),
            h('a', { className: 'btn btn-sm btn-primary', href: `#/rooms/${room.id}` }, 'Vào ghế')
          )
        );
        grid.appendChild(card);
      }
      feed.appendChild(grid);
    } catch (err) {
      feed.innerHTML = `<p class="text-danger">Không thể tải danh sách phòng: ${err.message}</p>`;
    }
  }
}

/**
 * Game Detail Page (#/games/:id)
 * Features visual hero, verified specs, 2-tier pricing, active promotions, and CTA to Create Room.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { generateGamePosterSvg } from '../../content/assets.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';
import { renderStatusBadge } from '../../components/status-badge.js';

export class GameDetailPage {
  constructor(mountPoint, { params, router }) {
    this.mountPoint = mountPoint;
    this.gameId = params.id;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-game-detail container' });

    try {
      const res = await apiService.getGameById(this.gameId);
      const game = res.data;

      // 1. Back link
      container.appendChild(
        h('div', { className: 'page-nav-back' },
          h('a', { className: 'btn-back', href: '#/games' }, renderIcon('chevronLeft'), ' Quay lại danh mục')
        )
      );

      // 2. Main Hero Grid
      const heroGrid = h('div', { className: 'game-detail-hero-grid' },
        // Left: Poster Artwork
        h('div', { className: 'game-detail-poster-col' },
          h('div', { className: 'game-poster-wrapper', innerHTML: generateGamePosterSvg(game.title, game.is_age_restricted, 380, 520) })
        ),
        // Right: Information Column
        h('div', { className: 'game-detail-info-col' },
          h('div', { className: 'game-detail-meta-tags' },
            h('span', { className: 'game-genre-tag' }, game.genre),
            game.is_age_restricted ? h('span', { className: 'game-18-badge' }, '18+ Giới hạn tuổi') : null,
            !game.verified ? h('span', { className: 'badge-unverified' }, 'Thông số minh họa (Chờ đối chiếu menu)') : null
          ),
          h('h1', { className: 'game-detail-title' }, game.title),
          h('p', { className: 'game-detail-desc text-muted' }, game.description),

          // Specs Grid
          h('div', { className: 'game-detail-specs-box' },
            h('div', { className: 'spec-item' },
              h('span', { className: 'spec-label text-muted' }, 'Số người chơi:'),
              h('strong', {}, `${game.min_players} – ${game.max_players} người`)
            ),
            h('div', { className: 'spec-item' },
              h('span', { className: 'spec-label text-muted' }, 'Thời lượng:'),
              h('strong', {}, `${game.duration_minutes} phút (~${(game.duration_minutes / 60).toFixed(1)} tiếng)`)
            ),
            h('div', { className: 'spec-item' },
              h('span', { className: 'spec-label text-muted' }, 'Độ khó phá án:'),
              h('strong', { className: 'text-gold' }, '★'.repeat(game.difficulty || 4))
            )
          ),

          // 2-Tier Pricing Table
          h('div', { className: 'pricing-tiers-card' },
            h('h4', { className: 'pricing-card-title' }, 'Bảng Giá Vé Theo Khung Giờ (Đã gồm DM & Phòng)'),
            h('div', { className: 'pricing-tiers-grid' },
              h('div', { className: 'tier-box' },
                h('span', { className: 'tier-name' }, 'Khung giờ ngày (09:00–19:59)'),
                h('span', { className: 'tier-price' }, formatCurrency(game.price_day_vnd)),
                h('span', { className: 'tier-note text-muted' }, 'Áp dụng mọi ngày')
              ),
              h('div', { className: 'tier-box tier-night' },
                h('span', { className: 'tier-name' }, 'Khung giờ tối (từ 20:00)'),
                h('span', { className: 'tier-price highlight-gold' }, formatCurrency(game.price_night_vnd)),
                h('span', { className: 'tier-note text-muted' }, 'Phụ thu ca đêm không gian nhập vai')
              )
            )
          ),

          // Active Promotions Box
          h('div', { className: 'promotions-info-box' },
            h('h4', { className: 'promos-title' }, renderIcon('sparkles'), ' Ưu Đãi Có Thể Áp Dụng (Không cộng dồn)'),
            h('ul', { className: 'promos-list text-muted' },
              h('li', {}, h('strong', {}, 'Thứ 3 Vui Vẻ:'), ' Giảm 30% giá vé khi đặt trước ít nhất 1 ngày, ca chơi bắt đầu trong 09:00–19:00.'),
              h('li', {}, h('strong', {}, 'Học Sinh - Sinh Viên:'), ' Giảm 20.000đ/người từ Thứ 2 đến Thứ 5 trong 09:00–19:00 (Yêu cầu tài khoản có trạng thái xác minh HSSV).')
            )
          ),

          // CTA Actions
          h('div', { className: 'game-detail-cta-row' },
            h('a', { className: 'btn btn-primary btn-lg', href: `#/player/create-room?game_id=${game.id}` },
              renderIcon('plus'), ' Mở Phòng Kịch Bản Này Ngay'
            )
          )
        )
      );
      container.appendChild(heroGrid);

      // 3. Related Public Rooms for this Game
      const roomsRes = await apiService.getPublicRooms({ gameId: game.id });
      const relatedRooms = roomsRes.data;

      const relatedSection = h('div', { className: 'related-rooms-section' },
        h('h3', { className: 'related-title' }, `Các Phòng Đang Chờ Thành Viên Cho Kịch Bản Này (${relatedRooms.length})`),
        relatedRooms.length === 0
          ? h('p', { className: 'text-muted' }, 'Hiện chưa có phòng nào mở cho kịch bản này. Hãy là người đầu tiên tạo phòng!')
          : h('div', { className: 'related-rooms-grid' },
              ...relatedRooms.map((r) =>
                h('div', { className: 'room-mini-card' },
                  h('div', { className: 'mini-header' },
                    h('strong', {}, r.code),
                    renderStatusBadge(r.status)
                  ),
                  h('p', { className: 'mini-time text-muted' }, formatDateTime(r.session_start_time)),
                  h('div', { className: 'mini-footer' },
                    h('span', { className: 'text-muted' }, `${r.participants.length}/${game.max_players} người`),
                    h('a', { className: 'btn btn-sm btn-secondary', href: `#/rooms/${r.id}` }, 'Tham gia ghế')
                  )
                )
              )
            )
      );
      container.appendChild(relatedSection);

      this.mountPoint.appendChild(container);
    } catch (err) {
      container.appendChild(
        h('div', { className: 'error-state text-center' },
          h('p', { className: 'text-danger' }, err.message),
          h('a', { className: 'btn btn-secondary', href: '#/games' }, 'Quay lại danh mục kịch bản')
        )
      );
      this.mountPoint.appendChild(container);
    }
  }
}

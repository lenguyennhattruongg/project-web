/**
 * Game Catalog Page (#/games)
 * Displays 42 Jubensha games with unverified status tags, 18+ stamps, and 2-tier pricing badges.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { generateGamePosterSvg } from '../../content/assets.js';
import { formatCurrency } from '../../utils/format.js';

export class GamesPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
    this.games = [];
    this.search = '';
    this.selectedGenre = '';
    this.is18Only = false;
    this.selectedPlayers = '';
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-games container' });

    // Page Header
    const header = h('div', { className: 'page-header' },
      h('h1', { className: 'page-title' }, 'Danh Mục Kịch Bản Sát (Jubensha)'),
      h('p', { className: 'page-subtitle text-muted' },
        'Khám phá 42 kịch bản đa dạng thể loại. Bảng giá cấu hình động theo 2 khung giờ trong ngày.'
      )
    );
    container.appendChild(header);

    // Filter Bar
    const filterBar = h('div', { className: 'catalog-filter-bar' },
      h('div', { className: 'search-input-group' },
        renderIcon('search', 'search-icon'),
        h('input', {
          type: 'text',
          className: 'form-control',
          placeholder: 'Tìm kiếm tên kịch bản...',
          value: this.search,
          oninput: (e) => {
            this.search = e.target.value;
            this.applyFiltersAndRenderGrid();
          },
        })
      ),
      h('div', { className: 'filter-controls' },
        h('select', {
          className: 'form-control select-genre',
          onchange: (e) => {
            this.selectedGenre = e.target.value;
            this.applyFiltersAndRenderGrid();
          },
        },
          h('option', { value: '' }, 'Tất cả thể loại'),
          h('option', { value: 'Kinh dị' }, 'Kinh dị'),
          h('option', { value: 'Trinh thám' }, 'Trinh thám'),
          h('option', { value: 'Hardcore' }, 'Hardcore'),
          h('option', { value: 'Cổ trang' }, 'Cổ trang'),
          h('option', { value: 'Hài hước hoan lạc' }, 'Hài hước')
        ),
        h('select', {
          className: 'form-control select-players',
          onchange: (e) => {
            this.selectedPlayers = e.target.value;
            this.applyFiltersAndRenderGrid();
          },
        },
          h('option', { value: '' }, 'Số người chơi'),
          h('option', { value: '5' }, '5 người'),
          h('option', { value: '6' }, '6 người'),
          h('option', { value: '7' }, '7 người'),
          h('option', { value: '8' }, '8 người')
        ),
        h('label', { className: 'filter-checkbox-label' },
          h('input', {
            type: 'checkbox',
            checked: this.is18Only,
            onchange: (e) => {
              this.is18Only = e.target.checked;
              this.applyFiltersAndRenderGrid();
            },
          }),
          h('span', {}, 'Chỉ game 18+')
        )
      )
    );
    container.appendChild(filterBar);

    // Games Grid Container
    this.gridContainer = h('div', { className: 'games-grid' },
      h('div', { className: 'loading-pulse' }, 'Đang tải danh mục kịch bản...')
    );
    container.appendChild(this.gridContainer);

    this.mountPoint.appendChild(container);

    // Initial Load
    await this.loadGames();
  }

  async loadGames() {
    try {
      const res = await apiService.getGames();
      this.games = res.data;
      this.applyFiltersAndRenderGrid();
    } catch (err) {
      this.gridContainer.innerHTML = `<div class="error-state"><p class="text-danger">Lỗi tải dữ liệu: ${err.message}</p></div>`;
    }
  }

  applyFiltersAndRenderGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    let list = [...this.games];

    if (this.search.trim()) {
      const q = this.search.toLowerCase().trim();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q));
    }
    if (this.selectedGenre) {
      list = list.filter((g) => g.genre.includes(this.selectedGenre));
    }
    if (this.is18Only) {
      list = list.filter((g) => g.is_age_restricted);
    }
    if (this.selectedPlayers) {
      const p = parseInt(this.selectedPlayers, 10);
      list = list.filter((g) => g.min_players <= p && g.max_players >= p);
    }

    if (list.length === 0) {
      this.gridContainer.appendChild(
        h('div', { className: 'empty-state text-center' },
          h('p', { className: 'text-muted' }, 'Không tìm thấy kịch bản nào khớp với bộ lọc.')
        )
      );
      return;
    }

    list.forEach((game) => {
      const card = h('div', { className: 'game-card' },
        // Poster with SVG motif
        h('div', { className: 'game-poster-box', innerHTML: generateGamePosterSvg(game.title, game.is_age_restricted, 320, 420) }),
        // Content
        h('div', { className: 'game-card-body' },
          h('div', { className: 'game-tags-row' },
            h('span', { className: 'game-genre-tag' }, game.genre),
            game.is_age_restricted ? h('span', { className: 'game-18-badge' }, '18+') : null,
            !game.verified ? h('span', { className: 'badge-unverified', title: 'Tên và thông số đang chờ đối chiếu menu gốc của quán' }, 'Thông số minh họa') : null
          ),
          h('h3', { className: 'game-card-title' },
            h('a', { href: `#/games/${game.id}` }, game.title)
          ),
          h('div', { className: 'game-specs-row text-muted' },
            h('span', {}, renderIcon('users'), ` ${game.min_players}–${game.max_players} người`),
            h('span', {}, renderIcon('clock'), ` ${game.duration_minutes} phút`)
          ),
          // 2-Tier Pricing
          h('div', { className: 'game-pricing-tiers' },
            h('div', { className: 'tier-row' },
              h('span', { className: 'text-muted' }, 'Ngày (09:00–19:59):'),
              h('strong', {}, formatCurrency(game.price_day_vnd))
            ),
            h('div', { className: 'tier-row' },
              h('span', { className: 'text-muted' }, 'Tối (từ 20:00):'),
              h('strong', { className: 'highlight-gold' }, formatCurrency(game.price_night_vnd))
            )
          ),
          h('div', { className: 'game-card-actions' },
            h('a', { className: 'btn btn-secondary btn-block', href: `#/games/${game.id}` }, 'Xem chi tiết & Mở phòng')
          )
        )
      );
      this.gridContainer.appendChild(card);
    });
  }
}

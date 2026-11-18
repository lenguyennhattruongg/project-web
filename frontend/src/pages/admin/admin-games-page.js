/**
 * Admin Games Management Page (#/admin/games)
 * Manages all 42 catalog games, 2-tier pricing, and verified status.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { DataTable } from '../../components/data-table.js';
import { formatCurrency } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';

export class AdminGamesPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-games container' });

    container.appendChild(
      h('div', { className: 'page-header flex-between' },
        h('div', {},
          h('h1', { className: 'page-title' }, 'Quản Lý Danh Mục Kịch Bản (42 Games)'),
          h('p', { className: 'page-subtitle text-muted' },
            'Theo dõi trạng thái đối chiếu menu gốc, 2 khung giá trong ngày và giới hạn độ tuổi 18+.'
          )
        ),
        h('span', { className: 'badge-note text-muted' }, 'Toàn bộ game trong menu cửa hàng thuộc phạm vi MVP')
      )
    );

    const games = sharedStore.data.games;

    const columns = [
      { key: 'code', label: 'Mã', sortable: true, render: (val) => h('strong', {}, val) },
      { key: 'title', label: 'Tên kịch bản', sortable: true },
      { key: 'genre', label: 'Thể loại', sortable: true },
      {
        key: 'is_age_restricted',
        label: 'Độ tuổi',
        sortable: true,
        render: (val) => val ? h('span', { className: 'game-18-badge' }, '18+') : h('span', { className: 'text-muted' }, 'Thường'),
      },
      {
        key: 'verified',
        label: 'Đối chiếu menu gốc',
        sortable: true,
        render: (val) => val ? h('span', { className: 'text-emerald' }, '✓ Đã duyệt') : h('span', { className: 'badge-unverified' }, 'Chờ đối chiếu'),
      },
      {
        key: 'price_day_vnd',
        label: 'Giá ngày (09:00-19:59)',
        sortable: true,
        render: (val) => formatCurrency(val),
      },
      {
        key: 'price_night_vnd',
        label: 'Giá tối (từ 20:00)',
        sortable: true,
        render: (val) => h('strong', { className: 'highlight-gold' }, formatCurrency(val)),
      },
    ];

    const table = new DataTable({
      columns,
      data: games,
      pageSize: 10,
      searchPlaceholder: 'Tìm kiếm kịch bản theo tên, mã, thể loại...',
    });

    const card = h('div', { className: 'card-dark p-3 mt-3' });
    card.appendChild(table.render());
    container.appendChild(card);

    this.mountPoint.appendChild(container);
  }
}

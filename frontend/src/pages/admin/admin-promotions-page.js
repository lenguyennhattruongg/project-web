/**
 * Admin Promotions Management Page (#/admin/promotions)
 * Shows official active promotions, non-stackable rule, and acknowledges Open Decision #7.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { formatCurrency } from '../../utils/format.js';

export class AdminPromotionsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-promos container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Cấu Hình & Quản Lý Ưu Đãi (V16 Freeze)'),
        h('p', { className: 'page-subtitle text-muted' },
          'Các chính sách giảm giá áp dụng tự động khi người chơi đặt lịch phiên chơi.'
        )
      )
    );

    // Rule Warning
    const ruleBox = h('div', { className: 'promo-freeze-rule-box card-dark p-3 mb-4' },
      h('div', { className: 'flex-align-center mb-1' },
        renderIcon('shield', 'text-amber mr-2'),
        h('strong', { className: 'text-light' }, 'Quy Tắc Nghiệp Vụ Bắt Buộc: Hai ưu đãi KHÔNG cộng dồn.')
      ),
      h('p', { className: 'text-muted', style: { fontSize: '0.85rem' } },
        'Khi một phiên chơi thỏa mãn cả 2 ưu đãi, hệ thống giữ nguyên giá cơ sở và hiển thị thông báo chưa chốt thứ tự ưu tiên (OPEN DECISION #7). Giao diện không tự ý chọn ưu tiên.'
      )
    );
    container.appendChild(ruleBox);

    const promos = [
      {
        id: 'promo_tuesday',
        name: 'Ưu Đãi Thứ 3 Vui Vẻ',
        type: 'Giảm theo phần trăm (30%)',
        value: '-30% giá vé',
        days: 'Thứ Ba hàng tuần',
        time_window: '09:00 – 19:00',
        advance: 'Đặt trước ít nhất 1 ngày (24 giờ)',
        status: 'ACTIVE',
      },
      {
        id: 'promo_student',
        name: 'Ưu Đãi Học Sinh - Sinh Viên (HSSV)',
        type: 'Giảm cố định theo người',
        value: '-20.000 VNĐ / người',
        days: 'Thứ Hai đến Thứ Năm',
        time_window: '09:00 – 19:00',
        advance: 'Yêu cầu tài khoản có trạng thái xác minh HSSV',
        status: 'ACTIVE',
      },
    ];

    const list = h('div', { className: 'promos-grid' },
      ...promos.map((p) =>
        h('div', { className: 'promo-card card-dark p-4' },
          h('div', { className: 'flex-between mb-2' },
            h('h3', { className: 'highlight-gold' }, p.name),
            h('span', { className: 'badge-verified text-emerald' }, '● Đang áp dụng')
          ),
          h('p', { className: 'text-light font-bold mb-3', style: { fontSize: '1.2rem' } }, p.value),
          h('ul', { className: 'promo-conditions-list text-muted' },
            h('li', {}, 'Loại giảm giá: ', h('strong', { className: 'text-light' }, p.type)),
            h('li', {}, 'Ngày áp dụng: ', h('strong', { className: 'text-light' }, p.days)),
            h('li', {}, 'Khung giờ: ', h('strong', { className: 'text-light' }, p.time_window)),
            h('li', {}, 'Điều kiện: ', h('strong', { className: 'text-light' }, p.advance))
          )
        )
      )
    );
    container.appendChild(list);

    this.mountPoint.appendChild(container);
  }
}

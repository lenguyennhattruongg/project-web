/**
 * Player Profile Page (#/player/profile)
 * Displays personal details and read-only student verification status.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { auth } from '../../utils/auth.js';

export class PlayerProfilePage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-player-profile container' });

    const user = auth.getUser();
    if (!user) {
      this.router.navigate('/login');
      return;
    }

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Hồ Sơ Người Chơi'),
        h('p', { className: 'page-subtitle text-muted' },
          'Thông tin cá nhân và trạng thái xác minh hưởng quyền lợi ưu đãi.'
        )
      )
    );

    const card = h('div', { className: 'profile-card card-dark p-4', style: { maxWidth: '640px' } },
      h('div', { className: 'profile-info-grid' },
        h('div', { className: 'info-row' },
          h('span', { className: 'info-label text-muted' }, 'Họ và tên:'),
          h('strong', {}, user.name)
        ),
        h('div', { className: 'info-row' },
          h('span', { className: 'info-label text-muted' }, 'Email:'),
          h('strong', {}, user.email)
        ),
        h('div', { className: 'info-row' },
          h('span', { className: 'info-label text-muted' }, 'Số điện thoại:'),
          h('strong', {}, user.phone || '0901234567')
        ),
        h('div', { className: 'info-row' },
          h('span', { className: 'info-label text-muted' }, 'Vai trò tài khoản:'),
          h('span', { className: 'badge-role-pill' }, 'Người chơi (PLAYER)')
        ),
        h('div', { className: 'info-row row-verification mt-3 pt-3', style: { borderTop: '1px solid var(--color-border-subtle)' } },
          h('span', { className: 'info-label text-muted' }, 'Trạng thái xác minh HSSV:'),
          h('div', {},
            user.student_verified
              ? h('div', {},
                  h('span', { className: 'badge-verified text-emerald' }, '✓ ĐÃ XÁC MINH HỌC SINH - SINH VIÊN'),
                  h('p', { className: 'text-muted mt-1', style: { fontSize: '0.85rem' } },
                    `Mã thẻ: ${user.student_card_no || 'HSSV-VERIFIED'} • Tự động áp dụng giảm 20.000đ/người từ Thứ 2 đến Thứ 5 (09:00–19:00).`
                  )
                )
              : h('div', {},
                  h('span', { className: 'badge-unverified text-muted' }, 'CHƯA XÁC MINH'),
                  h('p', { className: 'text-muted mt-1', style: { fontSize: '0.85rem' } },
                    'Theo quy định: Người dùng không tự tích chọn "tôi là HSSV". Vui lòng xuất trình thẻ HSSV hợp lệ tại quầy quán để Quản trị viên cập nhật trạng thái trên hệ thống.'
                  )
                )
          )
        )
      )
    );

    container.appendChild(card);
    this.mountPoint.appendChild(container);
  }
}

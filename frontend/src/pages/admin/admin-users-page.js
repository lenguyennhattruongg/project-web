/**
 * Admin User & Roles Management Page (#/admin/users)
 * Role assignment (PLAYER, DM, ADMIN) and Student Status Verification management.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { auth, ROLES, ROLE_LABELS, DEMO_USERS } from '../../utils/auth.js';
import { showToast } from '../../components/toast.js';

export class AdminUsersPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-users container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Quản Lý Tài Khoản & Cấp Quyền (RBAC)'),
        h('p', { className: 'page-subtitle text-muted' },
          'Người dùng tự đăng ký luôn là PLAYER. Quản trị viên quản lý cấp quyền DM/Admin và duyệt thẻ HSSV.'
        )
      )
    );

    const usersList = Object.values(DEMO_USERS);

    const card = h('div', { className: 'card-dark p-3' },
      h('div', { className: 'table-scroll-wrapper' },
        h('table', { className: 'ui-data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { scope: 'col' }, 'Họ và tên'),
              h('th', { scope: 'col' }, 'Email'),
              h('th', { scope: 'col' }, 'Vai trò hiện tại'),
              h('th', { scope: 'col' }, 'Trạng thái HSSV'),
              h('th', { scope: 'col' }, 'Thao tác phân quyền')
            )
          ),
          h('tbody', {},
            ...usersList.map((u) =>
              h('tr', {},
                h('td', {}, h('strong', {}, u.name)),
                h('td', { className: 'text-muted' }, u.email),
                h('td', {}, h('span', { className: `badge-role-pill role-${u.role.toLowerCase()}` }, ROLE_LABELS[u.role])),
                h('td', {},
                  u.student_verified
                    ? h('span', { className: 'text-emerald' }, '✓ Đã xác minh')
                    : h('span', { className: 'text-muted' }, 'Chưa xác minh')
                ),
                h('td', {},
                  h('div', { className: 'table-action-btns' },
                    u.role === ROLES.PLAYER
                      ? h('button', {
                          className: 'btn btn-sm btn-secondary mr-2',
                          onclick: () => {
                            u.student_verified = !u.student_verified;
                            showToast(`Đã cập nhật trạng thái HSSV cho ${u.name}.`, 'info');
                            this.render();
                          },
                        }, u.student_verified ? 'Hủy HSSV' : 'Duyệt thẻ HSSV')
                      : null,
                    h('button', {
                      className: 'btn btn-sm btn-primary',
                      onclick: () => {
                        showToast(`Cập nhật quyền cho ${u.name} thành công.`, 'success');
                      },
                    }, 'Đổi vai trò')
                  )
                )
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

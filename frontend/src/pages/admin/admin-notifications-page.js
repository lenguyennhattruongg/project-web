/**
 * Admin Notifications Page (#/admin/notifications)
 */
import { h, renderIcon } from '../../utils/dom.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { formatDateTime } from '../../utils/format.js';

export class AdminNotificationsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-notifications container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Thông Báo Quản Trị Hệ Thống'),
        h('p', { className: 'page-subtitle text-muted' },
          'Cảnh báo các phòng đủ người cần xếp DM, phòng chờ chốt phòng vật lý và yêu cầu hoàn cọc.'
        )
      )
    );

    const list = sharedStore.data.notifications;

    const box = h('div', { className: 'notifications-list card-dark p-3' });

    if (list.length === 0) {
      box.appendChild(h('p', { className: 'text-muted' }, 'Chưa có thông báo nào.'));
    } else {
      list.forEach((n) => {
        box.appendChild(
          h('div', { className: 'notification-card-item is-read' },
            h('div', { className: 'notif-icon-box' }, renderIcon('bell')),
            h('div', { className: 'notif-content-block' },
              h('h4', { className: 'notif-title' }, n.title),
              h('p', { className: 'notif-message text-muted' }, n.message),
              h('span', { className: 'notif-time text-muted' }, formatDateTime(n.created_at))
            ),
            n.target_hash ? h('a', { className: 'btn btn-sm btn-secondary notif-action-btn', href: n.target_hash }, 'Xem ngay →') : null
          )
        );
      });
    }

    container.appendChild(box);
    this.mountPoint.appendChild(container);
  }
}

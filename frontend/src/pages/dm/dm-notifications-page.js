/**
 * DM Notifications Page (#/dm/notifications)
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { formatDateTime } from '../../utils/format.js';

export class DmNotificationsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-notifications container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Thông Báo Quản Trò (DM)'),
        h('p', { className: 'page-subtitle text-muted' },
          'Thông tin phân công điều phối, nhắc nhở giờ dẫn dắt và phản hồi từ hệ thống.'
        )
      )
    );

    const res = await apiService.getNotifications();
    const list = res.data;

    const box = h('div', { className: 'notifications-list card-dark p-3' });

    if (list.length === 0) {
      box.appendChild(h('p', { className: 'text-muted' }, 'Chưa có thông báo nào.'));
    } else {
      list.forEach((n) => {
        box.appendChild(
          h('div', { className: 'notification-card-item is-read' },
            h('div', { className: 'notif-icon-box' }, renderIcon('shield')),
            h('div', { className: 'notif-content-block' },
              h('h4', { className: 'notif-title' }, n.title),
              h('p', { className: 'notif-message text-muted' }, n.message),
              h('span', { className: 'notif-time text-muted' }, formatDateTime(n.created_at))
            ),
            n.target_hash ? h('a', { className: 'btn btn-sm btn-secondary notif-action-btn', href: n.target_hash }, 'Xem chi tiết →') : null
          )
        );
      });
    }

    container.appendChild(box);
    this.mountPoint.appendChild(container);
  }
}

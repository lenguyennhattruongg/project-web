/**
 * Player Notifications Center Page (#/player/notifications)
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { formatDateTime } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';

export class PlayerNotificationsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-notifications container' });

    const user = auth.getUser();
    if (!user) {
      this.router.navigate('/login');
      return;
    }

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Trung Tâm Thông Báo'),
        h('p', { className: 'page-subtitle text-muted' },
          'Cập nhật tiến trình phòng chơi, thông báo mở cọc, nhắc nhở hạn chót và đề xuất đổi lịch.'
        )
      )
    );

    const res = await apiService.getNotifications();
    const notifications = res.data;

    const list = h('div', { className: 'notifications-list card-dark p-3' });

    if (notifications.length === 0) {
      list.appendChild(
        h('div', { className: 'empty-state text-center' },
          h('p', { className: 'text-muted' }, 'Hộp thư của bạn hiện chưa có thông báo mới.')
        )
      );
    } else {
      notifications.forEach((item) => {
        const itemEl = h('div', { className: `notification-card-item ${item.is_read ? 'is-read' : 'unread'}` },
          h('div', { className: 'notif-icon-box' }, renderIcon('bell', 'notif-icon')),
          h('div', { className: 'notif-content-block' },
            h('h4', { className: 'notif-title' }, item.title),
            h('p', { className: 'notif-message text-muted' }, item.message),
            h('span', { className: 'notif-time text-muted' }, formatDateTime(item.created_at))
          ),
          item.target_hash
            ? h('a', { className: 'btn btn-sm btn-secondary notif-action-btn', href: item.target_hash }, 'Xem ngay →')
            : null
        );
        list.appendChild(itemEl);
      });
    }

    container.appendChild(list);
    this.mountPoint.appendChild(container);
  }
}

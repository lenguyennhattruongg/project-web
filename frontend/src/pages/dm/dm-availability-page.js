/**
 * DM Availability Calendar Page (#/dm/availability)
 * Allows DMs to toggle their weekly available shifts.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { showToast } from '../../components/toast.js';

export class DmAvailabilityPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
    this.schedule = {
      1: { morning: true, afternoon: false, night: true }, // Thứ 2
      2: { morning: false, afternoon: true, night: true },  // Thứ 3
      3: { morning: true, afternoon: true, night: false }, // Thứ 4
      4: { morning: false, afternoon: false, night: true },// Thứ 5
      5: { morning: true, afternoon: true, night: true },  // Thứ 6
      6: { morning: true, afternoon: true, night: true },  // Thứ 7
      0: { morning: false, afternoon: true, night: true }, // CN
    };
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-dm-availability container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Đăng Ký Khung Giờ Rảnh Tuần Này'),
        h('p', { className: 'page-subtitle text-muted' },
          'Ban Quản Trị sẽ dựa trên lịch rảnh của bạn để phân công ca dẫn dắt Jubensha phù hợp.'
        )
      )
    );

    const days = [
      { key: 1, name: 'Thứ Hai' },
      { key: 2, name: 'Thứ Ba' },
      { key: 3, name: 'Thứ Tư' },
      { key: 4, name: 'Thứ Năm' },
      { key: 5, name: 'Thứ Sáu' },
      { key: 6, name: 'Thứ Bảy' },
      { key: 0, name: 'Chủ Nhật' },
    ];

    const card = h('div', { className: 'availability-card card-dark p-4' },
      h('div', { className: 'table-scroll-wrapper' },
        h('table', { className: 'ui-data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { scope: 'col' }, 'Ngày trong tuần'),
              h('th', { scope: 'col' }, 'Ca sáng (09:00–13:00)'),
              h('th', { scope: 'col' }, 'Ca chiều (14:00–18:00)'),
              h('th', { scope: 'col' }, 'Ca tối (19:00–23:00)')
            )
          ),
          h('tbody', {},
            ...days.map((day) => {
              const current = this.schedule[day.key];
              return h('tr', {},
                h('td', {}, h('strong', {}, day.name)),
                h('td', {},
                  h('input', {
                    type: 'checkbox',
                    checked: current.morning,
                    onchange: (e) => { current.morning = e.target.checked; },
                  })
                ),
                h('td', {},
                  h('input', {
                    type: 'checkbox',
                    checked: current.afternoon,
                    onchange: (e) => { current.afternoon = e.target.checked; },
                  })
                ),
                h('td', {},
                  h('input', {
                    type: 'checkbox',
                    checked: current.night,
                    onchange: (e) => { current.night = e.target.checked; },
                  })
                )
              );
            })
          )
        )
      ),
      h('div', { className: 'card-actions mt-4 flex-between' },
        h('span', { className: 'text-muted', style: { fontSize: '0.85rem' } },
          'Hệ thống tự động đồng bộ lịch rảnh với bộ điều phối Quản trị viên.'
        ),
        h('button', {
          className: 'btn btn-primary',
          onclick: () => {
            showToast('Đã lưu lịch rảnh thành công!', 'success');
          },
        }, renderIcon('check'), ' Lưu Cấu Hình Lịch')
      )
    );

    container.appendChild(card);
    this.mountPoint.appendChild(container);
  }
}

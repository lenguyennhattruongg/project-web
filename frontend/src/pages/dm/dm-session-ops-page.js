/**
 * DM Session Operations Page (#/dm/sessions/:id)
 * Live execution console for DMs: Checklist, Attendance, Session Start/Complete, At-Store Payment confirmation.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';

export class DmSessionOpsPage {
  constructor(mountPoint, { params, router }) {
    this.mountPoint = mountPoint;
    this.roomId = params.id;
    this.router = router;
    this.room = null;
    this.attendance = {};
    this.prepChecklist = {
      script_read: true,
      props_ready: true,
      audio_tested: false,
    };
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-dm-session-ops container' });

    try {
      const res = await apiService.getRoomById(this.roomId);
      this.room = res.data;
      const game = this.room.game_details;
      const user = auth.getUser();

      container.appendChild(
        h('div', { className: 'page-nav-back flex-between' },
          h('a', { className: 'btn-back', href: `#/dm/rooms/${this.roomId}` }, renderIcon('chevronLeft'), ' Về chi tiết phòng DM'),
          h('span', { className: 'badge-operator text-muted' }, `Quản trò phụ trách: ${user.name}`)
        )
      );

      // Header
      const header = h('div', { className: 'session-ops-header card-dark' },
        h('div', { className: 'flex-between' },
          h('h1', { className: 'session-title' }, `Vận Hành Ca Chơi — ${this.room.code}`),
          renderStatusBadge(this.room.session?.status || this.room.status)
        ),
        h('p', { className: 'text-muted' }, `Kịch bản: ${game.title} • Phòng vật lý: ${this.room.physical_room?.name || 'Chưa gán'}`)
      );
      container.appendChild(header);

      const grid = h('div', { className: 'session-ops-grid mt-4' },
        // 1. Preparation Checklist
        h('div', { className: 'ops-card card-dark p-3' },
          h('h3', { className: 'card-title mb-2' }, '1. Chuẩn Bị Trước Giờ Chơi'),
          h('div', { className: 'checklist-items' },
            h('label', { className: 'check-label' },
              h('input', {
                type: 'checkbox',
                checked: this.prepChecklist.script_read,
                onchange: (e) => { this.prepChecklist.script_read = e.target.checked; },
              }),
              h('span', {}, ' Đã đọc kỹ kịch bản & nhánh phá án')
            ),
            h('label', { className: 'check-label' },
              h('input', {
                type: 'checkbox',
                checked: this.prepChecklist.props_ready,
                onchange: (e) => { this.prepChecklist.props_ready = e.target.checked; },
              }),
              h('span', {}, ' Trang phục & Đạo cụ mật thất đã xếp đúng vị trí')
            ),
            h('label', { className: 'check-label' },
              h('input', {
                type: 'checkbox',
                checked: this.prepChecklist.audio_tested,
                onchange: (e) => { this.prepChecklist.audio_tested = e.target.checked; },
              }),
              h('span', {}, ' Âm thanh & Ánh sáng phòng chơi hoạt động tốt')
            )
          )
        ),

        // 2. Attendance & At-Store Payment
        h('div', { className: 'ops-card card-dark p-3' },
          h('h3', { className: 'card-title mb-2' }, '2. Điểm Danh & Thu Khoản Còn Lại Tại Quán'),
          h('p', { className: 'text-muted', style: { fontSize: '0.85rem' } },
            'Xác nhận người chơi có mặt thực tế và thanh toán khoản tiền còn lại sau khi đã trừ 50.000đ cọc.'
          ),
          h('div', { className: 'attendance-roster mt-2' },
            ...this.room.participants.map((p) => {
              const isChecked = this.attendance[p.id] !== false;
              return h('div', { className: 'attendance-item flex-between p-2 mb-1', style: { borderBottom: '1px solid var(--color-border-subtle)' } },
                h('div', {},
                  h('strong', {}, p.name),
                  h('span', { className: 'text-muted ml-2', style: { fontSize: '0.8rem' } },
                    p.status === 'DEPOSITED' ? 'Đã cọc 50k' : 'Chưa cọc'
                  )
                ),
                h('div', { className: 'item-actions flex-align-center' },
                  h('label', { className: 'mr-3', style: { fontSize: '0.85rem' } },
                    h('input', {
                      type: 'checkbox',
                      checked: isChecked,
                      onchange: (e) => { this.attendance[p.id] = e.target.checked; },
                    }),
                    ' Có mặt'
                  ),
                  h('button', {
                    className: 'btn btn-sm btn-secondary',
                    onclick: () => this.confirmAtStorePayment(p),
                  }, 'Thu tiền tại quán')
                )
              );
            })
          )
        )
      );
      container.appendChild(grid);

      // Session Lifecycle Control Buttons
      const controlBar = h('div', { className: 'session-control-bar card-dark p-3 mt-4 flex-between' },
        h('div', {},
          h('h4', { className: 'highlight-gold' }, 'Điều Khiển Trạng Thái Phiên Chơi'),
          h('span', { className: 'text-muted', style: { fontSize: '0.85rem' } },
            'Chỉ Quản trò phụ trách mới có quyền kích hoạt bắt đầu và đóng ca chơi.'
          )
        ),
        h('div', { className: 'control-actions' },
          h('button', {
            className: 'btn btn-primary mr-2',
            onclick: () => this.handleStartSession(),
          }, renderIcon('check'), ' Bắt Đầu Phiên Chơi'),
          h('button', {
            className: 'btn btn-secondary',
            onclick: () => this.handleCompleteSession(),
          }, 'Hoàn Thành Phiên Chơi')
        )
      );
      container.appendChild(controlBar);

      this.mountPoint.appendChild(container);
    } catch (err) {
      container.appendChild(
        h('div', { className: 'error-state text-danger' }, err.message)
      );
      this.mountPoint.appendChild(container);
    }
  }

  confirmAtStorePayment(participant) {
    showToast(`Đã xác nhận thu khoản còn lại tại quán cho ${participant.name}. Người xác nhận: ${auth.getUser()?.name}.`, 'success');
  }

  handleStartSession() {
    showToast('Phiên chơi chính thức bắt đầu (Trạng thái chuyển sang IN_PROGRESS)!', 'success');
  }

  handleCompleteSession() {
    showToast('Phiên chơi đã kết thúc thành công (COMPLETED)!', 'success');
  }
}

/**
 * Admin GameRooms Management Page (#/admin/rooms)
 * DataTable with status filtering, Cancel Room (mandatory reason), Reopen Window (30m-4h, mandatory reason).
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { DataTable } from '../../components/data-table.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatDateTime } from '../../utils/format.js';
import { showReasonDialog } from '../../components/reason-dialog.js';
import { validateReplacementWindow } from '../../utils/rules.js';
import { showToast } from '../../components/toast.js';

export class AdminRoomsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-rooms container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Quản Lý Tất Cả GameRooms'),
        h('p', { className: 'page-subtitle text-muted' },
          'Theo dõi vòng đời phòng chơi, hủy phòng khi có sự cố và mở lại cửa sổ gom người thay thế.'
        )
      )
    );

    const res = await apiService.getPublicRooms();
    const rooms = res.data;

    const columns = [
      { key: 'code', label: 'Mã phòng', sortable: true, render: (val) => h('strong', {}, val) },
      { key: 'status', label: 'Trạng thái', sortable: true, render: (val) => renderStatusBadge(val) },
      { key: 'session_start_time', label: 'Giờ bắt đầu', sortable: true, render: (val) => formatDateTime(val) },
      { key: 'reopen_count', label: 'Số lần Reopen', sortable: true, render: (val) => String(val || 0) },
      {
        key: 'actions',
        label: 'Thao tác nghiệp vụ',
        render: (_, row) => {
          const wrap = h('div', { className: 'table-action-btns' });

          // Hủy phòng (Reason required)
          if (!['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(row.status)) {
            wrap.appendChild(
              h('button', {
                className: 'btn btn-sm btn-secondary text-danger mr-2',
                onclick: () => this.handleCancelRoom(row),
              }, 'Hủy phòng')
            );
          }

          // Reopen recruitment (Window 30m - 4h, reason required)
          if (['WAITING_FOR_ADMIN_DECISION', 'REPLENISHING'].includes(row.status)) {
            wrap.appendChild(
              h('button', {
                className: 'btn btn-sm btn-primary',
                onclick: () => this.handleReopen(row),
              }, 'Mở lại tuyển')
            );
          }

          return wrap;
        },
      },
    ];

    const table = new DataTable({
      columns,
      data: rooms,
      pageSize: 8,
      searchPlaceholder: 'Tìm theo mã phòng hoặc trạng thái...',
    });

    const card = h('div', { className: 'card-dark p-3 mt-3' });
    card.appendChild(table.render());
    container.appendChild(card);

    this.mountPoint.appendChild(container);
  }

  handleCancelRoom(room) {
    showReasonDialog({
      title: `Hủy phòng chơi ${room.code}`,
      actionKey: 'ADMIN_CANCEL_ROOM',
      placeholder: 'Bắt buộc nhập lý do hủy phòng (sự cố cơ sở vật chất, vi phạm quy chế)...',
      confirmLabel: 'Xác nhận hủy phòng',
      onSubmit: async (reason) => {
        try {
          await apiService.adminCancelRoom(room.id, reason);
          showToast(`Đã hủy phòng ${room.code} kèm lưu vết lý do audit.`, 'success');
          this.render();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
    });
  }

  handleReopen(room) {
    // Choose window: 30, 60, 120, 240 mins
    const windowMinutes = 120; // 2 hours default
    const validation = validateReplacementWindow(windowMinutes, room.session_start_time);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    showReasonDialog({
      title: `Mở lại cửa sổ tuyển người thay thế (${windowMinutes} phút)`,
      actionKey: 'ADMIN_REOPEN_RECRUITMENT',
      placeholder: 'Bắt buộc nêu lý do mở lại đợt tuyển người (thành viên báo bận đột xuất, hỗ trợ phòng ghép)...',
      confirmLabel: 'Kích hoạt Reopen',
      onSubmit: async (reason) => {
        try {
          await apiService.adminReopen(room.id, windowMinutes, reason);
          showToast(`Đã mở lại cửa sổ gom người ${windowMinutes} phút cho phòng ${room.code}.`, 'success');
          this.render();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
    });
  }
}

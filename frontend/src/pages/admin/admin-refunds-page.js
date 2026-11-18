/**
 * Admin Refund Operations Page (#/admin/refunds)
 * Strict Refund State Machine: REQUESTED -> PROCESSING -> SUCCEEDED / FAILED / REJECTED (Reason Dialog).
 */
import { h, renderIcon } from '../../utils/dom.js';
import { sharedStore } from '../../api/demo/shared-store.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';
import { showReasonDialog } from '../../components/reason-dialog.js';
import { showToast } from '../../components/toast.js';

export class AdminRefundsPage {
  constructor(mountPoint, { router }) {
    this.mountPoint = mountPoint;
    this.router = router;
  }

  render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-admin-refunds container' });

    container.appendChild(
      h('div', { className: 'page-header' },
        h('h1', { className: 'page-title' }, 'Quản Lý Yêu Cầu Hoàn Tiền Cọc'),
        h('p', { className: 'page-subtitle text-muted' },
          'Quy định: Chỉ người chơi hủy trước giờ bắt đầu ≥ 24 giờ mới đủ điều kiện xét hoàn cọc 50.000 VNĐ.'
        )
      )
    );

    const refunds = sharedStore.data.refunds;

    const card = h('div', { className: 'refunds-card card-dark p-3' },
      h('div', { className: 'table-scroll-wrapper' },
        h('table', { className: 'ui-data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { scope: 'col' }, 'Mã hoàn cọc'),
              h('th', { scope: 'col' }, 'Số tiền'),
              h('th', { scope: 'col' }, 'Trạng thái'),
              h('th', { scope: 'col' }, 'Lý do yêu cầu'),
              h('th', { scope: 'col' }, 'Ngày tạo'),
              h('th', { scope: 'col' }, 'Thao tác Admin')
            )
          ),
          h('tbody', {},
            ...refunds.map((ref) =>
              h('tr', {},
                h('td', {}, h('strong', {}, ref.id)),
                h('td', { className: 'highlight-gold' }, formatCurrency(ref.amount_vnd)),
                h('td', {}, renderStatusBadge(ref.status)),
                h('td', { className: 'text-muted' }, ref.reason),
                h('td', { className: 'text-muted' }, formatDateTime(ref.created_at)),
                h('td', {},
                  h('div', { className: 'table-action-btns' },
                    ref.status === 'REQUESTED'
                      ? h('button', {
                          className: 'btn btn-sm btn-primary mr-2',
                          onclick: () => this.handleProcessSuccess(ref),
                        }, 'Duyệt hoàn tiền')
                      : null,
                    ref.status === 'REQUESTED'
                      ? h('button', {
                          className: 'btn btn-sm btn-secondary text-danger mr-2',
                          onclick: () => this.handleRejectRefund(ref),
                        }, 'Từ chối')
                      : null,
                    ref.status === 'FAILED'
                      ? h('button', {
                          className: 'btn btn-sm btn-warning',
                          onclick: () => this.handleRetry(ref),
                        }, 'Thử lại (Retry)')
                      : null
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

  handleProcessSuccess(refund) {
    const refCode = `BANK-REF-${Math.floor(100000 + Math.random() * 900000)}`;
    refund.status = 'SUCCEEDED';
    refund.reference_code = refCode;
    sharedStore.save(sharedStore.data);
    showToast(`Đã duyệt hoàn tiền thành công! Mã tham chiếu ngân hàng: ${refCode}.`, 'success');
    this.render();
  }

  handleRejectRefund(refund) {
    showReasonDialog({
      title: `Từ chối hoàn cọc ${refund.id}`,
      actionKey: 'ADMIN_REJECT_REFUND',
      placeholder: 'Bắt buộc nêu rõ lý do từ chối (yêu cầu gửi sau mốc 24h quy định, vi phạm quy chế)...',
      confirmLabel: 'Xác nhận từ chối hoàn cọc',
      onSubmit: (reason) => {
        refund.status = 'REJECTED';
        refund.reject_reason = reason;
        sharedStore.save(sharedStore.data);
        showToast(`Đã từ chối hoàn cọc kèm lưu vết lý do.`, 'info');
        this.render();
      },
    });
  }

  handleRetry(refund) {
    refund.status = 'PROCESSING';
    refund.retry_count = (refund.retry_count || 0) + 1;
    sharedStore.save(sharedStore.data);
    showToast(`Đang thử lại lệnh hoàn tiền (Lần ${refund.retry_count})...`, 'info');
    setTimeout(() => {
      refund.status = 'SUCCEEDED';
      refund.reference_code = `RETRY-OK-${Date.now()}`;
      sharedStore.save(sharedStore.data);
      showToast('Hoàn cọc lại thành công!', 'success');
      this.render();
    }, 1200);
  }
}

/**
 * Player Room Detail Page (#/player/rooms/:id) - CORE SHOWCASE SCREEN
 * Sơ đồ bàn tròn SVG, Countdown hạn tuyển/cọc, Stepper, Action Panel, Mock Deposit Modal, Schedule Proposal, Reason Dialog.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderStatusBadge } from '../../components/status-badge.js';
import { renderCountdown } from '../../components/countdown.js';
import { renderRoomStepper } from '../../components/stepper.js';
import { renderParticipantRing } from '../../components/participant-ring.js';
import { renderPriceBreakdown } from '../../components/price-breakdown.js';
import { formatDateTime, formatCurrency } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';
import { Modal } from '../../components/modal.js';
import { showReasonDialog } from '../../components/reason-dialog.js';
import { getIdempotencyKey } from '../../utils/idempotency.js';
import { PARTICIPANT_STATUS, GAMEROOM_STATUS } from '../../utils/status.js';

export class PlayerRoomDetailPage {
  constructor(mountPoint, { params, router }) {
    this.mountPoint = mountPoint;
    this.roomId = params.id;
    this.router = router;
    this.room = null;
    this.quoteSnapshot = null;
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-player-room-detail container' });

    try {
      const res = await apiService.getRoomById(this.roomId);
      this.room = res.data;
      const game = this.room.game_details;
      const user = auth.getUser();

      // Calculate quote
      const quoteRes = await apiService.getQuote({
        game_id: game.id,
        session_start_time: this.room.session_start_time,
        player_count: game.min_players,
      });
      this.quoteSnapshot = quoteRes.data;

      // 1. Breadcrumbs & Back Nav
      const navRow = h('div', { className: 'page-nav-back flex-between' },
        h('a', { className: 'btn-back', href: '#/player/dashboard' },
          renderIcon('chevronLeft'), ' Về bảng điều khiển'
        ),
        h('button', {
          className: 'btn btn-sm btn-secondary',
          onclick: () => this.handleShareRoom(),
        }, renderIcon('share'), ' Chia sẻ link phòng')
      );
      container.appendChild(navRow);

      // 2. Room Hero Header
      const myPart = this.room.participants.find((p) => p.user_id === user?.id);
      const isCreator = this.room.creator_id === user?.id;

      const header = h('div', { className: 'room-hero-card card-dark' },
        h('div', { className: 'hero-header-top flex-between' },
          h('div', { className: 'code-block' },
            h('span', { className: 'room-code' }, this.room.code),
            isCreator ? h('span', { className: 'badge-creator' }, 'Chủ phòng') : null,
            renderStatusBadge(this.room.status)
          ),
          // Action Countdown
          h('div', { className: 'hero-countdown-box' },
            this.room.status === GAMEROOM_STATUS.FORMING && this.room.formation_deadline
              ? renderCountdown(this.room.formation_deadline, {
                  label: 'Hạn gom người',
                  onExpire: () => this.handleDeadlineExpired(),
                })
              : null,
            this.room.status === GAMEROOM_STATUS.WAITING_FOR_DEPOSIT && myPart?.deposit_deadline
              ? renderCountdown(myPart.deposit_deadline, {
                  label: 'Hạn cọc của bạn (2h)',
                  onExpire: () => this.handleDepositDeadlineExpired(),
                })
              : null,
            this.room.status === GAMEROOM_STATUS.REPLENISHING && this.room.replacement_deadline
              ? renderCountdown(this.room.replacement_deadline, {
                  label: 'Hạn tìm người thay thế',
                  onExpire: () => this.render(),
                })
              : null
          )
        ),
        h('h1', { className: 'room-title' }, game.title),
        h('div', { className: 'room-meta-grid text-muted' },
          h('div', {}, renderIcon('calendar'), ' Bắt đầu: ', h('strong', { className: 'text-light' }, formatDateTime(this.room.session_start_time))),
          h('div', {}, renderIcon('users'), ` Yêu cầu: ${game.min_players}–${game.max_players} người`),
          h('div', {}, renderIcon('clock'), ` Thời lượng: ${game.duration_minutes} phút`),
          h('div', {}, renderIcon('shield'), this.room.dm_assignment ? ` DM: ${this.room.dm_assignment.dm_name}` : ' Đang chờ phân công DM'),
          this.room.physical_room
            ? h('div', {}, renderIcon('sparkles'), ` Phòng quán: ${this.room.physical_room.name}`)
            : null
        )
      );
      container.appendChild(header);

      // 3. Room Stepper
      container.appendChild(renderRoomStepper(this.room.status));

      // 4. Schedule Proposal Banner (If Active)
      if (this.room.schedule_proposal && this.room.schedule_proposal.status === 'PROPOSED') {
        container.appendChild(this.renderScheduleProposalCard(this.room.schedule_proposal));
      }

      // 5. Main 2-Column Showcase (Round Table vs Actions & Pricing)
      const mainGrid = h('div', { className: 'room-main-showcase-grid' },
        // Left Column: SVG Round Table
        h('div', { className: 'showcase-left-col card-dark text-center' },
          h('h3', { className: 'card-title' }, 'Bàn Tròn Người Chơi'),
          renderParticipantRing({
            participants: this.room.participants,
            minPlayers: game.min_players,
            maxPlayers: game.max_players,
            currentUserId: user?.id,
            size: 330,
          }),
          // Participants List Details
          h('div', { className: 'participants-list-detail mt-3' },
            h('h4', { className: 'detail-sub-title text-muted' }, 'Danh sách thành viên ghế ngồi:'),
            h('div', { className: 'participants-rows' },
              ...this.room.participants.map((p) => {
                const isMe = p.user_id === user?.id;
                return h('div', { className: `participant-row-item ${isMe ? 'item-me' : ''}` },
                  h('div', { className: 'part-name-block' },
                    h('strong', {}, p.name),
                    isMe ? h('span', { className: 'badge-me' }, 'Bạn') : null
                  ),
                  renderStatusBadge(p.status),
                  p.deposit_deadline && p.status === PARTICIPANT_STATUS.PENDING_DEPOSIT
                    ? renderCountdown(p.deposit_deadline, { label: 'Hạn cọc', showIcon: false })
                    : null
                );
              })
            )
          )
        ),

        // Right Column: Action Panel & Price Breakdown
        h('div', { className: 'showcase-right-col' },
          // Actions Card
          h('div', { className: 'actions-card card-dark p-3 mb-3' },
            h('h3', { className: 'card-title mb-2' }, 'Thao Tác Của Bạn'),
            this.renderActionButtons(myPart, isCreator, game)
          ),

          // Price Breakdown (Per-Person & Room)
          renderPriceBreakdown(this.quoteSnapshot, { showPerPersonOnly: true, title: 'Chiết tính phần vé của bạn' }),

          // Refund Policy Info Note
          h('div', { className: 'refund-policy-box card-dark p-3 mt-3' },
            h('h4', { className: 'policy-title highlight-gold' }, renderIcon('shield'), ' Chính Sách Hoàn Cọc (V16 Freeze)'),
            h('p', { className: 'text-muted', style: { fontSize: '0.85rem' } },
              'Theo quy định: Người chơi chỉ đủ điều kiện xét hoàn cọc 50.000 VNĐ khi gửi yêu cầu hủy trước giờ bắt đầu ít nhất 24 giờ. Quyết định hoàn cọc do Ban Quản Trị xem xét và xử lý.'
            )
          )
        )
      );
      container.appendChild(mainGrid);

      this.mountPoint.appendChild(container);
    } catch (err) {
      container.appendChild(
        h('div', { className: 'error-state text-center' },
          h('p', { className: 'text-danger' }, err.message),
          h('a', { className: 'btn btn-secondary', href: '#/player/dashboard' }, 'Về danh sách phòng')
        )
      );
      this.mountPoint.appendChild(container);
    }
  }

  // --- Schedule Proposal Banner ---
  renderScheduleProposalCard(proposal) {
    const user = auth.getUser();
    const myVote = proposal.votes[user?.id];

    return h('div', { className: 'schedule-proposal-card card-dark' },
      h('div', { className: 'proposal-header flex-between' },
        h('div', {},
          h('span', { className: 'badge-proposal' }, 'ĐỀ XUẤT ĐỔI LỊCH MỚI'),
          h('h3', { className: 'proposal-title' }, `Dời lịch sang: ${formatDateTime(proposal.proposed_time)}`)
        ),
        renderCountdown(proposal.deadline, { label: 'Hạn biểu quyết (2h)' })
      ),
      h('p', { className: 'text-muted' },
        'Quy định: Cần 100% thành viên đang active đồng ý để chốt lịch mới. Nếu có 1 người từ chối hoặc hết thời hạn 2 giờ, đề xuất sẽ bị bác bỏ và giữ nguyên lịch cũ.'
      ),
      h('div', { className: 'proposal-actions mt-3' },
        myVote
          ? h('div', { className: 'text-emerald' }, `✓ Bạn đã bỏ phiếu: ${myVote === 'ACCEPTED' ? 'ĐỒNG Ý' : 'TỪ CHỐI'}`)
          : h('div', { className: 'vote-btns' },
              h('button', {
                className: 'btn btn-primary mr-2',
                onclick: () => this.handleVoteProposal('ACCEPTED'),
              }, 'Đồng ý dời lịch'),
              h('button', {
                className: 'btn btn-secondary',
                onclick: () => this.handleVoteProposal('REJECTED'),
              }, 'Từ chối (Giữ lịch cũ)')
            )
      )
    );
  }

  // --- Dynamic Action Buttons ---
  renderActionButtons(myPart, isCreator, game) {
    const box = h('div', { className: 'action-buttons-group' });
    const user = auth.getUser();
    const room = this.room;

    // Case 1: Chưa tham gia phòng
    if (!myPart) {
      box.appendChild(
        h('button', {
          className: 'btn btn-primary btn-block btn-lg',
          onclick: () => this.handleJoin(),
        }, renderIcon('plus'), ' Tham Gia Ghế Trống Này')
      );
      return box;
    }

    // Case 2: Đang PENDING_DEPOSIT
    if (myPart.status === PARTICIPANT_STATUS.PENDING_DEPOSIT) {
      if (room.status === GAMEROOM_STATUS.WAITING_FOR_DEPOSIT) {
        box.appendChild(
          h('button', {
            className: 'btn btn-primary btn-block btn-lg mb-2',
            onclick: () => this.openDepositModal(),
          }, renderIcon('creditCard'), ' Đặt Cọc 50.000 VNĐ Giữ Ghế')
        );
      } else {
        box.appendChild(
          h('div', { className: 'status-hint-text text-muted mb-2' },
            'Ghế của bạn đã giữ chỗ. Đang chờ Quản trị viên phân công Quản trò và mở thời hạn cọc.'
          )
        );
      }

      // Rời phòng trước khi cọc (không mất cọc)
      box.appendChild(
        h('button', {
          className: 'btn btn-secondary btn-block',
          onclick: () => this.handleLeaveBeforeDeposit(),
        }, 'Rời phòng (Hủy giữ ghế)')
      );
      return box;
    }

    // Case 3: Đã cọc (DEPOSITED)
    if (myPart.status === PARTICIPANT_STATUS.DEPOSITED) {
      box.appendChild(
        h('div', { className: 'deposit-success-badge text-emerald mb-2' },
          renderIcon('check'), ' Bạn đã hoàn tất cọc 50.000 VNĐ giữ ghế an toàn.'
        )
      );

      // Xin rời phòng sau cọc (Reason Dialog + xét hoàn cọc 24h)
      box.appendChild(
        h('button', {
          className: 'btn btn-secondary btn-block text-danger mb-2',
          onclick: () => this.handleRequestLeaveAfterDeposit(),
        }, 'Gửi yêu cầu xin rời phòng (Xét hoàn cọc)')
      );

      // Thanh toán khoản còn lại (Mock)
      box.appendChild(
        h('button', {
          className: 'btn btn-secondary btn-block',
          onclick: () => showToast('Bạn có thể thanh toán khoản còn lại trực tiếp tại quầy quán khi đến chơi.', 'info'),
        }, 'Thanh toán phần còn lại tại quán')
      );
      return box;
    }

    // Case 4: Đã gửi yêu cầu rời phòng
    if (myPart.status === PARTICIPANT_STATUS.LEAVE_REQUESTED) {
      box.appendChild(
        h('div', { className: 'alert-box text-amber' },
          'Bạn đã gửi yêu cầu rời phòng. Ban Quản Trị đang xem xét lý do và đối chiếu mốc 24h để quyết định hoàn cọc.'
        )
      );
      return box;
    }

    return box;
  }

  // --- Action Handlers ---
  async handleJoin() {
    try {
      await apiService.joinRoom(this.room.id);
      showToast('Tham gia phòng thành công!', 'success');
      this.render();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  handleLeaveBeforeDeposit() {
    showToast('Đã rời khỏi phòng chơi.', 'info');
    this.router.navigate('/player/dashboard');
  }

  handleRequestLeaveAfterDeposit() {
    showReasonDialog({
      title: 'Yêu cầu xin rời phòng & hoàn cọc',
      actionKey: 'PLAYER_REQUEST_LEAVE',
      placeholder: 'Vui lòng cung cấp lý do bạn cần hủy tham gia phiên chơi...',
      confirmLabel: 'Gửi yêu cầu tới Admin',
      onSubmit: (reason) => {
        showToast('Đã gửi yêu cầu xin rời phòng tới Quản trị viên.', 'success');
        this.render();
      },
    });
  }

  handleVoteProposal(vote) {
    showToast(`Đã ghi nhận phiếu ${vote === 'ACCEPTED' ? 'ĐỒNG Ý' : 'TỪ CHỐI'} dời lịch.`, 'success');
    this.render();
  }

  handleShareRoom() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Đã sao chép liên kết phòng vào bộ nhớ tạm!', 'success');
    } else {
      showToast(`Link phòng: ${window.location.href}`, 'info');
    }
  }

  handleDeadlineExpired() {
    showToast('Thời hạn gom người của phòng đã kết thúc.', 'error');
    this.render();
  }

  handleDepositDeadlineExpired() {
    showToast('Thời hạn đặt cọc của bạn đã hết hạn. Ghế đã bị hủy.', 'error');
    this.render();
  }

  // --- Mock Deposit Modal ---
  openDepositModal() {
    let depositModalInstance = null;
    let isSubmitting = false;
    const idempotencyKey = getIdempotencyKey(`deposit_${this.room.id}_${auth.getUser()?.id}`);

    const modalBody = h('div', { className: 'deposit-modal-content' },
      h('div', { className: 'deposit-voucher-preview' },
        h('div', { className: 'voucher-watermark' }, 'MÔ PHỎNG'),
        h('h4', { className: 'voucher-title' }, 'PHIẾU ĐẶT CỌC GIỮ GHẾ'),
        h('p', { className: 'voucher-room text-muted' }, `Phòng: ${this.room.code} • Kịch bản: ${this.room.game_details.title}`),
        h('div', { className: 'voucher-amount-box' },
          h('span', { className: 'voucher-label' }, 'Số tiền cọc quy định:'),
          h('span', { className: 'voucher-amount highlight-gold' }, '50.000 VNĐ')
        ),
        h('p', { className: 'voucher-policy text-muted', style: { fontSize: '0.8rem' } },
          'Tiền cọc cố định, không tính theo phần trăm và được trừ trực tiếp vào tổng bill khi đến quán chơi.'
        )
      ),

      h('div', { className: 'modal-footer-actions mt-3 flex-between' },
        h('button', {
          className: 'btn btn-secondary',
          onclick: () => depositModalInstance.close(),
        }, 'Đóng'),
        h('button', {
          id: 'btn-confirm-deposit',
          className: 'btn btn-primary btn-lg',
          onclick: async () => {
            if (isSubmitting) return; // Prevent double-submit
            isSubmitting = true;
            const btn = document.getElementById('btn-confirm-deposit');
            if (btn) { btn.disabled = true; btn.textContent = 'Đang xử lý cọc...'; }

            try {
              await apiService.makeDeposit(this.room.id, idempotencyKey);
              showToast('Hoàn tất đặt cọc 50.000 VNĐ mô phỏng thành công!', 'success');
              depositModalInstance.close();
              this.render();
            } catch (err) {
              showToast(`Đặt cọc thất bại: ${err.message}`, 'error');
              if (btn) { btn.disabled = false; btn.textContent = 'Xác nhận cọc 50.000 VNĐ'; }
              isSubmitting = false;
            }
          },
        }, 'Xác nhận cọc 50.000 VNĐ (Mô phỏng)')
      )
    );

    depositModalInstance = new Modal({
      title: 'Thanh Toán Đặt Cọc Giữ Chỗ (Mô Phỏng)',
      contentEl: modalBody,
      className: 'modal-deposit-simulate',
    });

    depositModalInstance.open();
  }
}

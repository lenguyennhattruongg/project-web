/**
 * Create Room Wizard (#/player/create-room)
 * 4-Step Wizard: Select Game -> Select Date -> Select Valid Time Slot (:00/:30) -> Review Quote & Confirm.
 */
import { h, renderIcon } from '../../utils/dom.js';
import { apiService } from '../../api/api-service.js';
import { auth } from '../../utils/auth.js';
import { renderPriceBreakdown } from '../../components/price-breakdown.js';
import { isValidSlotTime } from '../../utils/rules.js';
import { showToast } from '../../components/toast.js';

export class CreateRoomWizard {
  constructor(mountPoint, { query, router }) {
    this.mountPoint = mountPoint;
    this.router = router;
    this.preselectedGameId = query.game_id || null;
    this.currentStep = 1;

    this.selectedGame = null;
    this.selectedDate = ''; // 'YYYY-MM-DD'
    this.selectedTime = '19:30'; // Default :00 or :30
    this.quoteSnapshot = null;
    this.games = [];
  }

  async render() {
    this.mountPoint.innerHTML = '';
    const container = h('div', { className: 'page-create-wizard container' });

    // Header
    const header = h('div', { className: 'wizard-header text-center' },
      h('h1', { className: 'wizard-title' }, 'Mở Phòng Chơi Kịch Bản Mới'),
      h('p', { className: 'wizard-subtitle text-muted' },
        'Bước qua 4 bước đơn giản để khởi tạo phòng chơi và tuyển mộ thành viên cùng phá án.'
      )
    );
    container.appendChild(header);

    // Wizard Progress Nav
    this.progressNav = h('div', { className: 'wizard-progress-bar' });
    this.renderProgressBar();
    container.appendChild(this.progressNav);

    // Step Container
    this.stepContainer = h('div', { className: 'wizard-step-container card-dark mt-4' });
    container.appendChild(this.stepContainer);

    this.mountPoint.appendChild(container);

    await this.loadInitialGames();
    this.renderCurrentStep();
  }

  renderProgressBar() {
    this.progressNav.innerHTML = '';
    const steps = [
      { num: 1, title: 'Chọn kịch bản' },
      { num: 2, title: 'Chọn ngày chơi' },
      { num: 3, title: 'Chọn khung giờ' },
      { num: 4, title: 'Xem trước báo giá & Mở phòng' },
    ];

    const list = h('div', { className: 'wizard-nav-list' });
    steps.forEach((s) => {
      const isCurrent = s.num === this.currentStep;
      const isDone = s.num < this.currentStep;
      list.appendChild(
        h('div', { className: `wizard-nav-item ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}` },
          h('span', { className: 'wizard-step-circle' }, isDone ? '✓' : String(s.num)),
          h('span', { className: 'wizard-step-name' }, s.title)
        )
      );
    });
    this.progressNav.appendChild(list);
  }

  async loadInitialGames() {
    const res = await apiService.getGames();
    this.games = res.data;
    if (this.preselectedGameId) {
      this.selectedGame = this.games.find((g) => g.id === this.preselectedGameId) || null;
      if (this.selectedGame) {
        this.currentStep = 2; // Jump to step 2 if game already picked
      }
    }
  }

  renderCurrentStep() {
    this.renderProgressBar();
    this.stepContainer.innerHTML = '';

    if (this.currentStep === 1) {
      this.renderStep1SelectGame();
    } else if (this.currentStep === 2) {
      this.renderStep2SelectDate();
    } else if (this.currentStep === 3) {
      this.renderStep3SelectTime();
    } else if (this.currentStep === 4) {
      this.renderStep4ReviewQuote();
    }
  }

  // --- Step 1: Select Game ---
  renderStep1SelectGame() {
    const box = h('div', { className: 'wizard-step-step1' },
      h('h3', { className: 'step-heading' }, 'Bước 1: Chọn Kịch Bản Jubensha'),
      h('p', { className: 'text-muted mb-3' }, 'Chọn một kịch bản trong danh mục 42 trò chơi để mở phòng:'),
      h('div', { className: 'game-select-grid' },
        ...this.games.slice(0, 12).map((game) => {
          const isSelected = this.selectedGame?.id === game.id;
          return h('div', {
            className: `game-pick-card ${isSelected ? 'selected' : ''}`,
            onclick: () => {
              this.selectedGame = game;
              this.currentStep = 2;
              this.renderCurrentStep();
            },
          },
            h('div', { className: 'game-pick-header' },
              h('span', { className: 'pick-genre' }, game.genre),
              game.is_age_restricted ? h('span', { className: 'game-18-badge' }, '18+') : null
            ),
            h('h4', { className: 'pick-title' }, game.title),
            h('p', { className: 'text-muted', style: { fontSize: '0.85rem' } }, `${game.min_players}–${game.max_players} người • ${game.duration_minutes} phút`)
          );
        })
      )
    );
    this.stepContainer.appendChild(box);
  }

  // --- Step 2: Select Date ---
  renderStep2SelectDate() {
    const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tối thiểu ngày mai
    if (!this.selectedDate) this.selectedDate = minDate;

    const box = h('div', { className: 'wizard-step-step2' },
      h('h3', { className: 'step-heading' }, 'Bước 2: Chọn Ngày Tổ Chức Phiên Chơi'),
      h('p', { className: 'text-muted mb-3' },
        `Kịch bản đã chọn: `, h('strong', { className: 'highlight-gold' }, this.selectedGame.title)
      ),
      h('div', { className: 'form-group', style: { maxWidth: '340px' } },
        h('label', { className: 'form-label' }, 'Ngày bắt đầu phiên chơi:'),
        h('input', {
          type: 'date',
          className: 'form-control',
          min: minDate,
          value: this.selectedDate,
          onchange: (e) => {
            this.selectedDate = e.target.value;
          },
        })
      ),
      h('div', { className: 'wizard-tip-box' },
        renderIcon('info'),
        h('span', {}, 'Mẹo: Đặt lịch trước ít nhất 1 ngày và chơi vào Thứ Ba (09:00–19:00) để nhận ưu đãi giảm 30% giá vé!')
      ),
      h('div', { className: 'wizard-actions mt-4 flex-between' },
        h('button', {
          className: 'btn btn-secondary',
          onclick: () => { this.currentStep = 1; this.renderCurrentStep(); },
        }, '← Chọn lại game'),
        h('button', {
          className: 'btn btn-primary',
          onclick: () => {
            if (!this.selectedDate) {
              showToast('Vui lòng chọn ngày chơi.', 'error');
              return;
            }
            this.currentStep = 3;
            this.renderCurrentStep();
          },
        }, 'Tiếp tục: Chọn giờ →')
      )
    );
    this.stepContainer.appendChild(box);
  }

  // --- Step 3: Select Time Slot (Only :00 or :30) ---
  renderStep3SelectTime() {
    // Generate valid slots from 09:00 to 22:30 (Only :00 and :30)
    const validSlots = [];
    for (let h = 9; h <= 22; h++) {
      const hh = String(h).padStart(2, '0');
      validSlots.push(`${hh}:00`);
      if (h < 22) validSlots.push(`${hh}:30`);
    }

    const box = h('div', { className: 'wizard-step-step3' },
      h('h3', { className: 'step-heading' }, 'Bước 3: Chọn Giờ Bắt Đầu (Đúng phút :00 hoặc :30)'),
      h('p', { className: 'text-muted mb-3' },
        'Hệ thống không có suất giờ cố định. Bạn có thể tự do chọn giờ bắt đầu linh hoạt, máy chủ sẽ kiểm tra phòng vật lý và Quản trò.'
      ),
      h('div', { className: 'slots-buttons-grid' },
        ...validSlots.map((slot) => {
          const isSelected = this.selectedTime === slot;
          const isNight = parseInt(slot.split(':')[0], 10) >= 20;
          return h('button', {
            type: 'button',
            className: `btn-slot-choice ${isSelected ? 'selected' : ''} ${isNight ? 'slot-night' : ''}`,
            onclick: () => {
              this.selectedTime = slot;
              this.renderStep3SelectTime(); // Re-render to update selected highlight
            },
          },
            h('span', { className: 'slot-time-text' }, slot),
            h('span', { className: 'slot-tier-tag text-muted' }, isNight ? 'Khung tối' : 'Khung ngày')
          );
        })
      ),
      h('div', { className: 'wizard-actions mt-4 flex-between' },
        h('button', {
          className: 'btn btn-secondary',
          onclick: () => { this.currentStep = 2; this.renderCurrentStep(); },
        }, '← Chọn lại ngày'),
        h('button', {
          className: 'btn btn-primary',
          onclick: async () => {
            if (!isValidSlotTime(this.selectedTime)) {
              showToast('Giờ bắt đầu bắt buộc phải đúng phút :00 hoặc :30.', 'error');
              return;
            }
            await this.calculateQuoteAndProceed();
          },
        }, 'Tiếp tục: Xem báo giá →')
      )
    );
    this.stepContainer.appendChild(box);
  }

  async calculateQuoteAndProceed() {
    try {
      const sessionStart = `${this.selectedDate}T${this.selectedTime}:00`;
      const res = await apiService.getQuote({
        game_id: this.selectedGame.id,
        session_start_time: sessionStart,
        player_count: this.selectedGame.min_players,
      });
      this.quoteSnapshot = res.data;
      this.currentStep = 4;
      this.renderCurrentStep();
    } catch (err) {
      showToast(`Không thể tính báo giá: ${err.message}`, 'error');
    }
  }

  // --- Step 4: Review Quote & Confirm ---
  renderStep4ReviewQuote() {
    const sessionStart = `${this.selectedDate}T${this.selectedTime}:00`;

    const box = h('div', { className: 'wizard-step-step4' },
      h('h3', { className: 'step-heading' }, 'Bước 4: Xem Lại & Xác Nhận Mở Phòng'),
      h('div', { className: 'review-summary-box card-dark p-3 mb-3' },
        h('h4', { className: 'highlight-gold mb-2' }, this.selectedGame.title),
        h('div', { className: 'review-meta-grid text-muted' },
          h('div', {}, '📅 Ngày giờ: ', h('strong', { className: 'text-light' }, `${this.selectedDate} lúc ${this.selectedTime}`)),
          h('div', {}, '👥 Số người dự kiến: ', h('strong', { className: 'text-light' }, `${this.selectedGame.min_players} người`)),
          h('div', {}, '⏳ Hạn gom người: ', h('strong', { className: 'text-light' }, '4 giờ kể từ lúc mở phòng')),
          h('div', {}, '💰 Cọc giữ ghế: ', h('strong', { className: 'text-amber' }, '50.000 VNĐ / người (Cố định)'))
        )
      ),

      // Price Breakdown Card
      renderPriceBreakdown(this.quoteSnapshot, { title: 'Bảng Chiết Tính Chi Phí Phiên Chơi' }),

      h('div', { className: 'wizard-actions mt-4 flex-between' },
        h('button', {
          className: 'btn btn-secondary',
          onclick: () => { this.currentStep = 3; this.renderCurrentStep(); },
        }, '← Chọn lại giờ'),
        h('button', {
          className: 'btn btn-primary btn-lg',
          onclick: () => this.handleConfirmCreateRoom(sessionStart),
        }, renderIcon('check'), ' Xác Nhận Mở Phòng Ngay')
      )
    );
    this.stepContainer.appendChild(box);
  }

  async handleConfirmCreateRoom(sessionStartTime) {
    try {
      const res = await apiService.createRoom({
        game_id: this.selectedGame.id,
        session_start_time: sessionStartTime,
      });

      const newRoom = res.data;
      showToast(`Mở phòng ${newRoom.code} thành công!`, 'success');
      // Chuyển thẳng vào chi tiết phòng của Player
      this.router.navigate(`/player/rooms/${newRoom.id}`);
    } catch (err) {
      showToast(`Mở phòng thất bại: ${err.message}`, 'error');
    }
  }
}

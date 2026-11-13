/* ═══════════════════════════════════════════════════════════════════
   ONIX ARCHITECTURE STUDIO — DONATION PAGE LOGIC (MATCHING REFERENCE)
   Features:
   - Dynamic Settings fetch from /api/settings (CMS synced)
   - Preset vs Custom Amount selection & real-time numeric validation
   - Payment method toggle (Card, MTN MoMo, Bank)
   - Real backend integration: calls POST /api/donations/create
   - Polling / verification status with GET /api/donations/verify/:ref
   - Safe sandbox testing mode for development verification
   - Responsive navbar menu toggle
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let selectedAmount = 5000;
  let selectedMethod = 'card';
  let currency = 'RWF';
  let activeDonationRef = null;
  let pollInterval = null;

  document.addEventListener('DOMContentLoaded', () => {
    initCMSContent();
    initPresetsAndAmounts();
    initPaymentMethods();
    initDonationSubmission();
    initModalControls();
    // page.js handles nav toggle & theme, fallback only if needed
    if (!window.__onixPageLoaded) {
      initNavToggle();
    }
  });

  // ─── 1. Load Admin CMS Settings ──────────────────────────────
  async function initCMSContent() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const s = await res.json();

      // Logo
      if (s.logo_path) {
        const logoImg = document.getElementById('nav-logo-img');
        const logoText = document.getElementById('logo-text');
        if (logoImg) {
          logoImg.src = s.logo_path.startsWith('http') ? s.logo_path : `/${s.logo_path}`;
          logoImg.style.display = 'block';
        }
        if (logoText) {
          logoText.style.display = 'none';
        }
      }

      // Hero Images
      if (s.donation_hero_img) {
        const heroImg = document.getElementById('donate-hero-img');
        if (heroImg) heroImg.src = s.donation_hero_img;
      }

      if (s.donation_secondary_img) {
        const secImg = document.getElementById('donate-secondary-img');
        if (secImg) secImg.src = s.donation_secondary_img;
      }

      // Text Headlines
      if (s.donation_eyebrow) {
        const el = document.getElementById('donate-eyebrow');
        if (el) el.textContent = s.donation_eyebrow;
      }
      if (s.donation_main_heading) {
        const el = document.getElementById('donate-main-heading');
        if (el) el.innerHTML = s.donation_main_heading.replace(/\n/g, '<br />');
      }
      if (s.donation_main_desc) {
        const el = document.getElementById('donate-main-desc');
        if (el) el.textContent = s.donation_main_desc;
      }

      // 4 Impact pillars from CMS if set
      for (let i = 1; i <= 4; i++) {
        if (s[`donation_impact_title_${i}`]) {
          const el = document.getElementById(`impact-title-${i}`);
          if (el) el.textContent = s[`donation_impact_title_${i}`];
        }
        if (s[`donation_impact_desc_${i}`]) {
          const el = document.getElementById(`impact-desc-${i}`);
          if (el) el.textContent = s[`donation_impact_desc_${i}`];
        }
      }

      // Secondary Mission CMS fields
      if (s.donation_sec_tag) {
        const el = document.getElementById('donate-sec-tag');
        if (el) el.textContent = s.donation_sec_tag;
      }
      if (s.donation_sec_heading) {
        const el = document.getElementById('donate-sec-heading');
        if (el) el.innerHTML = s.donation_sec_heading.replace(/\n/g, '<br />');
      }
      if (s.donation_sec_desc) {
        const el = document.getElementById('donate-sec-desc');
        if (el) el.textContent = s.donation_sec_desc;
      }
      if (s.donation_sec_link_url) {
        const el = document.getElementById('donate-sec-link');
        if (el) el.href = s.donation_sec_link_url;
      }

      // Contact info
      if (s.donation_support_email) {
        const el = document.getElementById('donate-support-email');
        if (el) {
          el.textContent = s.donation_support_email;
          el.href = `mailto:${s.donation_support_email}`;
        }
      }
      if (s.donation_support_phone) {
        const el = document.getElementById('donate-support-phone');
        if (el) {
          el.textContent = s.donation_support_phone;
          el.href = `tel:${s.donation_support_phone.replace(/\s+/g, '')}`;
        }
      }

      // Currency (defaults to RWF)
      if (s.donation_currency) {
        currency = s.donation_currency.toUpperCase();
      }
      const sym = (currency === 'RWF' || currency === 'RF') ? 'RWF' : (currency === 'EUR' ? '€' : '$');
      const symEl = document.querySelector('.donate-custom-symbol');
      if (symEl) symEl.textContent = sym;

      // Footer text
      if (s.footer_text) {
        const copy = document.getElementById('donate-footer-copy');
        if (copy) copy.textContent = s.footer_text;
      }
    } catch (e) {
      console.warn('CMS settings fetch failed:', e);
    }
  }

  function formatAmount(amt) {
    if (!amt) return '0';
    return Number(amt).toLocaleString('en-US');
  }

  // ─── 2. Preset & Custom Amount Controls ──────────────────────
  function initPresetsAndAmounts() {
    const presetBtns = document.querySelectorAll('.donate-preset-btn');
    const customInput = document.getElementById('donate-custom-amount');
    const submitBtnText = document.getElementById('donate-btn-text');

    function updateSubmitText() {
      if (submitBtnText) {
        submitBtnText.textContent = selectedAmount
          ? `Donate ${formatAmount(selectedAmount)} ${currency}`
          : 'Donate Now';
      }
    }

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAmount = parseFloat(btn.dataset.amount);
        if (customInput) customInput.value = '';
        updateSubmitText();
      });
    });

    if (customInput) {
      customInput.addEventListener('input', () => {
        const val = parseFloat(customInput.value);
        if (!isNaN(val) && val > 0) {
          presetBtns.forEach(b => b.classList.remove('selected'));
          selectedAmount = val;
        } else {
          selectedAmount = 0;
        }
        updateSubmitText();
      });
    }

    updateSubmitText();
  }

  // ─── 3. Payment Method Selection ─────────────────────────────
  function initPaymentMethods() {
    const methodCards = document.querySelectorAll('.donate-method-card');
    const groupMomo = document.getElementById('group-momo-phone');
    const groupBank = document.getElementById('group-bank-info');
    const phoneInput = document.getElementById('donor-phone');

    methodCards.forEach(card => {
      card.addEventListener('click', () => {
        methodCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedMethod = card.dataset.method;

        if (groupMomo) groupMomo.style.display = (selectedMethod === 'momo') ? 'block' : 'none';
        if (groupBank) groupBank.style.display = (selectedMethod === 'bank') ? 'block' : 'none';
        if (phoneInput && selectedMethod === 'momo') phoneInput.focus();
      });
    });
  }

  // ─── 4. Connect Donation Form to Real Backend ────────────────
  function initDonationSubmission() {
    const form = document.getElementById('active-donation-form');
    const submitBtn = document.getElementById('btn-donate-submit');
    const feedback = document.getElementById('donate-feedback-msg');

    if (!form || !submitBtn) return;

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      if (feedback) {
        feedback.style.display = 'none';
        feedback.className = 'donate-feedback-msg';
      }

      // Amount Validation
      if (!selectedAmount || selectedAmount <= 0) {
        showFeedback('Please select or enter a valid donation amount greater than 0.', 'error');
        return;
      }

      // Fields
      const donorName = document.getElementById('donor-name')?.value?.trim() || '';
      const donorEmail = document.getElementById('donor-email')?.value?.trim() || '';
      const donorPhone = document.getElementById('donor-phone')?.value?.trim() || '';

      // Momo Phone Validation
      if (selectedMethod === 'momo') {
        if (!donorPhone || donorPhone.length < 8) {
          showFeedback('Please enter a valid MTN Mobile Money phone number (e.g., +250 788 123 456).', 'error');
          return;
        }
      }

      // Set Loading State
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 50 50" style="animation:donateSpin 1s linear infinite;">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80" stroke-dashoffset="60"></circle>
        </svg>
        <span>Initiating ${selectedMethod === 'momo' ? 'MTN MoMo' : 'Donation'}...</span>
      `;

      try {
        const payload = {
          amount: selectedAmount,
          currency: currency,
          payment_method: selectedMethod,
          donor_name: donorName,
          donor_email: donorEmail,
          donor_phone: donorPhone
        };

        const res = await fetch('/api/donations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Server rejected the donation request.');
        }

        activeDonationRef = data.reference;

        // Open Confirmation Dialog
        openDonationModal(data);

        // If MoMo or pending, start transaction status polling
        startTransactionPolling(data.reference);

      } catch (err) {
        showFeedback(`Error: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    function showFeedback(msg, type) {
      if (!feedback) return;
      feedback.textContent = msg;
      feedback.className = `donate-feedback-msg ${type}`;
      feedback.style.display = 'block';
    }
  }

  // ─── 5. Transaction Status Polling & Verification ────────────
  function startTransactionPolling(reference) {
    if (pollInterval) clearInterval(pollInterval);

    let attempts = 0;
    pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > 30) { // stop after 2.5 minutes
        clearInterval(pollInterval);
        return;
      }

      try {
        const res = await fetch(`/api/donations/verify/${reference}`);
        if (!res.ok) return;
        const result = await res.json();
        if (result.success && result.donation?.payment_status === 'successful') {
          clearInterval(pollInterval);
          updateModalSuccess(result.donation);
        }
      } catch (e) {
        console.warn('Polling status error:', e);
      }
    }, 5000);
  }

  // ─── 6. Confirmation Modal Controls ──────────────────────────
  function openDonationModal(data) {
    const modal = document.getElementById('donate-modal');
    const heading = document.getElementById('donate-modal-heading');
    const refPill = document.getElementById('donate-modal-ref');
    const msg = document.getElementById('donate-modal-body');
    const sandboxBtn = document.getElementById('donate-modal-sandbox-btn');

    if (!modal) return;

    if (refPill) refPill.textContent = `REFERENCE: ${data.reference}`;

    if (data.payment_method === 'momo') {
      if (heading) heading.textContent = 'MTN MoMo Approval Sent';
      if (msg) {
        msg.innerHTML = `We have sent an instant USSD prompt to <strong>${data.donor_phone || 'your phone'}</strong>.<br/><br/>
        Please check your mobile screen and approve the payment of <strong>${data.currency} ${data.amount}</strong> to complete your gift.`;
      }
    } else if (data.payment_method === 'bank') {
      if (heading) heading.textContent = 'Bank Transfer Details';
      if (msg) {
        msg.innerHTML = `Please transfer <strong>${data.currency} ${data.amount}</strong> using the reference <strong>${data.reference}</strong>.<br/><br/>${data.instructions}`;
      }
    } else {
      if (heading) heading.textContent = 'Card Payment Processing';
      if (msg) {
        msg.innerHTML = `Your donation of <strong>${data.currency} ${data.amount}</strong> is being processed securely.`;
      }
    }

    // If in sandbox mode, provide simulator button
    if (data.isSandbox && sandboxBtn) {
      sandboxBtn.style.display = 'inline-block';
      sandboxBtn.onclick = async () => {
        sandboxBtn.disabled = true;
        sandboxBtn.textContent = 'Verifying...';
        await fetch(`/api/donations/confirm-sandbox/${data.reference}`, { method: 'POST' });
        updateModalSuccess(data);
      };
    } else if (sandboxBtn) {
      sandboxBtn.style.display = 'none';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function updateModalSuccess(donation) {
    const heading = document.getElementById('donate-modal-heading');
    const msg = document.getElementById('donate-modal-body');
    const sandboxBtn = document.getElementById('donate-modal-sandbox-btn');

    if (heading) heading.textContent = '✓ Donation Confirmed!';
    if (msg) {
      msg.innerHTML = `Heartfelt thank you for your generous gift of <strong>${donation.currency || currency} ${donation.amount}</strong>!<br/><br/>
      Your contribution directly empowers sustainable architectural research, community shelter, and ecological innovation.`;
    }
    if (sandboxBtn) sandboxBtn.style.display = 'none';
  }

  function initModalControls() {
    const modal = document.getElementById('donate-modal');
    const closeBtn = document.getElementById('donate-modal-close-btn');
    const doneBtn = document.getElementById('donate-modal-done-btn');

    const hide = () => {
      if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
      if (pollInterval) clearInterval(pollInterval);
    };

    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (doneBtn) doneBtn.addEventListener('click', hide);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hide();
      });
    }
  }

  // ─── 7. Mobile Nav Toggle ────────────────────────────────────
  function initNavToggle() {
    const navToggle = document.getElementById('nav-toggle');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    if (!navToggle || !fullscreenMenu) return;

    navToggle.addEventListener('click', () => {
      const isOpen = fullscreenMenu.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

})();

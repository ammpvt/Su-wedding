// ==========================================================================
// Application Configuration & State
// ==========================================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwe2TJjGCDDbPo3ta1YZXqSA3DmdznR5i-NUuxHM-wEBQlNtNfq_XuMgkLR_9kKsNxd/exec';
const TARGET_CAPACITY = 3200;

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const syncStatusIndicator = document.getElementById('sync-status');
const syncStatusText = document.getElementById('sync-status-text');

// Form Elements
const guestForm = document.getElementById('guest-form');
const nameInput = document.getElementById('guest-name');
const categoryInput = document.getElementById('guest-category');
const headcountInput = document.getElementById('guest-headcount');
const eventInput = document.getElementById('guest-event');
const invitationInput = document.getElementById('guest-invitation');
const probabilityInput = document.getElementById('guest-probability');
const dietaryInput = document.getElementById('guest-dietary');
const vipInput = document.getElementById('guest-vip');
const contactInput = document.getElementById('guest-contact');
const remarksInput = document.getElementById('guest-remarks');
const submitBtn = document.getElementById('submit-btn');

// Stepper Buttons
const btnMinus = document.getElementById('btn-headcount-minus');
const btnPlus = document.getElementById('btn-headcount-plus');

// Dashboard Elements
const cardElements = {
  invitations: document.getElementById('card-invitations'),
  saturday: document.getElementById('card-saturday'),
  sunday: document.getElementById('card-sunday'),
  vips: document.getElementById('card-vips')
};

const dashboardStats = {
  sent: document.getElementById('stat-sent'),
  saturday: document.getElementById('stat-saturday'),
  sunday: document.getElementById('stat-sunday'),
  vips: document.getElementById('stat-vips'),
  progressFill: document.getElementById('stat-progress-fill'),
  percentBadge: document.getElementById('stat-percentage-badge'),
  sentDetail: document.getElementById('detail-sent-count'),
  pendingDetail: document.getElementById('detail-pending-count')
};

// ==========================================================================
// Theme Management
// ==========================================================================

function initTheme() {
  const cachedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(cachedTheme);
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    document.getElementById('theme-color-meta').setAttribute('content', '#0A0A0A');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    document.getElementById('theme-color-meta').setAttribute('content', '#FAF8F5');
  }
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Micro-animation scale effect
  themeToggleBtn.style.transform = 'scale(0.8) rotate(45deg)';
  setTimeout(() => {
    setTheme(newTheme);
    themeToggleBtn.style.transform = '';
  }, 150);
});

// ==========================================================================
// Ticker / Count Up Animation
// ==========================================================================

function animateValue(element, start, end, duration = 800) {
  if (!element) return;
  
  // Cancel previous animation on this element if any
  if (element.animationFrameId) {
    cancelAnimationFrame(element.animationFrameId);
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(easeProgress * (end - start) + start);
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      element.animationFrameId = requestAnimationFrame(step);
    } else {
      element.textContent = end.toLocaleString();
      element.animationFrameId = null;
    }
  };
  
  element.animationFrameId = requestAnimationFrame(step);
}

// ==========================================================================
// Dashboard Data Fetching (GET)
// ==========================================================================

async function fetchDashboardStats() {
  // Show skeleton loading states
  Object.values(cardElements).forEach(card => card.classList.add('loading'));
  
  // Update sync indicator
  syncStatusIndicator.className = 'sync-indicator loading';
  syncStatusText.textContent = 'Syncing...';
  
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Save to local storage cache
    localStorage.setItem('cached_dashboard_stats', JSON.stringify(data));
    
    // Update the UI with animated values
    updateDashboardUI(data);
    
    // Set status to synced
    syncStatusIndicator.className = 'sync-indicator synced';
    syncStatusText.textContent = 'Synced';
    
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    
    // Retrieve cached values
    const cachedData = localStorage.getItem('cached_dashboard_stats');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      updateDashboardUI(parsedData);
      showToast('Dashboard values loaded from offline cache.', 'warning');
    } else {
      // Fallback defaults
      const defaults = { totalInvitations: 0, saturdayHeadcount: 0, sundayHeadcount: 0, totalVips: 0 };
      updateDashboardUI(defaults);
      showToast('Could not fetch dashboard statistics. Showing default values.', 'error');
    }
    
    // Set status to offline
    syncStatusIndicator.className = 'sync-indicator offline';
    syncStatusText.textContent = 'Offline Cache';
  } finally {
    // Hide skeletons
    Object.values(cardElements).forEach(card => card.classList.remove('loading'));
  }
}

function updateDashboardUI(data) {
  const totalSent = data.totalInvitations || 0;
  const satGuests = data.saturdayHeadcount || 0;
  const sunGuests = data.sundayHeadcount || 0;
  const vipsCount = data.totalVips || 0;
  
  const currentSent = parseInt(dashboardStats.sent.textContent.replace(/,/g, '')) || 0;
  const currentSat = parseInt(dashboardStats.saturday.textContent.replace(/,/g, '')) || 0;
  const currentSun = parseInt(dashboardStats.sunday.textContent.replace(/,/g, '')) || 0;
  const currentVip = parseInt(dashboardStats.vips.textContent.replace(/,/g, '')) || 0;

  // Animate counts
  animateValue(dashboardStats.sent, currentSent, totalSent);
  animateValue(dashboardStats.saturday, currentSat, satGuests);
  animateValue(dashboardStats.sunday, currentSun, sunGuests);
  animateValue(dashboardStats.vips, currentVip, vipsCount);

  // Update Invitations Progress Bar
  const percentage = Math.min(Math.round((totalSent / TARGET_CAPACITY) * 100), 100);
  dashboardStats.progressFill.style.width = `${percentage}%`;
  dashboardStats.percentBadge.textContent = `${percentage}%`;
  
  dashboardStats.sentDetail.textContent = totalSent.toLocaleString();
  const pendingCount = Math.max(TARGET_CAPACITY - totalSent, 0);
  dashboardStats.pendingDetail.textContent = pendingCount.toLocaleString();
}

// ==========================================================================
// Custom Stepper Logic (Headcount)
// ==========================================================================

function updateHeadcount(modifier) {
  let val = parseInt(headcountInput.value) || 1;
  val = Math.max(1, Math.min(val + modifier, 50));
  headcountInput.value = val;
  
  // Custom interactive animations
  const targetBtn = modifier > 0 ? btnPlus : btnMinus;
  targetBtn.style.transform = 'scale(0.85)';
  setTimeout(() => {
    targetBtn.style.transform = '';
  }, 100);
  
  validateField(headcountInput, document.getElementById('headcount-error'));
}

btnMinus.addEventListener('click', () => updateHeadcount(-1));
btnPlus.addEventListener('click', () => updateHeadcount(1));

// Clamp headcount on manual blur
headcountInput.addEventListener('blur', () => {
  let val = parseInt(headcountInput.value) || 1;
  val = Math.max(1, Math.min(val, 50));
  headcountInput.value = val;
  validateField(headcountInput, document.getElementById('headcount-error'));
});

// ==========================================================================
// Form Validation & Interaction
// ==========================================================================

function validateField(inputElement, errorElement) {
  let isValid = true;
  
  if (inputElement.hasAttribute('required')) {
    if (!inputElement.value || inputElement.value.trim() === '') {
      isValid = false;
    }
  }

  // Headcount validation
  if (inputElement === headcountInput) {
    const val = parseInt(inputElement.value);
    if (isNaN(val) || val < 1) {
      isValid = false;
    }
  }

  const formGroup = inputElement.closest('.form-group');
  if (!isValid) {
    formGroup.classList.add('has-error');
  } else {
    formGroup.classList.remove('has-error');
  }

  return isValid;
}

// Remove error on type/change
[nameInput, categoryInput, headcountInput, eventInput].forEach(input => {
  const errorId = `${input.name || input.id.split('-')[1]}-error`;
  const errorElement = document.getElementById(errorId);
  
  input.addEventListener('input', () => {
    if (input.closest('.form-group').classList.contains('has-error')) {
      validateField(input, errorElement);
    }
  });
  
  input.addEventListener('change', () => {
    if (input.closest('.form-group').classList.contains('has-error')) {
      validateField(input, errorElement);
    }
  });
});

// ==========================================================================
// Form Submission & POST logic
// ==========================================================================

guestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate all fields
  const isNameValid = validateField(nameInput, document.getElementById('name-error'));
  const isCategoryValid = validateField(categoryInput, document.getElementById('category-error'));
  const isHeadcountValid = validateField(headcountInput, document.getElementById('headcount-error'));
  const isEventValid = validateField(eventInput, document.getElementById('event-error'));
  
  if (!isNameValid || !isCategoryValid || !isHeadcountValid || !isEventValid) {
    const firstInvalid = document.querySelector('.has-error .form-control');
    if (firstInvalid) firstInvalid.focus();
    showToast('Please correct the highlighted form errors.', 'error');
    return;
  }
  
  // Set submitting state
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.querySelector('.btn-text').textContent = 'Saving...';
  
  // Package form payload
  const payload = {
    name: nameInput.value.trim(),
    category: categoryInput.value,
    adults: parseInt(headcountInput.value),
    event: eventInput.value,
    probability: probabilityInput.value || "",
    dietary: dietaryInput.value,
    vip: vipInput.checked ? 'Yes' : 'No',
    invitation: invitationInput.checked ? 'Yes' : 'No',
    contact: contactInput.value.trim() || "",
    remarks: remarksInput.value.trim() || "",
    sNo: ""
  };
  
  try {
    // The ultimate fix to bypass browser security blocks
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', // Tells the browser not to block the request
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      }
    });
    
    // Clear form & reset defaults
    resetRegistryForm();
    showToast('Guest registered successfully!', 'success');
    
    // Refresh stats after a small delay
    setTimeout(() => {
      fetchDashboardStats();
    }, 1500);
    
  } catch (error) {
    console.error('Submission failed:', error);
    showToast('Failed to save guest. Check internet connection and try again.', 'error');
  } finally {
    // Reset button states
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Register Guest';
  }
});

function resetRegistryForm() {
  // Clear inputs
  nameInput.value = '';
  categoryInput.value = '';
  headcountInput.value = '1';
  eventInput.value = '';
  probabilityInput.value = '';
  contactInput.value = '';
  remarksInput.value = '';
  
  // Reset toggles to default
  invitationInput.checked = false;
  vipInput.checked = false;
  
  // Reset select boxes to placeholder
  dietaryInput.value = 'Non-Veg';
  
  // Remove error classes
  document.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('has-error');
  });
}

// ==========================================================================
// Toast Notifications
// ==========================================================================

function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon definitions based on type
  let iconMarkup = '';
  if (type === 'success') {
    iconMarkup = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconMarkup = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === 'warning') {
    iconMarkup = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  }
  
  toast.innerHTML = `
    ${iconMarkup}
    <div class="toast-message">${message}</div>
    <button class="toast-dismiss" aria-label="Dismiss message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Attach dismiss listener
  const dismissBtn = toast.querySelector('.toast-dismiss');
  dismissBtn.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-dismiss timer
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);
  
  // Store timeout on the toast element for cleaning
  toast.timeoutId = timeoutId;
}

function removeToast(toast) {
  if (toast.classList.contains('toast-fade-out')) return;
  
  clearTimeout(toast.timeoutId);
  toast.classList.add('toast-fade-out');
  
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
  
  // Fallback remove
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 300);
}

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchDashboardStats();
});

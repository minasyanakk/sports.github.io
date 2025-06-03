document.addEventListener('DOMContentLoaded', () => {
  // Show loading animation
  const loadingContainer = document.getElementById('loadingContainer');
  const trainingPlanContainer = document.getElementById('trainingPlanContainer');
  
  // Simulate loading
  setTimeout(() => {
    loadingContainer.style.display = 'none';
    trainingPlanContainer.style.display = 'block';
    
    // Initialize the plan after "loading"
    initializeTrainingPlan();
    initializeCharts();
    initializeTabSwitching();
  }, 1500);
  
  // Initialize event listeners
  initializeEventListeners();
});

// Initialize training plan
function initializeTrainingPlan() {
  const trainingPlanBody = document.getElementById('trainingPlanBody');
  const mobileCards = document.getElementById('mobileCards');
  
  // Populate table with training plan data
  trainingPlan.forEach(week => {
    // Create table row
    const tableRow = document.createElement('tr');
    tableRow.setAttribute('data-phase', week.phase);
    tableRow.classList.add('staggered-list-item');
    
    // For debugging
    if (week.phase === 'taper') {
      console.log(`Adding taper week ${week.week} to table`);
    }
    
    // Add week number cell
    const weekCell = document.createElement('td');
    weekCell.innerHTML = `<strong>Тиждень ${week.week}</strong><br><span class="phase-label">${getPhaseLabel(week.phase)}</span>`;
    tableRow.appendChild(weekCell);
    
    // Add day cells
    week.days.forEach(day => {
      const dayCell = document.createElement('td');
      dayCell.innerHTML = `
        <div class="training-cell training-type-${day.type}">
          <div class="training-title">${day.title}</div>
          <div class="training-details">${day.details}</div>
          <span class="training-intensity intensity-${day.intensity}">${getIntensityLabel(day.intensity)}</span>
        </div>
      `;
      tableRow.appendChild(dayCell);
    });
    
    trainingPlanBody.appendChild(tableRow);
    
    // Create mobile card for this week
    const weekCard = document.createElement('div');
    weekCard.className = 'mobile-week-card staggered-list-item';
    weekCard.setAttribute('data-phase', week.phase);
    
    // Debug for mobile cards
    if (week.phase === 'taper') {
      console.log(`Adding taper week ${week.week} to mobile cards`);
    }
    
    // Add week header
    weekCard.innerHTML = `<div class="mobile-week-header">Тиждень ${week.week} - ${getPhaseLabel(week.phase)}</div>`;
    
    // Add days
    week.days.forEach(day => {
      const dayCard = document.createElement('div');
      dayCard.className = 'mobile-day-card';
      dayCard.innerHTML = `
        <div class="mobile-day-name">${day.day}</div>
        <div class="mobile-day-content">
          <div class="training-cell training-type-${day.type}">
            <div class="training-title">${day.title}</div>
            <div class="training-details">${day.details}</div>
            <span class="training-intensity intensity-${day.intensity}">${getIntensityLabel(day.intensity)}</span>
          </div>
        </div>
      `;
      weekCard.appendChild(dayCard);
    });
    
    mobileCards.appendChild(weekCard);
  });
}

// Helper functions for labels
function getPhaseLabel(phase) {
  const phases = {
    'base': 'Базовий',
    'build': 'Будівельний',
    'intense': 'Інтенсивний',
    'taper': 'Підводка'
  };
  return phases[phase] || phase;
}

function getIntensityLabel(intensity) {
  const intensities = {
    'easy': 'Легкий',
    'moderate': 'Помірний',
    'hard': 'Важкий'
  };
  return intensities[intensity] || intensity;
}

// Initialize event listeners
function initializeEventListeners() {
  // Period filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Filter training plan
      const period = button.getAttribute('data-period');
      console.log(`Button clicked: ${period}`);
      
      // Check if we have training weeks with this phase
      const weeksWithPhase = trainingPlan.filter(week => week.phase === period);
      console.log(`Training weeks with phase '${period}': ${weeksWithPhase.length}`);
      if (weeksWithPhase.length > 0) {
        console.log(`Week numbers: ${weeksWithPhase.map(w => w.week).join(', ')}`);
      }
      
      filterTrainingPlan(period);
    });
  });
  
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active state for buttons
      tabButtons.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Get the tab ID
      const tabId = tab.getAttribute('data-tab');
      
      // Hide all tab contents first
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });
      
      // Show the selected tab content
      const selectedTab = document.getElementById(`${tabId}Tab`);
      selectedTab.classList.add('active');
      selectedTab.style.display = 'block';
    });
  });
  
  // Calendar buttons
  document.getElementById('googleCalendarBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportToGoogleCalendar();
  });
  
  document.getElementById('appleCalendarBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportToICS('apple');
  });
  
  document.getElementById('outlookCalendarBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportToICS('outlook');
  });
  
  document.getElementById('exportCalendarBtn').addEventListener('click', () => {
    exportToICS('general');
  });
}

// Filter training plan by period
function filterTrainingPlan(period) {
  const allRows = document.querySelectorAll('#trainingPlanBody tr');
  const allMobileCards = document.querySelectorAll('.mobile-week-card');
  
  // Log detailed info for debugging
  console.log('All rows: ', allRows.length);
  allRows.forEach((row, i) => {
    const phase = row.getAttribute('data-phase');
    console.log(`Row ${i}: phase=${phase}, week=${row.querySelector('td:first-child strong')?.textContent}`);
  });
  
  if (period === 'all') {
    // Show all weeks with explicit display values
    allRows.forEach(row => row.style.display = 'table-row');
    allMobileCards.forEach(card => card.style.display = 'block');
  } else {
    // Filter by phase - improved to ensure display property is set correctly
    console.log(`Filtering for phase: ${period}`);
    
    allRows.forEach(row => {
      const rowPhase = row.getAttribute('data-phase');
      console.log(`Row phase: ${rowPhase}, match: ${rowPhase === period}`);
      
      if (rowPhase === period) {
        row.style.display = 'table-row'; // Explicitly set to table-row
      } else {
        row.style.display = 'none';
      }
    });
    
    allMobileCards.forEach(card => {
      const cardPhase = card.getAttribute('data-phase');
      
      if (cardPhase === period) {
        card.style.display = 'block'; // Explicitly set to block
      } else {
        card.style.display = 'none';
      }
    });
    
    // Log results for debugging
    console.log(`Filtering by period: ${period}`);
    console.log(`Rows with phase ${period}: ${document.querySelectorAll(`#trainingPlanBody tr[data-phase="${period}"]`).length}`);
    console.log(`Visible rows: ${document.querySelectorAll('#trainingPlanBody tr[style="display: table-row;"]').length}`);
  }
}

// Initialize charts
function initializeCharts() {
  // Distance chart
  const distanceCtx = document.getElementById('distanceChart').getContext('2d');
  new Chart(distanceCtx, {
    type: 'line',
    data: distanceData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Кілометри'
          }
        }
      }
    }
  });
  
  // Training type chart
  const trainingTypeCtx = document.getElementById('trainingTypeChart').getContext('2d');
  new Chart(trainingTypeCtx, {
    type: 'doughnut',
    data: trainingTypeData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.formattedValue || '';
              return `${label}: ${value}%`;
            }
          }
        }
      }
    }
  });
}

// Initialize tab switching
function initializeTabSwitching() {
  // Make sure initial tab is shown correctly
  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.classList.contains('active')) {
      content.style.display = 'block';
    } else {
      content.style.display = 'none';
    }
  });
}

// Show notification
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<div class="notification-content">${message}</div>`;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add notification styles dynamically
const notificationStyles = `
  .notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: var(--color-primary-800);
    color: white;
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .notification.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  
  .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1001;
    justify-content: center;
    align-items: center;
  }
  
  .modal.show {
    display: flex;
  }
  
  .modal-content {
    background-color: white;
    padding: 24px;
    border-radius: var(--radius-lg);
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .modal.show .modal-content {
    transform: translateY(0);
    opacity: 1;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .modal-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-gray-900);
  }
  
  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 24px;
    color: var(--color-gray-500);
  }
  
  .modal-body {
    margin-bottom: 24px;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .btn {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background-color: var(--color-primary-600);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background-color: var(--color-primary-700);
  }
  
  .btn-secondary {
    background-color: var(--color-gray-200);
    color: var(--color-gray-800);
    border: 1px solid var(--color-gray-300);
  }
  
  .btn-secondary:hover {
    background-color: var(--color-gray-300);
  }
`;

const styleElement = document.createElement('style');
styleElement.textContent = notificationStyles;
document.head.appendChild(styleElement);

// Google Calendar integration
function exportToGoogleCalendar() {
  showModal(
    'Експорт в Google Calendar',
    `
    <p>Ця функція демонструє експорт до Google Calendar. У реальній версії ця функція вимагає авторизації через Google API.</p>
    <div style="margin-top: 16px;">
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Назва календаря:</label>
        <input type="text" id="calendarName" value="План тренувань RunPro" style="width: 100%; padding: 8px; border: 1px solid var(--color-gray-300); border-radius: var(--radius-md);">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Період:</label>
        <select id="calendarPeriod" style="width: 100%; padding: 8px; border: 1px solid var(--color-gray-300); border-radius: var(--radius-md);">
          <option value="all">Весь план</option>
          <option value="base">Базовий період</option>
          <option value="build">Будівельний період</option>
          <option value="intense">Інтенсивний період</option>
          <option value="taper">Підводка</option>
        </select>
      </div>
      <div style="margin-bottom: 12px; display: flex; align-items: center;">
        <input type="checkbox" id="includeReminders" style="margin-right: 8px;" checked>
        <label for="includeReminders">Додати нагадування (за 1 годину до тренування)</label>
      </div>
      <p style="margin-top: 16px; font-style: italic; color: var(--color-gray-500);">
        Примітка: Для прямої інтеграції з Google Calendar потрібно використовувати 
        <a href="https://developers.google.com/calendar/api/guides/overview" target="_blank" style="color: var(--color-primary-600);">Google Calendar API</a>. 
        У цій демо-версії буде згенеровано ICS файл, який ви можете імпортувати вручну.
      </p>
    </div>
    `,
    () => {
      // Get form values
      const calendarName = document.getElementById('calendarName').value;
      const period = document.getElementById('calendarPeriod').value;
      const includeReminders = document.getElementById('includeReminders').checked;
      
      // Close modal
      closeModal();
      
      // Create and download ICS file like other calendars
      simulateICSDownload('google', period);
      
      // Show Google Calendar-specific instructions after file downloads
      setTimeout(() => {
        showModal(
          'Імпорт у Google Calendar',
          `
          <p>Файл тренувального плану успішно згенеровано!</p>
          <p>Всі тренування встановлені на <strong>19:10</strong>.</p>
          <p>Для імпорту у Google Calendar:</p>
          <ol style="margin-left: 24px; margin-top: 12px;">
            <li>Відкрийте <a href="https://calendar.google.com/" target="_blank" style="color: var(--color-primary-600);">Google Calendar</a></li>
            <li>Натисніть на значок налаштувань (⚙️) у верхньому правому куті</li>
            <li>Виберіть "Імпортувати і експортувати"</li>
            <li>Натисніть "Виберіть файл" і знайдіть завантажений ICS файл</li>
            <li>Натисніть "Імпортувати"</li>
          </ol>
          <p style="margin-top: 12px;">Всі тренування з файлу будуть додані до вашого календаря з назвою "${calendarName}".</p>
          `,
          () => {
            closeModal();
          },
          true
        );
      }, 1500);
    }
  );
}

// Export to ICS file (for Apple Calendar, Outlook, etc.)
function exportToICS(calendarType) {
  let title, instruction;
  
  switch(calendarType) {
    case 'apple':
      title = 'Експорт в Apple Calendar';
      instruction = 'Файл .ics буде завантажено, який ви можете відкрити в Apple Calendar.';
      break;
    case 'outlook':
      title = 'Експорт в Outlook';
      instruction = 'Файл .ics буде завантажено, який ви можете імпортувати в Outlook.';
      break;
    default:
      title = 'Експорт календаря';
      instruction = 'Файл .ics буде завантажено, який ви можете імпортувати в будь-який календарний додаток.';
  }
  
  showModal(
    title,
    `
    <p>${instruction}</p>
    <div style="margin-top: 16px;">
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Період:</label>
        <select id="icsCalendarPeriod" style="width: 100%; padding: 8px; border: 1px solid var(--color-gray-300); border-radius: var(--radius-md);">
          <option value="all">Весь план</option>
          <option value="base">Базовий період</option>
          <option value="build">Будівельний період</option>
          <option value="intense">Інтенсивний період</option>
          <option value="taper">Підводка</option>
        </select>
      </div>
      <div style="margin-bottom: 12px; display: flex; align-items: center;">
        <input type="checkbox" id="icsIncludeReminders" style="margin-right: 8px;" checked>
        <label for="icsIncludeReminders">Додати нагадування (за 1 годину до тренування)</label>
      </div>
    </div>
    `,
    () => {
      // Simulate export process
      const period = document.getElementById('icsCalendarPeriod').value;
      const includeReminders = document.getElementById('icsIncludeReminders').checked;
      
      // Close modal
      closeModal();
      
      // Create a simulated download
      simulateICSDownload(calendarType, period);
    }
  );
}

// Helper function to simulate ICS file download
function simulateICSDownload(calendarType, period) {
  const dummyContent = generateICSContent(period);
  
  // Create a blob and download link
  const blob = new Blob([dummyContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `RunPro_Training_Plan_${period}.ics`;
  
  // Append link, trigger click, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show notification with time information
  setTimeout(() => {
    showNotification('Файл календаря успішно згенеровано та завантажено (всі тренування призначені на 19:10)');
  }, 1000);
}

// Generate ICS content based on training plan
function generateICSContent(periodFilter) {
  // Filter the training plan based on period if needed
  const filteredPlan = periodFilter === 'all' 
    ? trainingPlan 
    : trainingPlan.filter(week => week.phase === periodFilter);
  
  // ICS file header - using a simplified format
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RunPro Enterprise//Training Plan//UK
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  // Set start date to next Monday
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + (8 - startDate.getDay()) % 7);
  
  // Generate events for each training session
  filteredPlan.forEach(week => {
    week.days.forEach((day, dayIndex) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + (week.week - 1) * 7 + dayIndex);
      
      // Set fixed time 19:10 for all training sessions
      eventDate.setHours(19, 10, 0, 0);
      
      // End time: 1 hour later
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + 1);
      
      // Format date strings in RFC5545 format for iCalendar
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const startDateStr = formatDate(eventDate);
      const endDateStr = formatDate(endDate);
      const now = formatDate(new Date());
      
      // Sanitize description by replacing newlines with \\n
      const description = `${day.details}. Тиждень: ${week.week}, Фаза: ${getPhaseLabel(week.phase)}, Інтенсивність: ${getIntensityLabel(day.intensity)}`.replace(/\n/g, '\\n');
      
      // Create event using UTC time (Z suffix) for maximum compatibility
      icsContent += `BEGIN:VEVENT
UID:runpro-${week.week}-${dayIndex}-${Math.random().toString(36).substring(2, 11)}@runpro.enterprise
DTSTAMP:${now}
DTSTART:${startDateStr}
DTEND:${endDateStr}
SUMMARY:${day.title}
DESCRIPTION:${description}
CATEGORIES:Training,${day.type}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Нагадування про тренування
TRIGGER:-PT1H
END:VALARM
END:VEVENT
`;
    });
  });
  
  // ICS file footer
  icsContent += 'END:VCALENDAR';
  
  return icsContent;
}

// Show modal dialog
function showModal(title, content, confirmCallback, isInfo = false) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('appModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'appModal';
    modal.className = 'modal';
    
    const footerButtons = isInfo 
      ? `<button class="btn btn-primary modal-confirm">Зрозуміло</button>`
      : `<button class="btn btn-secondary modal-cancel">Скасувати</button>
         <button class="btn btn-primary modal-confirm">Експортувати</button>`;
    
    const modalContent = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${footerButtons}
        </div>
      </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    
    if (!isInfo) {
      modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
    }
    
    modal.querySelector('.modal-confirm').addEventListener('click', confirmCallback);
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  } else {
    // Update modal content
    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-body').innerHTML = content;
    
    // Update footer buttons based on isInfo flag
    const modalFooter = modal.querySelector('.modal-footer');
    if (isInfo) {
      modalFooter.innerHTML = `<button class="btn btn-primary modal-confirm">Зрозуміло</button>`;
    } else {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary modal-cancel">Скасувати</button>
        <button class="btn btn-primary modal-confirm">Експортувати</button>
      `;
      modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
    }
    
    // Update confirm button event
    const confirmButton = modal.querySelector('.modal-confirm');
    confirmButton.addEventListener('click', confirmCallback);
  }
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// Close modal dialog
function closeModal() {
  const modal = document.getElementById('appModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}
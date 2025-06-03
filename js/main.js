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
    initializeModal();
    
    // Display today's training
    displayCurrentDateAndTraining();
  }, 1500);
  
  // Initialize event listeners
  initializeEventListeners();
});

// Display current date and training
function displayCurrentDateAndTraining(testDate) {
  // Get current date elements
  const currentDateElement = document.getElementById('currentDate');
  const todayTrainingContainer = document.getElementById('todayTraining');
  
  // Get current date (or use test date for development)
  const realToday = testDate || new Date();
  
  // For development/testing - use a mock date inside the training program
  // This makes the current training visible even before the program starts
  // Раскомментируйте для тестирования выходного дня (воскресенье)
  // const today = new Date(2025, 5, 15, 12, 0, 0); // June 15, 2025 (week 1, Sunday)
  // Или используйте реальную дату
  const today = realToday;
  
  // Display real current date
  const realFormattedDate = realToday.toLocaleDateString('uk-UA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Format current date for display
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('uk-UA', options);
  
  // Show real date and training date (if in demo mode)
  if (today.getTime() !== realToday.getTime()) {
    currentDateElement.innerHTML = `
      <div class="real-date">${realFormattedDate}</div>
      <div class="demo-date">Демонстрація тренування на: ${formattedDate}</div>
    `;
  } else {
    currentDateElement.textContent = formattedDate;
  }
  
  // Calculate program start date
  const programStartDate = new Date(2025, 5, 9, 12, 0, 0); // June 9, 2025 (months are 0-indexed)
  
  // Check if today is before the program start
  if (today < programStartDate) {
    // Show first training from the program (for the future start date)
    const firstWeek = trainingPlan[0];
    const firstDay = firstWeek.days[0]; // Monday of first week
    
    // Get background color based on training type
    let backgroundColor, borderColor;
    switch (firstDay.type) {
      case 'run':
        backgroundColor = 'rgba(59, 130, 246, 0.1)';
        borderColor = 'var(--color-run)';
        break;
      case 'strength':
        backgroundColor = 'rgba(245, 158, 11, 0.1)';
        borderColor = 'var(--color-strength)';
        break;
      case 'bike':
        backgroundColor = 'rgba(16, 185, 129, 0.1)';
        borderColor = 'var(--color-bike)';
        break;
      case 'rest':
        backgroundColor = 'rgba(107, 114, 128, 0.1)';
        borderColor = 'var(--color-rest)';
        break;
    }
    
    // Get nutrition plan
    const nutritionPlan = getNutritionPlan(firstDay.type, firstDay.intensity, firstWeek.phase);
    
    // Display first training
    todayTrainingContainer.innerHTML = `
      <div class="program-not-started">
        <p>Програма тренувань починається з ${programStartDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h3>Перше тренування в програмі:</h3>
      </div>
      <div class="today-training-card compact" style="background-color: ${backgroundColor}; border-left: 3px solid ${borderColor};">
        <div class="today-training-header">
          <h2 class="today-training-title">${firstDay.title} (${firstDay.day})</h2>
          <span class="today-training-badge intensity-${firstDay.intensity}">${getIntensityLabel(firstDay.intensity)}</span>
        </div>
        <div class="today-training-content">
          <div class="today-training-details">
            <p>${firstDay.details}</p>
            <div class="training-meta">
              <span class="training-meta-item">Тиждень: ${firstWeek.week}</span>
              <span class="training-meta-item">Фаза: ${getPhaseLabel(firstWeek.phase)}</span>
            </div>
          </div>
          
          <div class="collapsible-section">
            <div class="collapsible-header">
              <h3>Рекомендації з харчування</h3>
              <button class="toggle-button">Показати</button>
            </div>
            <div class="collapsible-content hidden">
              ${nutritionPlan}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for collapsible section
    setTimeout(() => {
      initializeCollapsibleSections();
    }, 100);
    return;
  }
  
  // Calculate days since program start
  const daysDiff = Math.floor((today - programStartDate) / (1000 * 60 * 60 * 24));
  
  // Check if we're past the program
  if (daysDiff >= 7 * trainingPlan.length) {
    todayTrainingContainer.innerHTML = `
      <div class="no-training">
        <h3>Програма тренувань завершена</h3>
        <p>Вітаємо! Ви успішно завершили 12-тижневу програму підготовки до півмарафону.</p>
      </div>
    `;
    return;
  }
  
  // Calculate current week and day
  const currentWeekIndex = Math.floor(daysDiff / 7);
  const currentDayIndex = daysDiff % 7;
  
  // Get current training info
  const currentWeek = trainingPlan[currentWeekIndex];
  const currentDay = currentWeek.days[currentDayIndex];
  
  // Check if today is a rest day, if so, find next training day
  let isRestDay = currentDay.type === 'rest';
  let nextTrainingDay = null;
  let nextTrainingDayDate = null;
  
  if (isRestDay) {
    // Find next training day
    let foundNext = false;
    let searchWeekIndex = currentWeekIndex;
    let searchDayIndex = currentDayIndex;
    
    // Try to find next training day in current week or subsequent weeks
    while (!foundNext && searchWeekIndex < trainingPlan.length) {
      // Move to next day
      searchDayIndex++;
      
      // If we've gone past the end of the week, move to next week
      if (searchDayIndex >= 7) {
        searchWeekIndex++;
        searchDayIndex = 0;
        
        // If we've gone past the end of the plan, break
        if (searchWeekIndex >= trainingPlan.length) {
          break;
        }
      }
      
      // Get training for this day
      const searchDay = trainingPlan[searchWeekIndex].days[searchDayIndex];
      
      // If it's not a rest day, we've found our next training
      if (searchDay.type !== 'rest') {
        nextTrainingDay = searchDay;
        foundNext = true;
        
        // Calculate date for this training
        const nextDate = new Date(programStartDate);
        nextDate.setDate(programStartDate.getDate() + (searchWeekIndex * 7) + searchDayIndex);
        nextTrainingDayDate = nextDate;
      }
    }
  }
  
  // Get background color based on training type
  let backgroundColor, borderColor;
  switch (currentDay.type) {
    case 'run':
      backgroundColor = 'rgba(59, 130, 246, 0.1)';
      borderColor = 'var(--color-run)';
      break;
    case 'strength':
      backgroundColor = 'rgba(245, 158, 11, 0.1)';
      borderColor = 'var(--color-strength)';
      break;
    case 'bike':
      backgroundColor = 'rgba(16, 185, 129, 0.1)';
      borderColor = 'var(--color-bike)';
      break;
    case 'rest':
      backgroundColor = 'rgba(107, 114, 128, 0.1)';
      borderColor = 'var(--color-rest)';
      break;
  }
  
  // Get nutrition plan
  const nutritionPlan = getNutritionPlan(currentDay.type, currentDay.intensity, currentWeek.phase);
  
  // Check if we need to show rest day or next training
  if (isRestDay && nextTrainingDay) {
    // Format date for next training
    const nextTrainingDateFormatted = nextTrainingDayDate.toLocaleDateString('uk-UA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    // Get colors for next training
    let nextBackgroundColor, nextBorderColor;
    switch (nextTrainingDay.type) {
      case 'run':
        nextBackgroundColor = 'rgba(59, 130, 246, 0.1)';
        nextBorderColor = 'var(--color-run)';
        break;
      case 'strength':
        nextBackgroundColor = 'rgba(245, 158, 11, 0.1)';
        nextBorderColor = 'var(--color-strength)';
        break;
      case 'bike':
        nextBackgroundColor = 'rgba(16, 185, 129, 0.1)';
        nextBorderColor = 'var(--color-bike)';
        break;
    }
    
    // Get nutrition plan for rest day
    const restNutritionPlan = getNutritionPlan('rest', 'easy', currentWeek.phase);
    
    // Display rest day with next training info
    todayTrainingContainer.innerHTML = `
      <div class="today-training-card compact" style="background-color: ${backgroundColor}; border-left: 3px solid ${borderColor};">
        <div class="today-training-header">
          <h2 class="today-training-title">${currentDay.title}</h2>
          <span class="today-training-badge intensity-${currentDay.intensity}">${getIntensityLabel(currentDay.intensity)}</span>
        </div>
        <div class="today-training-content">
          <div class="today-training-details">
            <p>${currentDay.details}</p>
            <div class="training-meta">
              <span class="training-meta-item">Тиждень: ${currentWeek.week}</span>
              <span class="training-meta-item">Фаза: ${getPhaseLabel(currentWeek.phase)}</span>
            </div>
          </div>
          
          <div class="collapsible-section">
            <div class="collapsible-header">
              <h3>Рекомендації з харчування</h3>
              <button class="toggle-button">Показати</button>
            </div>
            <div class="collapsible-content hidden">
              ${restNutritionPlan}
            </div>
          </div>
        </div>
      </div>
      
      <div class="next-training-section">
        <h3>Наступне тренування</h3>
        <div class="today-training-card compact next-training" style="background-color: ${nextBackgroundColor}; border-left: 3px solid ${nextBorderColor};">
          <div class="today-training-header">
            <h2 class="today-training-title">${nextTrainingDay.title} (${nextTrainingDateFormatted})</h2>
            <span class="today-training-badge intensity-${nextTrainingDay.intensity}">${getIntensityLabel(nextTrainingDay.intensity)}</span>
          </div>
          <div class="today-training-content">
            <div class="today-training-details">
              <p>${nextTrainingDay.details}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // Display current training (not a rest day or couldn't find next training)
    todayTrainingContainer.innerHTML = `
      <div class="today-training-card compact" style="background-color: ${backgroundColor}; border-left: 3px solid ${borderColor};">
        <div class="today-training-header">
          <h2 class="today-training-title">${currentDay.title}</h2>
          <span class="today-training-badge intensity-${currentDay.intensity}">${getIntensityLabel(currentDay.intensity)}</span>
        </div>
        <div class="today-training-content">
          <div class="today-training-details">
            <p>${currentDay.details}</p>
            <div class="training-meta">
              <span class="training-meta-item">Тиждень: ${currentWeek.week}</span>
              <span class="training-meta-item">Фаза: ${getPhaseLabel(currentWeek.phase)}</span>
            </div>
          </div>
          
          <div class="collapsible-section">
            <div class="collapsible-header">
              <h3>Рекомендації з харчування</h3>
              <button class="toggle-button">Показати</button>
            </div>
            <div class="collapsible-content hidden">
              ${nutritionPlan}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Add event listener for collapsible section
  setTimeout(() => {
    initializeCollapsibleSections();
  }, 100);
}

// Initialize training plan
function initializeTrainingPlan() {
  const trainingPlanBody = document.getElementById('trainingPlanBody');
  const mobileCards = document.getElementById('mobileCards');
  
  // Calculate start date (June 9, 2025 - next Monday)
  // Используем время 12:00, чтобы избежать проблем с часовым поясом
  const startDate = new Date(2025, 5, 9, 12, 0, 0); // June 9, 2025 (months are 0-indexed)
  
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
    
    // Calculate week start date
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (week.week - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    // Format dates
    const formatDate = (date) => {
      return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    };
    
    // Add week number cell with dates
    const weekCell = document.createElement('td');
    weekCell.innerHTML = `
      <strong>Тиждень ${week.week}</strong><br>
      <span class="phase-label">${getPhaseLabel(week.phase)}</span><br>
      <span class="date-range">${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</span>
    `;
    tableRow.appendChild(weekCell);
    
    // Add day cells
    week.days.forEach((day, dayIndex) => {
      // Calculate the date for this specific day
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + dayIndex);
      const formattedDate = formatDate(dayDate);
      
      const dayCell = document.createElement('td');
      dayCell.innerHTML = `
        <div class="day-date">${formattedDate}</div>
        <div class="training-cell training-type-${day.type}" data-day="${day.day}" data-type="${day.type}" data-title="${day.title}" data-details="${day.details}" data-intensity="${day.intensity}" data-week="${week.week}" data-phase="${week.phase}" data-date="${dayDate.toISOString().split('T')[0]}">
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
    
    // Add week header with date range
    weekCard.innerHTML = `<div class="mobile-week-header">Тиждень ${week.week} - ${getPhaseLabel(week.phase)}<div class="mobile-week-dates">${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</div></div>`;
    
    // Add days
    week.days.forEach((day, dayIndex) => {
      // Calculate the date for this specific day
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + dayIndex);
      const formattedDate = formatDate(dayDate);
      
      const dayCard = document.createElement('div');
      dayCard.className = 'mobile-day-card';
      dayCard.innerHTML = `
        <div class="mobile-day-name">${day.day}<div class="mobile-day-date">${formattedDate}</div></div>
        <div class="mobile-day-content">
          <div class="training-cell training-type-${day.type}" data-day="${day.day}" data-type="${day.type}" data-title="${day.title}" data-details="${day.details}" data-intensity="${day.intensity}" data-week="${week.week}" data-phase="${week.phase}" data-date="${dayDate.toISOString().split('T')[0]}">
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

  // Set start date to next Monday (June 9, 2025)
  // Используем время 12:00, чтобы избежать проблем с часовым поясом
  const startDate = new Date(2025, 5, 9, 12, 0, 0); // June 9, 2025 (months are 0-indexed)
  
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

// Initialize training modal
function initializeModal() {
  const trainingModal = document.getElementById('trainingModal');
  const modalClose = document.getElementById('modalClose');
  
  // Add event listener to close button
  modalClose.addEventListener('click', () => {
    window.closeTrainingModal();
  });
  
  // Close modal when clicking outside of content
  trainingModal.addEventListener('click', (e) => {
    if (e.target === trainingModal) {
      window.closeTrainingModal();
    }
  });
  
  // Add keyboard support for closing (Escape key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && trainingModal.classList.contains('show')) {
      window.closeTrainingModal();
    }
  });
  
  // Fix for iOS scrolling issues - prevent body scrolling when modal is open
  window.blockBodyScroll = function(block) {
    if (block) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  };
  
  // Close modal function
  window.closeTrainingModal = function() {
    trainingModal.classList.remove('show');
    window.blockBodyScroll(false);
  };
  
  // Add event listeners to all training cells
  document.addEventListener('click', (e) => {
    const trainingCell = e.target.closest('.training-cell');
    if (trainingCell) {
      showTrainingDetails(trainingCell);
    }
  });
}

// Show training details in modal
function showTrainingDetails(trainingCell) {
  // Get training data from attributes
  const day = trainingCell.getAttribute('data-day');
  const title = trainingCell.getAttribute('data-title');
  const details = trainingCell.getAttribute('data-details');
  const type = trainingCell.getAttribute('data-type');
  const intensity = trainingCell.getAttribute('data-intensity');
  const week = trainingCell.getAttribute('data-week');
  const phase = trainingCell.getAttribute('data-phase');
  const dateString = trainingCell.getAttribute('data-date');
  
  // Format date
  let dateDisplay = '';
  if (dateString) {
    // Исправление проблемы с часовым поясом (добавляем день)
    const dateParts = dateString.split('-');
    // Создаем дату с временем 12:00, чтобы избежать проблем с часовым поясом
    const date = new Date(
      parseInt(dateParts[0]), 
      parseInt(dateParts[1]) - 1, 
      parseInt(dateParts[2]), 
      12, 0, 0
    );
    dateDisplay = date.toLocaleDateString('uk-UA', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  
  // Set modal title
  const modalTitle = document.getElementById('modalTitle');
  modalTitle.textContent = `${day}: ${title}${dateString ? ` (${dateDisplay})` : ''}`;
  
  // Set training plan details
  const modalTrainingPlan = document.getElementById('modalTrainingPlan');
  modalTrainingPlan.innerHTML = `
    <div class="modal-training-info">
      <p><strong>Тиждень:</strong> ${week} (${getPhaseLabel(phase)})</p>
      <p><strong>Тип:</strong> <span class="badge badge-${type}">${getTrainingTypeLabel(type)}</span></p>
      <p><strong>Інтенсивність:</strong> <span class="badge badge-intensity-${intensity}">${getIntensityLabel(intensity)}</span></p>
      <p><strong>Деталі:</strong></p>
      <div class="training-instructions">${details}</div>
    </div>
  `;
  
  // Set nutrition plan based on training type and intensity
  const modalNutritionPlan = document.getElementById('modalNutritionPlan');
  modalNutritionPlan.innerHTML = getNutritionPlan(type, intensity, phase);
  
  // Show modal
  const trainingModal = document.getElementById('trainingModal');
  trainingModal.classList.add('show');
  
  // Block body scroll when modal is open
  if (typeof window.blockBodyScroll === 'function') {
    window.blockBodyScroll(true);
  }
}

// Get training type label
function getTrainingTypeLabel(type) {
  const types = {
    'run': 'Біг',
    'strength': 'Силове тренування',
    'bike': 'Велосипед',
    'rest': 'Відпочинок'
  };
  return types[type] || type;
}

// Initialize collapsible sections
function initializeCollapsibleSections() {
  const toggleButtons = document.querySelectorAll('.toggle-button');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const content = button.closest('.collapsible-section').querySelector('.collapsible-content');
      
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        button.textContent = 'Сховати';
      } else {
        content.classList.add('hidden');
        button.textContent = 'Показати';
      }
    });
  });
}

// Get nutrition plan based on training type and intensity
function getNutritionPlan(type, intensity, phase) {
  let nutritionHTML = '';
  
  // Basic recommendations for all training types
  const basicRecommendations = `
    <p><strong>Загальні рекомендації:</strong></p>
    <ul>
      <li>Вживайте достатньо води протягом дня (30-40 мл на кг ваги тіла)</li>
      <li>Збалансоване харчування з акцентом на цільні продукти</li>
      <li>Уникайте важкої їжі за 2-3 години до тренування</li>
    </ul>
  `;
  
  // Specific recommendations based on training type
  switch (type) {
    case 'run':
      if (intensity === 'hard') {
        nutritionHTML = `
          <h5>Харчування для інтенсивного бігового тренування</h5>
          <p><strong>До тренування (за 2-3 години):</strong></p>
          <ul>
            <li>Вуглеводи з низьким ГІ: вівсянка, хліб з цільного зерна, фрукти</li>
            <li>Помірна кількість білка: яйця, йогурт, протеїновий коктейль</li>
            <li>Мінімум жирів</li>
          </ul>
          <p><strong>Під час тренування (якщо більше 60 хв):</strong></p>
          <ul>
            <li>Спортивні напої або гелі (30-60 г вуглеводів на годину)</li>
            <li>Вода за потребою</li>
          </ul>
          <p><strong>Після тренування (протягом 30 хв):</strong></p>
          <ul>
            <li>Співвідношення вуглеводів до білків 3:1 або 4:1</li>
            <li>Швидкі вуглеводи: банан, спортивний напій, виноград</li>
            <li>Якісний білок: протеїновий коктейль, молоко, йогурт</li>
          </ul>
        `;
      } else if (intensity === 'moderate') {
        nutritionHTML = `
          <h5>Харчування для помірного бігового тренування</h5>
          <p><strong>До тренування (за 1-2 години):</strong></p>
          <ul>
            <li>Легкий прийом їжі багатий на вуглеводи</li>
            <li>Банан, тост з медом, йогурт з фруктами</li>
          </ul>
          <p><strong>Під час тренування:</strong></p>
          <ul>
            <li>Вода за потребою</li>
          </ul>
          <p><strong>Після тренування:</strong></p>
          <ul>
            <li>Протягом 45-60 хвилин: вуглеводи та білки</li>
            <li>Смузі з фруктами та молоком/йогуртом</li>
            <li>Сендвіч з індичкою</li>
          </ul>
        `;
      } else { // easy
        nutritionHTML = `
          <h5>Харчування для легкого бігового тренування</h5>
          <p><strong>До тренування:</strong></p>
          <ul>
            <li>Легкий перекус за потреби</li>
            <li>Фрукт або невеликий йогурт</li>
          </ul>
          <p><strong>Під час тренування:</strong></p>
          <ul>
            <li>Вода за потребою</li>
          </ul>
          <p><strong>Після тренування:</strong></p>
          <ul>
            <li>Звичайний прийом їжі за розкладом</li>
            <li>Достатня кількість води для відновлення</li>
          </ul>
        `;
      }
      break;
      
    case 'strength':
      nutritionHTML = `
        <h5>Харчування для силового тренування</h5>
        <p><strong>До тренування (за 1-2 години):</strong></p>
        <ul>
          <li>Вуглеводи з середнім ГІ + якісний білок</li>
          <li>Каша з молоком та фруктами</li>
          <li>Тост з яйцем або індичкою</li>
        </ul>
        <p><strong>Під час тренування:</strong></p>
        <ul>
          <li>Вода або електролітний напій</li>
        </ul>
        <p><strong>Після тренування (протягом 30-60 хв):</strong></p>
        <ul>
          <li>Підвищена кількість білка: 20-30 г</li>
          <li>Протеїновий коктейль з бананом</li>
          <li>Куряча грудка з рисом</li>
          <li>Омлет з овочами та тостами</li>
        </ul>
      `;
      break;
      
    case 'bike':
      nutritionHTML = `
        <h5>Харчування для велосипедного тренування</h5>
        <p><strong>До тренування (за 1-3 години):</strong></p>
        <ul>
          <li>Складні вуглеводи + помірний білок</li>
          <li>Вівсянка з бананом та медом</li>
          <li>Паста з легким соусом</li>
        </ul>
        <p><strong>Під час тренування (якщо більше 60 хв):</strong></p>
        <ul>
          <li>60-90 г вуглеводів на годину</li>
          <li>Спортивні напої, банани, енергетичні батончики</li>
          <li>Регулярна гідратація</li>
        </ul>
        <p><strong>Після тренування:</strong></p>
        <ul>
          <li>Вуглеводи з високим ГІ + білок</li>
          <li>Шоколадне молоко</li>
          <li>Фруктовий смузі з протеїном</li>
          <li>Повноцінний прийом їжі протягом 2 годин після тренування</li>
        </ul>
      `;
      break;
      
    case 'rest':
      nutritionHTML = `
        <h5>Харчування в день відпочинку</h5>
        <p><strong>Загальні рекомендації:</strong></p>
        <ul>
          <li>Знижена кількість вуглеводів порівняно з тренувальними днями</li>
          <li>Достатня кількість білка для відновлення м'язів</li>
          <li>Збільшена кількість овочів та фруктів</li>
          <li>Корисні жири для підтримки гормонального балансу</li>
        </ul>
        <p><strong>Приклад раціону:</strong></p>
        <ul>
          <li>Сніданок: омлет з овочами, авокадо, тост з цільнозернового хліба</li>
          <li>Обід: салат з куркою гриль та горіхами, заправлений оливковою олією</li>
          <li>Вечеря: запечена риба з овочами та невеликою порцією кіноа</li>
          <li>Перекуси: йогурт, фрукти, горіхи</li>
        </ul>
      `;
      break;
      
    default:
      nutritionHTML = `
        <p>Специфічні рекомендації для цього типу тренування відсутні.</p>
      `;
  }
  
  // Add phase-specific recommendations
  let phaseRecommendations = '';
  switch (phase) {
    case 'base':
      phaseRecommendations = `
        <h5>Особливості харчування в базовий період</h5>
        <ul>
          <li>Збалансоване співвідношення макроелементів</li>
          <li>Фокус на створенні здорових харчових звичок</li>
          <li>Достатня кількість мікроелементів (особливо залізо, кальцій, вітаміни групи B)</li>
        </ul>
      `;
      break;
    case 'build':
      phaseRecommendations = `
        <h5>Особливості харчування в будівельний період</h5>
        <ul>
          <li>Підвищена кількість калорій для підтримки зростаючого навантаження</li>
          <li>Збільшення споживання вуглеводів перед складними тренуваннями</li>
          <li>Особлива увага відновленню після інтенсивних тренувань</li>
        </ul>
      `;
      break;
    case 'intense':
      phaseRecommendations = `
        <h5>Особливості харчування в інтенсивний період</h5>
        <ul>
          <li>Максимальне споживання вуглеводів у дні важких тренувань</li>
          <li>Планування періодизації вуглеводів (більше в дні важких тренувань)</li>
          <li>Підвищена увага до відновлення та якості харчування</li>
        </ul>
      `;
      break;
    case 'taper':
      phaseRecommendations = `
        <h5>Особливості харчування в період підводки</h5>
        <ul>
          <li>Поступове зниження калорійності з наближенням до змагань</li>
          <li>Підтримання високого споживання вуглеводів</li>
          <li>Вуглеводне завантаження за 2-3 дні до змагань</li>
          <li>Зменшення кількості клітковини перед змаганнями</li>
        </ul>
      `;
      break;
  }
  
  return `${nutritionHTML}${phaseRecommendations}${basicRecommendations}`;
}
let db, relays = {}, timers = {}, currentEditingTimerId = null;
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const IST_TIMEZONE = 'Asia/Kolkata';

// Show loading
function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

// Hide loading
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

// Update current time display
function updateCurrentTime() {
  const now = moment().tz(IST_TIMEZONE);
  document.getElementById('currentTime').textContent = now.format('DD/MM/YYYY HH:mm:ss');
}

// Initialize app
window.onload = function() {
  const savedConfig = localStorage.getItem('firebaseConfig');
  if (savedConfig) {
    const { apiKey, databaseURL } = JSON.parse(savedConfig);
    document.getElementById('apiKey').value = apiKey;
    document.getElementById('databaseURL').value = databaseURL;
    initializeFirebase(apiKey, databaseURL);
  }
  
  // Update time every second
  setInterval(updateCurrentTime, 1000);
  updateCurrentTime();
};

// Initialize Firebase
function initializeFirebase(apiKey, databaseURL) {
  showLoading();
  try {
    // Clear existing Firebase app if any
    if (firebase.apps.length > 0) {
      firebase.apps.forEach(app => app.delete());
    }
    
    const firebaseConfig = { apiKey, databaseURL };
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    
    document.getElementById('instructionsSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'none';
    document.getElementById('relaysSection').style.display = 'block';
    document.getElementById('timersSection').style.display = 'block';
    
    loadData();
    startTimerScheduler();
    hideLoading();
  } catch (error) {
    hideLoading();
    alert('Firebase connection failed: ' + error.message);
  }
}

// Handle config form submission
document.getElementById('configForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const apiKey = document.getElementById('apiKey').value;
  const databaseURL = document.getElementById('databaseURL').value;
  if (!apiKey || !databaseURL) {
    alert('Please provide both API Key and Database URL.');
    return;
  }
  localStorage.setItem('firebaseConfig', JSON.stringify({ apiKey, databaseURL }));
  initializeFirebase(apiKey, databaseURL);
});

// Load data from Firebase
function loadData() {
  if (!db) return;
  
  db.ref('relays').on('value', (snapshot) => {
    relays = snapshot.val() || {};
    renderRelays();
    updateTimerFormRelays();
  });
  
  db.ref('timers').on('value', (snapshot) => {
    timers = snapshot.val() || {};
    renderTimers();
  });
}

// Render relays
function renderRelays() {
  const container = document.getElementById('relaysContainer');
  container.innerHTML = '';

  if (!relays || Object.keys(relays).length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-plug"></i>
        <p>No relays found in your database</p>
      </div>
    `;
    return;
  }

  Object.entries(relays).forEach(([relay, state]) => {
    if (!relay || typeof relay !== 'string' || relay === 'undefined' || relay.trim() === '' || typeof state !== 'boolean') {
      console.warn(`Skipping invalid relay entry: ${relay}`);
      return; // Skip invalid entries
    }

    const div = document.createElement('div');
    div.className = `relay-card ${state ? 'on' : 'off'}`;
    div.innerHTML = `
      <h3><i class="fas fa-toggle-${state ? 'on' : 'off'}"></i> ${relay}</h3>
      <div class="status ${state ? 'on' : 'off'}">
        <i class="fas fa-circle"></i> ${state ? 'ON' : 'OFF'}
      </div>
      <div style="margin-top: 15px;">
        <button class="btn ${state ? 'btn-success' : 'btn-primary'}" onclick="toggleRelay('${relay}', true)">
          <i class="fas fa-power-off"></i> ON
        </button>
        <button class="btn ${!state ? 'btn-danger' : 'btn-primary'}" onclick="toggleRelay('${relay}', false)">
          <i class="fas fa-power-off"></i> OFF
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Render timers
function renderTimers() {
  const container = document.getElementById('timersContainer');
  container.innerHTML = '';

  if (!timers || Object.keys(timers).length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clock"></i>
        <p>No timers configured</p>
      </div>
    `;
    return;
  }

  Object.entries(timers).forEach(([id, timer]) => {
    if (!timer || !timer.relay || typeof timer.relay !== 'string' || timer.relay === 'undefined' || timer.relay.trim() === '') {
      console.warn(`Skipping invalid timer entry: ${id}`);
      return; // Skip invalid timer entries
    }

    const activeDays = timer.days
      ? timer.days
          .map((active, index) => (active ? dayNames[index] : null))
          .filter(Boolean)
          .join(', ')
      : 'None';

    const div = document.createElement('div');
    div.className = `timer-card ${timer.active ? 'active' : 'inactive'}`;
    div.innerHTML = `
      <h4><i class="fas fa-toggle-on"></i> ${timer.relay} - ${timer.action}</h4>
      <p><i class="fas fa-clock"></i> ${timer.startTime}${timer.endTime ? ' to ' + timer.endTime : ''}</p>
      <p><i class="fas fa-calendar-alt"></i> ${activeDays}</p>
      <div style="margin-top: 15px;">
        <button class="btn btn-edit" onclick="editTimer('${id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger" onclick="deleteTimer('${id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Update timer form relays
function updateTimerFormRelays() {
  const select = document.getElementById('timerRelay');
  select.innerHTML = '<option value="">Choose a relay...</option>';
  Object.keys(relays).forEach(relay => {
    if (!relay || typeof relay !== 'string' || relay === 'undefined' || relay.trim() === '') {
      console.warn(`Skipping invalid relay in form: ${relay}`);
      return; // Skip invalid relay names
    }
    const option = document.createElement('option');
    option.value = relay;
    option.textContent = relay;
    select.appendChild(option);
  });
}

// Toggle relay
function toggleRelay(relay, state) {
  if (!relay || typeof relay !== 'string' || relay === 'undefined' || relay.trim() === '') {
    console.error(`Invalid relay name: ${relay}`);
    alert('Cannot toggle relay: Invalid relay name.');
    return;
  }
  showLoading();
  db.ref(`relays/${relay}`).set(state)
    .then(() => hideLoading())
    .catch(error => {
      hideLoading();
      alert('Error updating relay: ' + error.message);
    });
}

// Timer modal functions
function openTimerModal() {
  currentEditingTimerId = null;
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-clock"></i> Add New Timer';
  document.getElementById('timerForm').reset();
  resetDayCheckboxes();
  document.getElementById('timerModal').style.display = 'block';
}

function closeTimerModal() {
  document.getElementById('timerModal').style.display = 'none';
  currentEditingTimerId = null;
}

function toggleDay(dayIndex) {
  const checkbox = document.getElementById('day' + dayIndex);
  const dayBox = checkbox.parentElement;
  checkbox.checked = !checkbox.checked;
  dayBox.classList.toggle('active', checkbox.checked);
}

function resetDayCheckboxes() {
  for (let i = 0; i < 7; i++) {
    const checkbox = document.getElementById('day' + i);
    const dayBox = checkbox.parentElement;
    checkbox.checked = false;
    dayBox.classList.remove('active');
  }
}

// Edit timer
function editTimer(timerId) {
  const timer = timers[timerId];
  if (timer) {
    currentEditingTimerId = timerId;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Timer';
    document.getElementById('timerRelay').value = timer.relay || '';
    document.getElementById('timerAction').value = timer.action || '';
    document.getElementById('timerStartTime').value = timer.startTime || '';
    document.getElementById('timerEndTime').value = timer.endTime || '';
    
    resetDayCheckboxes();
    if (timer.days) {
      timer.days.forEach((active, index) => {
        if (active) {
          const checkbox = document.getElementById('day' + index);
          const dayBox = checkbox.parentElement;
          checkbox.checked = true;
          dayBox.classList.add('active');
        }
      });
    }
    document.getElementById('timerModal').style.display = 'block';
  }
}

// Delete timer
function deleteTimer(timerId) {
  if (confirm('Are you sure you want to delete this timer?')) {
    showLoading();
    db.ref(`timers/${timerId}`).remove()
      .then(() => {
        hideLoading();
        renderTimers();
      })
      .catch(error => {
        hideLoading();
        alert('Error deleting timer: ' + error.message);
      });
  }
}

// Update relay state based on timer schedule
function updateRelayForTimer(timer) {
  if (!timer || !timer.active || !timer.relay || !timer.startTime || !timer.days || timer.relay === 'undefined' || timer.relay.trim() === '' || !relays[timer.relay]) {
    console.warn(`Skipping relay update for invalid timer or relay: ${JSON.stringify(timer)}`);
    return;
  }

  const now = moment().tz(IST_TIMEZONE);
  const currentDay = (now.day() + 6) % 7; // Convert to Monday=0, Sunday=6

  // Check if the timer is active on the current day
  if (!timer.days[currentDay]) return;

  const startTime = moment.tz(`${now.format('YYYY-MM-DD')} ${timer.startTime}`, 'YYYY-MM-DD HH:mm', IST_TIMEZONE);
  const endTime = timer.endTime ? 
    moment.tz(`${now.format('YYYY-MM-DD')} ${timer.endTime}`, 'YYYY-MM-DD HH:mm', IST_TIMEZONE) : null;

  if (endTime && endTime.isBefore(startTime)) {
    endTime.add(1, 'day');
  }

  showLoading();
  // Update relay: ON if within active period, OFF if past endTime
  if (now.isSameOrAfter(startTime) && (!endTime || now.isBefore(endTime))) {
    console.log(`Immediate: Setting relay ${timer.relay} to ${timer.action} at ${now.format('HH:mm:ss')}`);
    db.ref(`relays/${timer.relay}`).set(timer.action === 'ON')
      .then(() => hideLoading())
      .catch(error => {
        hideLoading();
        alert('Error updating relay for timer: ' + error.message);
      });
  } else if (endTime && now.isSameOrAfter(endTime)) {
    console.log(`Immediate: Setting relay ${timer.relay} to OFF at ${now.format('HH:mm:ss')}`);
    db.ref(`relays/${timer.relay}`).set(false)
      .then(() => hideLoading())
      .catch(error => {
        hideLoading();
        alert('Error updating relay for timer: ' + error.message);
      });
  } else {
    hideLoading();
  }
}

// Handle timer form submission
document.getElementById('timerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  showLoading();
  
  const relay = document.getElementById('timerRelay').value;
  const action = document.getElementById('timerAction').value;
  const startTime = document.getElementById('timerStartTime').value;
  const endTime = document.getElementById('timerEndTime').value;

  // Validate inputs
  if (!relay || relay === 'undefined' || relay.trim() === '' || !action || !startTime || !relays[relay]) {
    hideLoading();
    alert('Please select a valid relay, action, and start time.');
    return;
  }

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(document.getElementById('day' + i).checked);
  }
  
  // Ensure at least one day is selected
  if (!days.some(day => day)) {
    hideLoading();
    alert('Please select at least one day for the timer.');
    return;
  }

  const timerData = {
    relay,
    action,
    startTime,
    endTime: endTime || null,
    days,
    active: true
  };
  
  const refPath = currentEditingTimerId ? 
    `timers/${currentEditingTimerId}` : 
    `timers/${db.ref('timers').push().key}`;
  
  db.ref(refPath).set(timerData)
    .then(() => {
      // Update relay state immediately if timer is active now
      updateRelayForTimer(timerData);
      hideLoading();
      closeTimerModal();
      renderTimers();
    })
    .catch(error => {
      hideLoading();
      alert('Error saving timer: ' + error.message);
    });
});

// Credentials modal functions
function showCredentialsModal() {
  const savedConfig = localStorage.getItem('firebaseConfig');
  if (savedConfig) {
    const { apiKey, databaseURL } = JSON.parse(savedConfig);
    document.getElementById('newApiKey').value = apiKey;
    document.getElementById('newDatabaseURL').value = databaseURL;
  }
  document.getElementById('credentialsModal').style.display = 'block';
}

function closeCredentialsModal() {
  document.getElementById('credentialsModal').style.display = 'none';
}

// Handle credentials form submission
document.getElementById('credentialsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const apiKey = document.getElementById('newApiKey').value;
  const databaseURL = document.getElementById('newDatabaseURL').value;
  
  if (!apiKey || !databaseURL) {
    alert('Please provide both API Key and Database URL.');
    return;
  }
  
  localStorage.setItem('firebaseConfig', JSON.stringify({ apiKey, databaseURL }));
  closeCredentialsModal();
  
  // Show sections again for reconnection
  document.getElementById('instructionsSection').style.display = 'block';
  document.getElementById('configSection').style.display = 'block';
  document.getElementById('relaysSection').style.display = 'none';
  document.getElementById('timersSection').style.display = 'none';
  
  // Update form fields
  document.getElementById('apiKey').value = apiKey;
  document.getElementById('databaseURL').value = databaseURL;
  
  alert('Credentials updated! Please reconnect to Firebase.');
});

// Close modals when clicking outside
window.onclick = function(event) {
  const timerModal = document.getElementById('timerModal');
  const credentialsModal = document.getElementById('credentialsModal');
  
  if (event.target === timerModal) {
    closeTimerModal();
  }
  if (event.target === credentialsModal) {
    closeCredentialsModal();
  }
};

// Timer scheduler with IST timezone
function startTimerScheduler() {
  setInterval(() => {
    if (!db) return;
    
    const now = moment().tz(IST_TIMEZONE);
    const currentDay = (now.day() + 6) % 7; // Convert to Monday=0, Sunday=6
    let nextTimer = null;
    let nextTimerDate = null;

    // Check current timers
    Object.entries(timers).forEach(([id, timer]) => {
      if (!timer || !timer.active || !timer.days || !timer.days[currentDay] || !timer.relay || !timer.startTime || timer.relay === 'undefined' || !relays[timer.relay]) {
        console.warn(`Skipping invalid timer in scheduler: ${id}`);
        return;
      }

      const startTime = moment.tz(`${now.format('YYYY-MM-DD')} ${timer.startTime}`, 'YYYY-MM-DD HH:mm', IST_TIMEZONE);
      const endTime = timer.endTime ? 
        moment.tz(`${now.format('YYYY-MM-DD')} ${timer.endTime}`, 'YYYY-MM-DD HH:mm', IST_TIMEZONE) : null;
      
      if (endTime && endTime.isBefore(startTime)) {
        endTime.add(1, 'day');
      }

      // Execute timer: ON if within active period, OFF if past endTime
      if (now.isSameOrAfter(startTime) && (!endTime || now.isBefore(endTime))) {
        console.log(`Scheduler: Setting relay ${timer.relay} to ${timer.action} at ${now.format('HH:mm:ss')}`);
        db.ref(`relays/${timer.relay}`).set(timer.action === 'ON');
      } else if (endTime && now.isSameOrAfter(endTime)) {
        console.log(`Scheduler: Setting relay ${timer.relay} to OFF at ${now.format('HH:mm:ss')}`);
        db.ref(`relays/${timer.relay}`).set(false);
      }
    });

    // Find next timer
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = moment(now).add(dayOffset, 'days');
      const checkDay = (checkDate.day() + 6) % 7;
      
      Object.entries(timers).forEach(([id, timer]) => {
        if (!timer || !timer.active || !timer.days || !timer.days[checkDay] || !timer.relay || !timer.startTime || timer.relay === 'undefined' || !relays[timer.relay]) {
          console.warn(`Skipping invalid timer in next timer calculation: ${id}`);
          return;
        }

        const startTime = moment.tz(`${checkDate.format('YYYY-MM-DD')} ${timer.startTime}`, 'YYYY-MM-DD HH:mm', IST_TIMEZONE);
        
        if (dayOffset === 0 && startTime.isSameOrBefore(now)) return;
        
        if (!nextTimer || startTime.isBefore(nextTimerDate)) {
          nextTimer = timer;
          nextTimerDate = startTime;
        }
      });
      
      if (nextTimer) break;
    }

    // Update next timer display
    const nextTimerEl = document.getElementById('nextTimer');
    if (nextTimer && nextTimerDate) {
      const timeUntil = nextTimerDate.fromNow();
      nextTimerEl.innerHTML = `
        <i class="fas fa-clock"></i> 
        <strong>Next Timer:</strong> ${nextTimer.relay} will turn 
        <strong>${nextTimer.action}</strong> at 
        <strong>${nextTimerDate.format('DD/MM/YYYY HH:mm')}</strong> 
        (${timeUntil})
      `;
    } else {
      nextTimerEl.innerHTML = `
        <i class="fas fa-info-circle"></i> 
        No upcoming timers scheduled
      `;
    }
  }, 30000); // Check every 30 seconds
}
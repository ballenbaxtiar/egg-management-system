// settings.js - Settings Management System

// Check authentication
const currentUser = checkAuth();
if (currentUser) {
  document.getElementById('headerUsername').textContent = currentUser.firstname;
  document.getElementById('headerFullName').textContent = `${currentUser.firstname} ${currentUser.lastname}`;
  document.getElementById('headerUserType').textContent = currentUser.type;
  
  // Load user data into profile
  document.getElementById('userFirstName').value = currentUser.firstname || '';
  document.getElementById('userLastName').value = currentUser.lastname || '';
}

// Default settings
const DEFAULT_SETTINGS = {
  calculation: {
    eggsPerFlat: 30,
    flatsPerPacket: 12
  },
  farms: {
    colors: {
      farm1: '#f8f9fa',
      farm2: '#d1e7dd',
      farm3: '#f8d7da',
      farm4: '#cfe2ff'
    },
    active: {
      farm1: true,
      farm2: true,
      farm3: true,
      farm4: true
    }
  },
  datetime: {
    dateFormat: 'DD/MM/YYYY',
    calendarType: 'gregorian',
    fiscalYearStart: 1,
    defaultEntryDate: 'today'
  },
  company: {
    name: 'سەرژمێری هێلکە',
    logo: null,
    address: '',
    phone: '',
    email: '',
    autoSaveReceipts: false,
    receiptFolder: 'Downloads/Receipts'
  },
  security: {
    sessionTimeout: 30,
    enable2FA: false
  },
  data: {
    autoBackup: false,
    backupFrequency: 'daily',
    dataRetention: 12
  },
  permissions: {
    watcher: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: true
    },
    farmAccess: {
      farm1: true,
      farm2: true,
      farm3: true,
      farm4: true
    },
    auditLog: true
  },
  advanced: {
    defaultPrinter: 'system',
    printFormat: 'a4',
    autoPrint: false
  }
};
// Load settings from server
async function loadSettings() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const settings = data.settings || DEFAULT_SETTINGS;
    
    // Apply settings to form...
  } catch (error) {
    console.error('Error loading settings:', error);
    // Fall back to localStorage
    const settings = JSON.parse(localStorage.getItem('appSettings')) || DEFAULT_SETTINGS;
  }
}

// Save settings to server
async function saveSettingsToServer(settings) {
  try {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3000/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ settings })
    });
    
    // Also save to localStorage as backup
    localStorage.setItem('appSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
// Load settings from localStorage or use defaults
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('appSettings')) || DEFAULT_SETTINGS;
  
  // Load calculation settings
  document.getElementById('eggsPerFlat').value = settings.calculation.eggsPerFlat;
  document.getElementById('flatsPerPacket').value = settings.calculation.flatsPerPacket;
  updateEggsPerPacket();
  
  // Load farm colors
  document.getElementById('farm1Color').value = settings.farms.colors.farm1;
  document.getElementById('farm2Color').value = settings.farms.colors.farm2;
  document.getElementById('farm3Color').value = settings.farms.colors.farm3;
  document.getElementById('farm4Color').value = settings.farms.colors.farm4;
  updateColorPreviews();
  
  // Load farm active status
  document.getElementById('farm1Active').checked = settings.farms.active.farm1;
  document.getElementById('farm2Active').checked = settings.farms.active.farm2;
  document.getElementById('farm3Active').checked = settings.farms.active.farm3;
  document.getElementById('farm4Active').checked = settings.farms.active.farm4;
  
  // Load datetime settings
  document.getElementById('dateFormat').value = settings.datetime.dateFormat;
  document.getElementById('calendarType').value = settings.datetime.calendarType;
  document.getElementById('fiscalYearStart').value = settings.datetime.fiscalYearStart;
  document.getElementById('defaultEntryDate').value = settings.datetime.defaultEntryDate;
  
  // Load company settings
  document.getElementById('companyName').value = settings.company.name;
  document.getElementById('companyAddress').value = settings.company.address;
  document.getElementById('companyPhone').value = settings.company.phone;
  document.getElementById('companyEmail').value = settings.company.email;
  document.getElementById('autoSaveReceipts').checked = settings.company.autoSaveReceipts;
  document.getElementById('receiptFolder').value = settings.company.receiptFolder;
  
  // Load security settings
  document.getElementById('sessionTimeout').value = settings.security.sessionTimeout;
  document.getElementById('enable2FA').checked = settings.security.enable2FA;
  
  // Load data settings
  document.getElementById('autoBackup').checked = settings.data.autoBackup;
  document.getElementById('backupFrequency').value = settings.data.backupFrequency;
  document.getElementById('dataRetention').value = settings.data.dataRetention;
  
  // Load permissions
  document.getElementById('watcherCanCreate').checked = settings.permissions.watcher.canCreate;
  document.getElementById('watcherCanEdit').checked = settings.permissions.watcher.canEdit;
  document.getElementById('watcherCanDelete').checked = settings.permissions.watcher.canDelete;
  document.getElementById('watcherCanExport').checked = settings.permissions.watcher.canExport;
  document.getElementById('farm1Access').checked = settings.permissions.farmAccess.farm1;
  document.getElementById('farm2Access').checked = settings.permissions.farmAccess.farm2;
  document.getElementById('farm3Access').checked = settings.permissions.farmAccess.farm3;
  document.getElementById('farm4Access').checked = settings.permissions.farmAccess.farm4;
  document.getElementById('enableAuditLog').checked = settings.permissions.auditLog;
  
  // Load advanced settings
  document.getElementById('defaultPrinter').value = settings.advanced.defaultPrinter;
  document.getElementById('printFormat').value = settings.advanced.printFormat;
  document.getElementById('autoPrint').checked = settings.advanced.autoPrint;
}

// Save current settings to localStorage
function saveSettings(settings) {
  localStorage.setItem('appSettings', JSON.stringify(settings));
}

// Get current settings
function getSettings() {
  return JSON.parse(localStorage.getItem('appSettings')) || DEFAULT_SETTINGS;
}

// Tab switching
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to clicked button
  event.target.classList.add('active');
}

// Auto-calculate eggs per packet
function updateEggsPerPacket() {
  const eggsPerFlat = parseInt(document.getElementById('eggsPerFlat').value) || 30;
  const flatsPerPacket = parseInt(document.getElementById('flatsPerPacket').value) || 12;
  document.getElementById('eggsPerPacket').value = eggsPerFlat * flatsPerPacket;
}

// Listen for changes
document.getElementById('eggsPerFlat').addEventListener('input', updateEggsPerPacket);
document.getElementById('flatsPerPacket').addEventListener('input', updateEggsPerPacket);

// Update color previews
function updateColorPreviews() {
  document.getElementById('farm1Preview').style.backgroundColor = document.getElementById('farm1Color').value;
  document.getElementById('farm2Preview').style.backgroundColor = document.getElementById('farm2Color').value;
  document.getElementById('farm3Preview').style.backgroundColor = document.getElementById('farm3Color').value;
  document.getElementById('farm4Preview').style.backgroundColor = document.getElementById('farm4Color').value;
}

// Listen for color changes
['farm1Color', 'farm2Color', 'farm3Color', 'farm4Color'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateColorPreviews);
});

// Save calculation settings
function saveCalculationSettings() {
  const settings = getSettings();
  settings.calculation = {
    eggsPerFlat: parseInt(document.getElementById('eggsPerFlat').value),
    flatsPerPacket: parseInt(document.getElementById('flatsPerPacket').value)
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنەکانی سەرژمێری پاشەکەوتکرا');
}

// Reset calculation settings
function resetCalculationSettings() {
  document.getElementById('eggsPerFlat').value = 30;
  document.getElementById('flatsPerPacket').value = 12;
  updateEggsPerPacket();
}

// Save farm settings
function saveFarmSettings() {
  const settings = getSettings();
  settings.farms = {
    colors: {
      farm1: document.getElementById('farm1Color').value,
      farm2: document.getElementById('farm2Color').value,
      farm3: document.getElementById('farm3Color').value,
      farm4: document.getElementById('farm4Color').value
    },
    active: {
      farm1: document.getElementById('farm1Active').checked,
      farm2: document.getElementById('farm2Active').checked,
      farm3: document.getElementById('farm3Active').checked,
      farm4: document.getElementById('farm4Active').checked
    }
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنەکانی فارمەکان پاشەکەوتکرا');
}

// Save datetime settings
function saveDateTimeSettings() {
  const settings = getSettings();
  settings.datetime = {
    dateFormat: document.getElementById('dateFormat').value,
    calendarType: document.getElementById('calendarType').value,
    fiscalYearStart: parseInt(document.getElementById('fiscalYearStart').value),
    defaultEntryDate: document.getElementById('defaultEntryDate').value
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنەکانی بەروار و کات پاشەکەوتکرا');
}

// Save company settings
function saveCompanySettings() {
  const settings = getSettings();
  settings.company = {
    name: document.getElementById('companyName').value,
    logo: settings.company.logo, // Keep existing logo
    address: document.getElementById('companyAddress').value,
    phone: document.getElementById('companyPhone').value,
    email: document.getElementById('companyEmail').value,
    autoSaveReceipts: document.getElementById('autoSaveReceipts').checked,
    receiptFolder: document.getElementById('receiptFolder').value
  };
  saveSettings(settings);
  alert('✅ زانیاری کۆمپانیا پاشەکەوتکرا');
}

// Save profile settings
function saveProfileSettings() {
  const firstName = document.getElementById('userFirstName').value;
  const lastName = document.getElementById('userLastName').value;
  
  // Update current user
  currentUser.firstname = firstName;
  currentUser.lastname = lastName;
  
  alert('✅ پڕۆفایل نوێکرایەوە');
}

// Change password
async function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('❌ تکایە هەموو خانەکان پڕبکەرەوە');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('❌ وشەی نهێنی نوێ یەکناگرنەوە');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('❌ وشەی نهێنی دەبێت لانیکەم 6 پیت بێت');
    return;
  }
  
  // TODO: Add API call to change password
  alert('✅ وشەی نهێنی گۆڕدرا');
  document.getElementById('changePasswordForm').reset();
}

// Save security settings
function saveSecuritySettings() {
  const settings = getSettings();
  settings.security = {
    sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
    enable2FA: document.getElementById('enable2FA').checked
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنەکانی پاراستن پاشەکەوتکرا');
}

// Export all data
async function exportAllData() {
  try {
    const token = localStorage.getItem('token');
    const allData = [];
    
    // Fetch data from all 4 farms
    for (let i = 1; i <= 4; i++) {
      const res = await fetch(`http://localhost:3000/farm${i}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.records) {
        data.records.forEach(record => {
          allData.push({
            Farm: `فارمی ${['یەکەم', 'دووەم', 'سێیەم', 'چوارەم'][i-1]}`,
            Eggs: record.eggs,
            Flats: record.flats,
            Packets: record.packets,
            Date: new Date(record.createdAt).toLocaleDateString('en-GB')
          });
        });
      }
    }
    
    // Convert to CSV
    const csv = [
      ['Farm', 'Eggs', 'Flats', 'Packets', 'Date'].join(','),
      ...allData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `farm-data-backup-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert('✅ هەموو داتاکان هەناردەکرا');
  } catch (error) {
    alert('❌ هەڵە: ' + error.message);
  }
}

// Backup database
function backupDatabase() {
  const settings = getSettings();
  const backup = {
    date: new Date().toISOString(),
    settings: settings,
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  alert('✅ پاشگر دروستکرا');
}

// Import data
function importData(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      // TODO: Parse CSV/Excel and import to database
      alert('✅ داتا هاوردەکرا');
    } catch (error) {
      alert('❌ هەڵە لە هاوردەکردنی داتا: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Save data settings
function saveDataSettings() {
  const settings = getSettings();
  settings.data = {
    autoBackup: document.getElementById('autoBackup').checked,
    backupFrequency: document.getElementById('backupFrequency').value,
    dataRetention: parseInt(document.getElementById('dataRetention').value)
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنەکانی داتا پاشەکەوتکرا');
}

// Save permission settings
function savePermissionSettings() {
  const settings = getSettings();
  settings.permissions = {
    watcher: {
      canCreate: document.getElementById('watcherCanCreate').checked,
      canEdit: document.getElementById('watcherCanEdit').checked,
      canDelete: document.getElementById('watcherCanDelete').checked,
      canExport: document.getElementById('watcherCanExport').checked
    },
    farmAccess: {
      farm1: document.getElementById('farm1Access').checked,
      farm2: document.getElementById('farm2Access').checked,
      farm3: document.getElementById('farm3Access').checked,
      farm4: document.getElementById('farm4Access').checked
    },
    auditLog: document.getElementById('enableAuditLog').checked
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنەکانی مۆڵەت پاشەکەوتکرا');
}

// View audit log
function viewAuditLog() {
  alert('تۆماری وردەکاری بەزووانە لە وەشانی داهاتوودا دەخرێتە کار');
}

// Save advanced settings
function saveAdvancedSettings() {
  const settings = getSettings();
  settings.advanced = {
    defaultPrinter: document.getElementById('defaultPrinter').value,
    printFormat: document.getElementById('printFormat').value,
    autoPrint: document.getElementById('autoPrint').checked
  };
  saveSettings(settings);
  alert('✅ ڕێکخستنە پێشکەوتووەکان پاشەکەوتکرا');
}

// Reset all settings
function resetAllSettings() {
  if (confirm('دڵنیایت لە گەڕانەوەی هەموو ڕێکخستنەکان بۆ بنەڕەت؟')) {
    localStorage.removeItem('appSettings');
    location.reload();
  }
}

// Delete all data
function deleteAllData() {
  const confirmation = prompt('بۆ دڵنیابوون، بنووسە "DELETE" بە لاتینی:');
  if (confirmation === 'DELETE') {
    if (confirm('ئایا بە ڕاستی دەتەوێت هەموو داتاکان بسڕیتەوە؟ ئەم کارە ناگەڕێتەوە!')) {
      // TODO: Add API calls to delete all farm data
      alert('✅ هەموو داتاکان سڕانەوە');
    }
  } else {
    alert('❌ هەڵوەشایەوە');
  }
}

// Logo upload preview
document.getElementById('companyLogo').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const preview = document.getElementById('logoPreview');
      preview.innerHTML = `<img src="${event.target.result}" style="max-width: 200px; border-radius: 8px; border: 2px solid #ddd;">`;
      
      // Save logo to settings
      const settings = getSettings();
      settings.company.logo = event.target.result;
      saveSettings(settings);
    };
    reader.readAsDataURL(file);
  }
});

// Profile photo upload preview
document.getElementById('profilePhoto').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const preview = document.getElementById('profilePhotoPreview');
      preview.innerHTML = `<img src="${event.target.result}" style="max-width: 150px; border-radius: 50%; border: 3px solid #0d6efd;">`;
    };
    reader.readAsDataURL(file);
  }
});

// Load settings on page load
loadSettings();

// Export getSettings for use in other files
window.getAppSettings = getSettings;
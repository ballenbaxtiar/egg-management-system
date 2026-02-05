// auth.js - UPDATED VERSION

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || !user.username) {
    window.location.href = '/login.html';
    return null;
  }
  
  return user;
}

function checkAdminAuth() {
  const user = checkAuth();
  if (!user) return null;
  
  if (user.type !== 'admin') {
    alert('دەستپێگەیشتنت نییە! تەنها ئەدمین دەتوانێت ئەم لاپەڕەیە ببینێت');
    window.location.href = '/login.html';
    return null;
  }
  
  return user;
}

function checkWatcherAuth() {
  const user = checkAuth();
  if (!user) return null;
  
  if (user.type !== 'watcher') {
    alert('دەستپێگەیشتنت نییە! تەنها لاوەکی دەتوانێت ئەم لاپەڕەیە ببینێت');
    window.location.href = '/login.html';
    return null;
  }
  
  return user;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
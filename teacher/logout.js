const App = {
  logout() {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('sal_token')
      }
    }).catch(() => {});

    localStorage.clear();
    window.location.href = '/login';
  }
};
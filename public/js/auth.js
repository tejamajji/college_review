// Create a JavaScript file named auth.js with this content
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Check if we're on a protected page
  const protectedPages = ['college.html']; // Add more protected pages as needed
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
    // If we're on a protected page and not authenticated, redirect to login
    if (!token || !user) {
      window.location.href = 'login.html';
      return false;
    }
  }
  
  return token && user;
}

// Function to update navigation based on authentication status
function updateNavigation() {
  const navbarMenu = document.querySelector('.navbar ul');
  const isAuthenticated = checkAuthentication();
  
  if (isAuthenticated) {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Create logout button
    const logoutItem = document.createElement('li');
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Logout';
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = 'login.html';
    });
    
    logoutItem.appendChild(logoutLink);
    
    // Replace login and register links with logout
    const loginItem = document.querySelector('a[href="login.html"]').parentNode;
    const registerItem = document.querySelector('a[href="register.html"]').parentNode;
    
    if (loginItem) navbarMenu.removeChild(loginItem);
    if (registerItem) navbarMenu.removeChild(registerItem);
    
    navbarMenu.appendChild(logoutItem);
    
    // Add welcome message
    const welcomeItem = document.createElement('li');
    const welcomeLink = document.createElement('a');
    welcomeLink.href = '#';
    welcomeLink.textContent = `Welcome, ${user.username}`;
    welcomeItem.appendChild(welcomeLink);
    navbarMenu.appendChild(welcomeItem);
  }
  
  // Add authentication check for Browse Colleges links
  const browseCollegeLinks = document.querySelectorAll('a[href="college.html"]');
  browseCollegeLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      // Check if user is logged in
      if (isAuthenticated) {
        // If logged in, proceed to college page
        window.location.href = "college.html";
      } else {
        // If not logged in, redirect to login page
        window.location.href = "login.html";
      }
    });
  });
}

// Run when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navbarMenu = document.querySelector('.navbar ul');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      navbarMenu.classList.toggle('active');
    });
  }
  
  // Update navigation based on auth status
  updateNavigation();
});
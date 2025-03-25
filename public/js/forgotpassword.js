document.addEventListener('DOMContentLoaded', function() {
  // Get all necessary elements
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');
  
  const emailForm = document.getElementById('emailForm');
  const otpForm = document.getElementById('otpForm');
  const passwordForm = document.getElementById('passwordForm');
  
  const emailError = document.getElementById('emailError');
  const otpError = document.getElementById('otpError');
  const passwordError = document.getElementById('passwordError');
  
  const resendBtn = document.getElementById('resendBtn');
  const countdownEl = document.getElementById('countdown');
  const backToEmail = document.getElementById('backToEmail');
  
  const otpInputs = document.querySelectorAll('.otp-input');
  
  let userEmail = '';
  let countdown;
  let timeLeft = 120; // 2 minutes
  
  // Handle email form submission
  emailForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      userEmail = email;
      
      if (!validateEmail(email)) {
          showError(emailError, 'Please enter a valid email address');
          return;
      }
      
      // Show loading state
      const submitBtn = emailForm.querySelector('button');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      try {
          // Send request to server to send OTP
          const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email })
          });
          
          const data = await response.json();
          
          if (response.ok) {
              // Move to OTP verification step
              switchStep(step1, step2);
              startCountdown();
              // Focus on first OTP input
              otpInputs[0].focus();
          } else {
              showError(emailError, data.message || 'Email not found');
          }
      } catch (error) {
          console.error('Error:', error);
          showError(emailError, 'An error occurred. Please try again.');
      } finally {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
      }
  });
  
  // Handle OTP form submission
  otpForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get OTP from inputs
      let otp = '';
      otpInputs.forEach(input => {
          otp += input.value;
      });
      
      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
          showError(otpError, 'Please enter a valid 6-digit code');
          return;
      }
      
      // Show loading state
      const submitBtn = otpForm.querySelector('button');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Verifying...';
      submitBtn.disabled = true;
      
      try {
          // Send request to verify OTP
          const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: userEmail, otp })
          });
          
          const data = await response.json();
          
          if (response.ok) {
              // Move to new password step
              switchStep(step2, step3);
              // Clear countdown
              clearInterval(countdown);
          } else {
              showError(otpError, data.message || 'Invalid verification code');
          }
      } catch (error) {
          console.error('Error:', error);
          showError(otpError, 'An error occurred. Please try again.');
      } finally {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
      }
  });
  
  // Handle password form submission
  passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Validate password
      if (newPassword.length < 6) {
          showError(passwordError, 'Password must be at least 6 characters');
          return;
      }
      
      if (newPassword !== confirmPassword) {
          showError(passwordError, 'Passwords do not match');
          return;
      }
      
      // Show loading state
      const submitBtn = passwordForm.querySelector('button');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Resetting...';
      submitBtn.disabled = true;
      
      try {
          // Send request to reset password
          const response = await fetch('http://localhost:3000/api/auth/reset-password', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: userEmail, password: newPassword })
          });
          
          const data = await response.json();
          
          if (response.ok) {
              // Show success message
              switchStep(step3, step4);
          } else {
              showError(passwordError, data.message || 'Failed to reset password');
          }
      } catch (error) {
          console.error('Error:', error);
          showError(passwordError, 'An error occurred. Please try again.');
      } finally {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
      }
  });
  
  // Handle OTP inputs
  otpInputs.forEach(function(input, index) {
      input.addEventListener('keyup', function(e) {
          // Move to next input if value is entered
          if (input.value && index < otpInputs.length - 1) {
              otpInputs[index + 1].focus();
          }
          
          // Handle backspace key
          if (e.key === 'Backspace' && !input.value && index > 0) {
              otpInputs[index - 1].focus();
          }
      });
      
      input.addEventListener('paste', function(e) {
          e.preventDefault();
          
          // Get pasted content
          const pastedText = (e.clipboardData || window.clipboardData).getData('text');
          
          if (/^\d+$/.test(pastedText) && pastedText.length <= 6) {
              // Fill OTP inputs with pasted digits
              for (let i = 0; i < Math.min(pastedText.length, otpInputs.length); i++) {
                  otpInputs[i].value = pastedText[i];
              }
              
              // Focus on next empty input or last input
              const nextEmptyIndex = Array.from(otpInputs).findIndex(inp => !inp.value);
              if (nextEmptyIndex !== -1) {
                  otpInputs[nextEmptyIndex].focus();
              } else {
                  otpInputs[otpInputs.length - 1].focus();
              }
          }
      });
  });
  
  // Handle resend OTP button
  resendBtn.addEventListener('click', async function() {
      if (!resendBtn.classList.contains('active')) {
          return;
      }
      
      resendBtn.textContent = 'Sending...';
      resendBtn.classList.remove('active');
      
      try {
          // Send request to resend OTP
          const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: userEmail })
          });
          
          const data = await response.json();
          
          if (response.ok) {
              // Reset countdown
              timeLeft = 120;
              startCountdown();
              // Clear OTP inputs
              otpInputs.forEach(input => {
                  input.value = '';
              });
              otpInputs[0].focus();
          } else {
              showError(otpError, data.message || 'Failed to resend code');
              resendBtn.textContent = 'Resend verification code';
              resendBtn.classList.add('active');
          }
      } catch (error) {
          console.error('Error:', error);
          showError(otpError, 'An error occurred. Please try again.');
          resendBtn.textContent = 'Resend verification code';
          resendBtn.classList.add('active');
      }
  });
  
  // Handle back to email button
  backToEmail.addEventListener('click', function(e) {
      e.preventDefault();
      
      switchStep(step2, step1);
      clearInterval(countdown);
      
      // Clear OTP inputs
      otpInputs.forEach(input => {
          input.value = '';
      });
  });
  
  // Start countdown timer
  function startCountdown() {
      // Reset timer
      timeLeft = 120;
      
      // Update countdown every second
      clearInterval(countdown);
      updateCountdown();
      
      countdown = setInterval(function() {
          timeLeft--;
          
          if (timeLeft <= 0) {
              clearInterval(countdown);
              resendBtn.classList.add('active');
              return;
          }
          
          updateCountdown();
      }, 1000);
  }
  
  // Update countdown display
  function updateCountdown() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      if (timeLeft <= 0) {
          countdownEl.textContent = '00:00';
          resendBtn.classList.add('active');
      } else {
          resendBtn.classList.remove('active');
      }
  }
  
  // Switch between steps
  function switchStep(currentStep, nextStep) {
      currentStep.classList.remove('active');
      nextStep.classList.add('active');
  }
  
  // Show error message
  function showError(element, message) {
      element.textContent = message;
      element.style.display = 'block';
      
      // Hide error after 5 seconds
      setTimeout(() => {
          element.style.display = 'none';
      }, 5000);
  }
  
  // Validate email format
  function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
  }
});
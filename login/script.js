document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleIcon = togglePasswordBtn.querySelector('i');
    const toast = document.getElementById('toast');
    const closeToast = toast.querySelector('.close-toast');

    // Email Regex Pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        if (type === 'text') {
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    });

    // Real-time Validation for Email
    emailInput.addEventListener('input', () => {
        validateEmail();
    });

    // Real-time Validation for Password
    passwordInput.addEventListener('input', () => {
        validatePassword();
    });

    // Submit handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate all fields before submission
        const isRoleValid = validateRole();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (isRoleValid && isEmailValid && isPasswordValid) {
            // Simulate API Call / Verification
            const btn = form.querySelector('.submit-btn');
            const btnText = btn.querySelector('span');
            const btnIcon = btn.querySelector('.fa-arrow-right');

            // Loading state
            btn.disabled = true;
            btnText.textContent = 'Verifying...';
            btnIcon.className = 'fa-solid fa-circle-notch fa-spin';

            setTimeout(() => {
                // Success state
                btn.disabled = false;
                btnText.textContent = 'Sign In';
                btnIcon.className = 'fa-solid fa-arrow-right';

                showToast();

                // Redirect based on role after showing toast briefly
                setTimeout(() => {
                    let destination = '../index.html'; // Default fallback
                    if (roleSelect.value === 'donor') {
                        destination = '../donor-dashboard/';
                    } else if (roleSelect.value === 'ngo') {
                        destination = '../ngo-dashboard/';
                    } else if (roleSelect.value === 'admin') {
                        destination = '../admin-dashboard/';
                    } else if (roleSelect.value === 'volunteer') {
                        destination = '../live-tracking/'; // Volunteer routing
                    }

                    window.location.href = destination;
                }, 1000); // Redirect 1s after login success

            }, 1500);
        } else {
            // Add shake animation if invalid
            const card = document.querySelector('.login-card');
            card.style.animation = 'none';
            card.offsetHeight; // trigger reflow
            card.style.animation = 'shake 0.5s ease-in-out';
        }
    });

    // Form element styles explicitly clearing error classes if valid or needed
    function validateRole() {
        if (!roleSelect.value) {
            const group = roleSelect.closest('.form-group');
            // We can add a red border to the select if needed, but HTML native 'required' catches it usually
            return false;
        }
        return true;
    }

    function validateEmail() {
        const emailValue = emailInput.value.trim();
        const group = emailInput.closest('.form-group');
        const errorMessage = document.getElementById('emailError');

        if (emailValue === '') {
            setErrorFor(group, errorMessage, 'Email cannot be blank');
            return false;
        } else if (!emailRegex.test(emailValue)) {
            setErrorFor(group, errorMessage, 'Not a valid email address');
            return false;
        } else {
            setSuccessFor(group);
            return true;
        }
    }

    function validatePassword() {
        const passwordValue = passwordInput.value.trim();
        const group = passwordInput.closest('.form-group');
        const errorMessage = document.getElementById('passwordError');

        if (passwordValue === '') {
            setErrorFor(group, errorMessage, 'Password cannot be blank');
            return false;
        } else if (passwordValue.length < 6) {
            setErrorFor(group, errorMessage, 'Password must be at least 6 characters');
            return false;
        } else {
            setSuccessFor(group);
            return true;
        }
    }

    function setErrorFor(group, errorElement, message) {
        group.classList.remove('valid');
        group.classList.add('error');
        errorElement.textContent = message;
    }

    function setSuccessFor(group) {
        group.classList.remove('error');
        group.classList.add('valid');
    }

    function clearValidationClasses() {
        const groups = form.querySelectorAll('.form-group');
        groups.forEach(g => {
            g.classList.remove('error', 'valid');
        });
    }

    // Toast functionality
    let toastTimer1, toastTimer2;
    function showToast() {
        toast.classList.remove('hidden');
        toast.classList.add('active');

        clearTimeout(toastTimer1);
        clearTimeout(toastTimer2);

        toastTimer1 = setTimeout(() => {
            toast.classList.remove('active');
            toast.classList.add('hidden');
        }, 3000);

        toastTimer2 = setTimeout(() => {
            // let progress bar jump back
        }, 3300);
    }

    closeToast.addEventListener('click', () => {
        toast.classList.remove('active');
        toast.classList.add('hidden');
        clearTimeout(toastTimer1);
        clearTimeout(toastTimer2);
    });

});

// Add keyframes for shake manually in JS for dynamically applied animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0%, 100% {transform: translateX(0);}
  10%, 30%, 50%, 70%, 90% {transform: translateX(-5px);}
  20%, 40%, 60%, 80% {transform: translateX(5px);}
}
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {

    // 1. Dynamic Form Fields based on Role Selection
    const roleRadios = document.querySelectorAll('input[name="userRole"]');
    const licenseFieldGroup = document.getElementById('licenseFieldGroup');
    const ngoIdFieldGroup = document.getElementById('ngoIdFieldGroup');
    const nameLabel = document.getElementById('nameLabel');
    const fullNameInput = document.getElementById('fullName');

    function updateDynamicFields(role) {
        // Reset dynamic fields
        licenseFieldGroup.style.display = 'none';
        ngoIdFieldGroup.style.display = 'none';

        // Animate field in
        const showField = (field) => {
            field.style.display = 'flex';
            field.style.animation = 'none';
            field.offsetHeight; // trigger reflow
            field.style.animation = 'slideDown 0.3s ease';
        };

        if (role === 'restaurant') {
            nameLabel.innerHTML = 'Restaurant / Business Name <span class="required">*</span>';
            fullNameInput.placeholder = "e.g. Oasis Meals";
            showField(licenseFieldGroup);

        } else if (role === 'ngo') {
            nameLabel.innerHTML = 'NGO / Charity Name <span class="required">*</span>';
            fullNameInput.placeholder = "e.g. Hope Shelter";
            showField(ngoIdFieldGroup);

        } else if (role === 'household') {
            nameLabel.innerHTML = 'House / Society Name <span class="required">*</span>';
            fullNameInput.placeholder = "e.g. Green Valley Apts";

        } else if (role === 'volunteer') {
            nameLabel.innerHTML = 'Full Name <span class="required">*</span>';
            fullNameInput.placeholder = "e.g. Alex Johnson";
        } else {
            nameLabel.innerHTML = 'Organization Name <span class="required">*</span>';
        }
    }

    roleRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateDynamicFields(e.target.value);
        });
    });

    // 2. Auto-Detect GPS Location (Simulated)
    const detectGpsBtn = document.getElementById('detectGpsBtn');
    const locationInput = document.getElementById('location');

    if (detectGpsBtn) {
        detectGpsBtn.addEventListener('click', () => {
            // Visual feedback
            const icon = detectGpsBtn.querySelector('i');
            icon.classList.remove('fa-location-crosshairs');
            icon.classList.add('fa-spinner', 'fa-spin');

            setTimeout(() => {
                locationInput.value = "123 Main St, Downtown Sector (Auto-detected)";
                // Reset icon
                icon.classList.remove('fa-spinner', 'fa-spin');
                icon.classList.add('fa-location-crosshairs');

                // Success visual
                locationInput.parentElement.classList.add('success');
                setTimeout(() => locationInput.parentElement.classList.remove('success'), 2000);
            }, 1000);
        });
    }

    // 3. Password Visibility Toggle
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent form submit if it was a button
            e.preventDefault();
            const input = e.currentTarget.previousElementSibling;
            const icon = e.currentTarget.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // 4. Password Strength Indicator
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            let strength = 0;

            if (val.length >= 8) strength += 25;
            if (val.match(/[A-Z]/)) strength += 25;
            if (val.match(/[0-9]/)) strength += 25;
            if (val.match(/[^A-Za-z0-9]/)) strength += 25;

            strengthBar.style.width = strength + '%';

            if (val.length === 0) {
                strengthBar.style.width = '0';
                strengthText.textContent = "Password strength";
                strengthBar.style.background = 'transparent';
            } else if (strength <= 25) {
                strengthBar.style.background = 'var(--error)';
                strengthText.textContent = "Weak - Add letters & numbers";
                strengthText.style.color = 'var(--error)';
            } else if (strength <= 50) {
                strengthBar.style.background = 'var(--warning)';
                strengthText.textContent = "Fair - Add uppercase or symbols";
                strengthText.style.color = 'var(--warning)';
            } else if (strength <= 75) {
                strengthBar.style.background = 'var(--brand-blue)';
                strengthText.textContent = "Good - Almost there";
                strengthText.style.color = 'var(--brand-blue)';
            } else {
                strengthBar.style.background = 'var(--success)';
                strengthText.textContent = "Strong - Great password!";
                strengthText.style.color = 'var(--success)';
            }
        });
    }

    // 5. Form Validation & Submission
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const termsCheck = document.getElementById('termsCheck');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValid = true;

            // Simple Password Match check
            if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.parentElement.classList.add('error');
                isValid = false;
            } else {
                confirmPasswordInput.parentElement.classList.remove('error');
            }

            // Simple terms check (already handled by HTML5 required, but just in case)
            if (!termsCheck.checked) {
                isValid = false;
            }

            if (isValid) {
                // Determine redirect path based on role
                const selectedRole = document.querySelector('input[name="userRole"]:checked').value;
                let redirectPath = '../donor-dashboard/index.html'; // Default

                if (selectedRole === 'ngo') {
                    redirectPath = '../ngo-dashboard/index.html';
                } else if (selectedRole === 'admin') {
                    redirectPath = '../admin-dashboard/index.html';
                } else if (selectedRole === 'volunteer') {
                    redirectPath = '../live-tracking/index.html';
                }

                // Show loading state on button
                const btnContent = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Setting up account...';
                submitBtn.style.pointerEvents = 'none';
                submitBtn.style.opacity = '0.9';

                // Simulate API call delay
                setTimeout(() => {
                    // Show success modal
                    successModal.style.display = 'flex';

                    // Redirect after 2s loading bar finishes
                    setTimeout(() => {
                        window.location.href = redirectPath;
                    }, 2000);

                }, 1500);
            }
        });

        // Clear confirm password error on input
        confirmPasswordInput.addEventListener('input', () => {
            confirmPasswordInput.parentElement.classList.remove('error');
        });
    }

});

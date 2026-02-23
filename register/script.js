document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('registerForm');
    const userTypeRadios = document.getElementsByName('userType');
    const idProofSection = document.getElementById('idProofSection');
    const idProofInput = document.getElementById('idProof');
    const fileWrapper = document.querySelector('.file-upload-wrapper');
    const fileNameDisplay = document.getElementById('fileName');

    const togglePasswordBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const toast = document.getElementById('toast');
    const submitBtn = document.getElementById('submitBtn');

    // --- Dynamic Fields Logic ---
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            // Show ID proof upload for NGO and Volunteer
            if (selectedType === 'ngo' || selectedType === 'volunteer') {
                idProofSection.classList.remove('hidden');
                // Ensure it takes height immediately for transition
                idProofSection.style.height = idProofSection.scrollHeight + "px";
                setTimeout(() => { idProofSection.style.height = "auto"; }, 400); // clear inline height after transition

                // Add required attribute dynamically if needed
                idProofInput.setAttribute('required', 'required');
            } else {
                idProofSection.style.height = idProofSection.scrollHeight + "px"; // set height before hiding for transition
                // slight delay to let browser calculate before shrinking
                setTimeout(() => {
                    idProofSection.style.height = "0px";
                    idProofSection.classList.add('hidden');
                }, 10);
                idProofInput.removeAttribute('required');

                // Clear validation if hidden
                clearValidation(idProofSection);
            }
        });
    });

    // --- File Upload UI Logic ---
    idProofInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
            fileWrapper.classList.add('has-file');

            // basic validation check for file
            setSuccessFor(idProofSection);
        } else {
            fileNameDisplay.textContent = 'Choose a file or drag it here';
            fileWrapper.classList.remove('has-file');
        }
    });

    // Handle Drag and Drop for file input UI
    fileWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileWrapper.style.borderColor = 'var(--primary)';
        fileWrapper.style.background = 'rgba(46, 125, 50, 0.05)';
    });

    fileWrapper.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileWrapper.style.borderColor = '';
        if (!fileWrapper.classList.contains('has-file')) {
            fileWrapper.style.background = '';
        }
    });

    fileWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        fileWrapper.style.borderColor = '';

        if (e.dataTransfer.files.length) {
            idProofInput.files = e.dataTransfer.files;
            // trigger change event manually
            const event = new Event('change');
            idProofInput.dispatchEvent(event);
        }
    });

    // --- Password Visibility Toggle ---
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    // --- GPS Location Simulation ---
    const getLocBtn = document.getElementById('getLocBtn');
    const locationInput = document.getElementById('location');

    getLocBtn.addEventListener('click', () => {
        const icon = getLocBtn.querySelector('i');
        icon.classList.replace('fa-crosshairs', 'fa-spinner');
        icon.classList.add('fa-spin');

        // Simulate GPS fetch
        setTimeout(() => {
            locationInput.value = "123 Tech Avenue, Silicon City, CA";
            icon.classList.remove('fa-spin');
            icon.classList.replace('fa-spinner', 'fa-crosshairs');

            // clear wrapper error if valid
            setSuccessFor(locationInput.closest('.form-group'));
        }, 1200);
    });

    // --- Form Validation & Submission ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (validateForm()) {
            simulateSubmission();
        } else {
            // Shake effect on error
            const card = document.querySelector('.register-card');
            card.style.animation = 'none';
            card.offsetHeight; // trigger reflow
            card.style.animation = 'shake 0.5s ease-in-out';
        }
    });

    function validateForm() {
        let isFormValid = true;

        // Name
        const nameInput = document.getElementById('fullName');
        if (nameInput.value.trim() === '') {
            setErrorFor(nameInput.closest('.form-group'), 'Name cannot be blank');
            isFormValid = false;
        } else {
            setSuccessFor(nameInput.closest('.form-group'));
        }

        // Email
        const emailInput = document.getElementById('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value.trim() === '') {
            setErrorFor(emailInput.closest('.form-group'), 'Email cannot be blank');
            isFormValid = false;
        } else if (!emailRegex.test(emailInput.value.trim())) {
            setErrorFor(emailInput.closest('.form-group'), 'Enter a valid email');
            isFormValid = false;
        } else {
            setSuccessFor(emailInput.closest('.form-group'));
        }

        // Passwords
        if (passwordInput.value.length < 8) {
            setErrorFor(passwordInput.closest('.form-group'), 'Password must be at least 8 characters');
            isFormValid = false;
        } else {
            setSuccessFor(passwordInput.closest('.form-group'));
        }

        if (confirmPasswordInput.value !== passwordInput.value || confirmPasswordInput.value === '') {
            setErrorFor(confirmPasswordInput.closest('.form-group'), 'Passwords do not match');
            isFormValid = false;
        } else {
            setSuccessFor(confirmPasswordInput.closest('.form-group'));
        }

        // File upload if visible
        if (!idProofSection.classList.contains('hidden')) {
            if (idProofInput.files.length === 0) {
                setErrorFor(idProofSection, 'Document is required for this role');
                isFormValid = false;
            } else {
                setSuccessFor(idProofSection);
            }
        }

        // Role Selection check 
        const selectedRole = document.querySelector('input[name="userType"]:checked');
        const rootSection = document.querySelector('.user-type-grid').parentElement;
        if (!selectedRole) {
            // Can add specific styling for grid if nothing selected, but required attribute handles basic prevention
            isFormValid = false;
        }

        return isFormValid;
    }

    function setErrorFor(group, message) {
        group.classList.add('error');
        const errorElement = group.querySelector('.error-message');
        if (errorElement) errorElement.textContent = message;
    }

    function setSuccessFor(group) {
        group.classList.remove('error');
    }

    function clearValidation(group) {
        group.classList.remove('error');
    }

    function simulateSubmission() {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnIcon = submitBtn.querySelector('.btn-icon');
        const loader = submitBtn.querySelector('.loader-icon');

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        btnText.textContent = 'Processing...';
        btnIcon.classList.add('hidden');
        loader.classList.remove('hidden');

        setTimeout(() => {
            // Restore btn state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            btnText.textContent = 'Create Account';
            btnIcon.classList.remove('hidden');
            loader.classList.add('hidden');

            showToast();
            form.reset();

            // reset file UI
            fileNameDisplay.textContent = 'Choose a file or drag it here';
            fileWrapper.classList.remove('has-file');

            // reset dynamic field
            idProofSection.classList.add('hidden');
            idProofSection.style.height = "0px";

        }, 2000);
    }

    function showToast() {
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
});

// Dynamic CSS for shake auth animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0%, 100% {transform: translateX(0);}
  10%, 30%, 50%, 70%, 90% {transform: translateX(-5px);}
  20%, 40%, 60%, 80% {transform: translateX(5px);}
}
`;
document.head.appendChild(style);

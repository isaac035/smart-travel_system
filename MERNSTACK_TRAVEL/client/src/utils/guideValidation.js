const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const SL_PREFIXES = /^(070|071|072|074|075|076|077|078)/;

export const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '');

export const validateName = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return 'Name is required';
  if (!NAME_REGEX.test(normalized)) return 'Name must contain only letters';
  if (normalized.length < 3) return 'Name must be at least 3 characters';
  return '';
};

export const validateEmail = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return 'Email is required';
  if (!EMAIL_REGEX.test(normalized)) return 'Please enter a valid email address';
  return '';
};

export const validatePhone = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return 'Phone is required';
  if (!/^\d+$/.test(normalized)) return 'Only numbers are allowed';
  if (!PHONE_REGEX.test(normalized)) return 'Phone number must be 10 digits';
  if (!SL_PREFIXES.test(normalized)) return 'Enter a valid Sri Lankan phone number';
  return '';
};

export const validatePassword = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return 'Password is required';
  if (normalized.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const validateNumber = (value, options = {}) => {
  const normalized = normalizeValue(String(value ?? ''));
  if (!normalized) return options.requiredMessage || 'This field is required';
  if (!/^\d+$/.test(normalized)) return options.invalidMessage || 'Enter a valid number';
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return options.invalidMessage || 'Enter a valid number';
  if (typeof options.min === 'number' && numeric < options.min) return options.rangeMessage || options.invalidMessage || 'Enter a valid number';
  if (typeof options.max === 'number' && numeric > options.max) return options.rangeMessage || options.invalidMessage || 'Enter a valid number';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  const normalizedConfirm = normalizeValue(confirmPassword);
  if (!normalizedConfirm) return 'Confirm password is required';
  if (normalizeValue(password) !== normalizedConfirm) return 'Passwords do not match';
  return '';
};

export const isAllowedNumericKey = (event) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
  return allowed.includes(event.key) || /^[0-9]$/.test(event.key);
};

export const validatePaymentSlip = (file) => {
  if (!file) return 'Please upload a valid payment slip';
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return 'Please upload a valid payment slip';
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) return 'Please upload a valid payment slip';
  return '';
};

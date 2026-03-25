const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '');

export const validateRequired = (value, label = 'This field') => {
  return normalizeValue(value) ? '' : `${label} is required`;
};

export const validateEmail = (value) => {
  const requiredError = validateRequired(value, 'Email');
  if (requiredError) return requiredError;
  return EMAIL_REGEX.test(normalizeValue(value)) ? '' : 'Please enter a valid email address';
};

export const validatePassword = (value) => {
  const requiredError = validateRequired(value, 'Password');
  if (requiredError) return requiredError;
  return normalizeValue(value).length >= 6 ? '' : 'Password must be at least 6 characters long';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  const requiredError = validateRequired(confirmPassword, 'Confirm password');
  if (requiredError) return requiredError;
  return normalizeValue(password) === normalizeValue(confirmPassword) ? '' : 'Passwords do not match';
};

const SRI_LANKAN_MOBILE_PREFIXES = new Set(['070', '071', '072', '074', '075', '076', '077', '078']);

const alphaSpaceRegex = /^[A-Za-z\s]+$/;
const textSpamRegex = /[^\w\s\-&,/().']/;

const isBlank = (value) => typeof value !== 'string' || value.trim().length === 0;
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return NaN;
  return Number(value);
};

const setError = (errors, key, message) => {
  if (message) errors[key] = message;
};

export const validateRequiredText = (value, label = 'This field') => {
  if (isBlank(value)) return `${label} is required`;
  return '';
};

export const validateNameText = (value, label = 'Name', minLength = 2) => {
  const normalized = normalizeText(value);
  if (!normalized) return `${label} is required`;
  if (normalized.length < minLength) return `${label} must be at least ${minLength} characters`;
  if (!alphaSpaceRegex.test(normalized)) return `${label} can only contain letters and spaces`;
  return '';
};

export const validateLabelText = (value, label = 'Field') => {
  const normalized = normalizeText(value);
  if (!normalized) return `${label} is required`;
  if (textSpamRegex.test(normalized)) return `${label} contains invalid special characters`;
  return '';
};

export const validateDescriptionText = (value, label = 'Description', minLength = 10) => {
  const normalized = normalizeText(value);
  if (!normalized) return `${label} is required`;
  if (normalized.length < minLength) return `${label} must be at least ${minLength} characters`;
  return '';
};

export const validatePositiveNumber = (value, label = 'Amount') => {
  const num = toNumber(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(num)) return `${label} is required`;
  if (num <= 0) return `${label} must be a positive number`;
  return '';
};

export const validateIntegerNumber = (value, label = 'Quantity', min = 0) => {
  const num = toNumber(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(num)) return `${label} is required`;
  if (!Number.isInteger(num)) return `${label} must be a whole number`;
  if (num < min) return `${label} must be at least ${min}`;
  return '';
};

export const validateSriLankanMobile = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return 'Phone number is required';
  if (!/^\d+$/.test(normalized)) return 'Phone number must contain digits only';
  if (normalized.length !== 10) return 'Phone number must be exactly 10 digits';
  if (!SRI_LANKAN_MOBILE_PREFIXES.has(normalized.slice(0, 3))) {
    return 'Phone number must start with a valid Sri Lankan mobile prefix';
  }
  return '';
};

export const validateAddressText = (value, minLength = 10) => {
  const normalized = normalizeText(value);
  if (!normalized) return 'Address is required';
  if (normalized.length < minLength) return `Address must be at least ${minLength} characters`;
  return '';
};

//product validations
export const validateTravelProductField = (field, form) => {
  switch (field) {
    case 'name':
      return validateNameText(form.name, 'Product name');
    case 'category':
      return validateLabelText(form.category, 'Category');
    case 'description':
      return validateDescriptionText(form.description, 'Description', 10);
    case 'price':
      return validatePositiveNumber(form.price, 'Price');
    case 'stock':
      return validateIntegerNumber(form.stock, 'Stock', 0);
    default:
      return '';
  }
};

export const validateTravelProductForm = (form) => {
  const errors = {};
  setError(errors, 'name', validateTravelProductField('name', form));
  setError(errors, 'category', validateTravelProductField('category', form));
  setError(errors, 'description', validateTravelProductField('description', form));
  setError(errors, 'price', validateTravelProductField('price', form));
  setError(errors, 'stock', validateTravelProductField('stock', form));

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      ...form,
      name: normalizeText(form.name),
      category: normalizeText(form.category),
      description: normalizeText(form.description),
      price: toNumber(form.price),
      stock: toNumber(form.stock),
    },
  };
};
//bundle validations
export const validateTravelBundleField = (field, form) => {
  switch (field) {
    case 'name':
      return validateNameText(form.name, 'Bundle name');
    case 'description':
      return validateDescriptionText(form.description, 'Bundle description', 10);
    case 'totalPrice':
      return validatePositiveNumber(form.totalPrice, 'Bundle price');
    case 'discount': {
      if (form.discount === '' || form.discount === null || form.discount === undefined) return '';
      const num = toNumber(form.discount);
      if (Number.isNaN(num)) return 'Discount must be a number';
      if (!Number.isInteger(num)) return 'Discount must be a whole number';
      if (num < 0 || num > 100) return 'Discount must be between 0 and 100';
      return '';
    }
    case 'products':
      if (!Array.isArray(form.products) || form.products.length === 0) return 'Select at least one product';
      return '';
    case 'minBudget':
    case 'maxBudget': {
      const value = form[field];
      if (value === '' || value === null || value === undefined) return '';
      const num = toNumber(value);
      if (Number.isNaN(num)) return 'Budget must be a number';
      if (num < 0) return 'Budget cannot be negative';
      if (field === 'maxBudget' && form.minBudget !== '' && Number(form.minBudget) > num) return 'Max budget must be greater than min budget';
      return '';
    }
    default:
      return '';
  }
};

export const validateTravelBundleForm = (form) => {
  const errors = {};
  setError(errors, 'name', validateTravelBundleField('name', form));
  setError(errors, 'description', validateTravelBundleField('description', form));
  setError(errors, 'totalPrice', validateTravelBundleField('totalPrice', form));
  setError(errors, 'discount', validateTravelBundleField('discount', form));
  setError(errors, 'products', validateTravelBundleField('products', form));
  setError(errors, 'minBudget', validateTravelBundleField('minBudget', form));
  setError(errors, 'maxBudget', validateTravelBundleField('maxBudget', form));

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      ...form,
      name: normalizeText(form.name),
      description: normalizeText(form.description),
      totalPrice: toNumber(form.totalPrice),
      discount: form.discount === '' || form.discount === null || form.discount === undefined ? 0 : toNumber(form.discount),
      minBudget: form.minBudget === '' || form.minBudget === null || form.minBudget === undefined ? 0 : toNumber(form.minBudget),
      maxBudget: form.maxBudget === '' || form.maxBudget === null || form.maxBudget === undefined ? 0 : toNumber(form.maxBudget),
    },
  };
};
//checkout validations
export const validateTravelProductCheckoutField = (field, values) => {
  switch (field) {
    case 'customerName':
      return validateNameText(values.customerName, 'Full name');
    case 'phone':
      return validateSriLankanMobile(values.phone);
    case 'address':
      return validateAddressText(values.address, 10);
    case 'orderQuantity': {
      if (!Array.isArray(values.items) || values.items.length === 0) return 'Your cart is empty';
      const invalidQty = values.items.some((item) => !Number.isInteger(Number(item.qty)) || Number(item.qty) < 1);
      if (invalidQty) return 'Each item quantity must be at least 1';
      return '';
    }
    default:
      return '';
  }
};

export const validateTravelProductCheckoutForm = (values) => {
  const errors = {};
  setError(errors, 'customerName', validateTravelProductCheckoutField('customerName', values));
  setError(errors, 'phone', validateTravelProductCheckoutField('phone', values));
  setError(errors, 'address', validateTravelProductCheckoutField('address', values));
  setError(errors, 'orderQuantity', validateTravelProductCheckoutField('orderQuantity', values));
  if (!values.slipFile) {
    errors.slipFile = 'Please upload your payment slip';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      ...values,
      customerName: normalizeText(values.customerName),
      phone: normalizeText(values.phone),
      address: normalizeText(values.address),
    },
  };
};

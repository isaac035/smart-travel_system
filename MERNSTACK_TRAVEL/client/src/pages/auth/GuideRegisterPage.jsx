import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateNumber,
  validateConfirmPassword,
  normalizeValue,
  isAllowedNumericKey,
} from '../../utils/guideValidation';


const LANGUAGES = ['English', 'Sinhala', 'Tamil', 'Hindi', 'French', 'German', 'Japanese', 'Chinese'];
const CERTIFICATIONS = ['Licensed Tour Guide', 'First Aid Certified', 'Wilderness First Aid', 'Driver License', 'PADI Certified', 'Language Specialist'];

export default function GuideRegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    phone: '', location: '', experience: 1, bio: '',
    languages: [], services: '', certifications: []
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'experience' && !/^\d*$/.test(value)) return;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, nextForm) }));
    }

    if (name === 'password' && touched.confirm) {
      setErrors((prev) => ({ ...prev, confirm: validateField('confirm', nextForm.confirm, nextForm) }));
    }
  };

  const toggleLanguage = (lang) => {
    const nextForm = {
      ...form,
      languages: form.languages.includes(lang)
        ? form.languages.filter(l => l !== lang)
        : [...form.languages, lang]
    };
    setForm(nextForm);
    if (touched.languages) {
      setErrors((prevErrors) => ({ ...prevErrors, languages: validateField('languages', nextForm.languages, nextForm) }));
    }
  };

  const toggleCertification = (cert) => {
    const nextForm = {
      ...form,
      certifications: form.certifications.includes(cert)
        ? form.certifications.filter(c => c !== cert)
        : [...form.certifications, cert]
    };
    setForm(nextForm);
    if (touched.certifications) {
      setErrors((prevErrors) => ({ ...prevErrors, certifications: validateField('certifications', nextForm.certifications, nextForm) }));
    }
  };

  const validateField = (name, value, currentForm = form) => {
    if (name === 'name') return validateName(value);
    if (name === 'email') return validateEmail(value);
    if (name === 'password') return validatePassword(value);
    if (name === 'confirm') return validateConfirmPassword(currentForm.password, value);
    if (name === 'phone') return validatePhone(value);
    if (name === 'location') return normalizeValue(value) ? '' : 'Location is required';
    if (name === 'experience') {
      return validateNumber(value, {
        min: 0,
        max: 50,
        requiredMessage: 'Enter a valid number',
        invalidMessage: 'Enter a valid number',
        rangeMessage: 'Experience must be between 0 and 50',
      });
    }
    if (name === 'languages') return Array.isArray(value) && value.length > 0 ? '' : 'Please select at least one language';
    if (name === 'bio') return normalizeValue(value).length >= 10 ? '' : 'Bio must be at least 10 characters';
    if (name === 'services') return normalizeValue(value) ? '' : 'Please enter at least one service';
    if (name === 'certifications') return '';
    return '';
  };

  const validateForm = (currentForm = form) => {
    return {
      name: validateField('name', currentForm.name, currentForm),
      email: validateField('email', currentForm.email, currentForm),
      password: validateField('password', currentForm.password, currentForm),
      confirm: validateField('confirm', currentForm.confirm, currentForm),
      phone: validateField('phone', currentForm.phone, currentForm),
      location: validateField('location', currentForm.location, currentForm),
      experience: validateField('experience', currentForm.experience, currentForm),
      languages: validateField('languages', currentForm.languages, currentForm),
      bio: validateField('bio', currentForm.bio, currentForm),
      services: validateField('services', currentForm.services, currentForm),
      certifications: validateField('certifications', currentForm.certifications, currentForm),
    };
  };

  const hasErrors = (formErrors) => Object.values(formErrors).some(Boolean);

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    setErrors(formErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirm: true,
      phone: true,
      location: true,
      experience: true,
      languages: true,
      bio: true,
      services: true,
      certifications: true,
    });
    if (hasErrors(formErrors)) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        location: form.location,
        experience: Number(form.experience),
        bio: form.bio,
        languages: form.languages,
        services: form.services ? form.services.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: form.certifications
      };

      await api.post('/auth/guide/register', payload);
      toast.success('Registration submitted! Your account is pending admin approval.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    padding: '40px 20px',
    color: '#fff',
    fontFamily: "'Inter', sans-serif"
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '550px',
    background: '#1e293b',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const getFieldStyle = (name) => ({
    width: '100%',
    padding: '14px 18px',
    background: '#0f172a',
    border: `2px solid ${touched[name] && errors[name] ? '#fca5a5' : 'transparent'}`,
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  });

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Travel Guide Registration
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '15px' }}>Become a certified local expert</p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Registration Received!</h2>
            <p style={{ color: '#9ca3af', marginBottom: '32px', lineHeight: '1.6' }}>
              Your application has been submitted successfully. Our team will review your details and you'll be notified via email once approved.
            </p>
            <Link to="/" style={{ display: 'inline-block', padding: '14px 32px', background: '#fbbf24', color: '#000', borderRadius: '12px', textDecoration: 'none', fontWeight: '700' }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('name')} placeholder="e.g. John Doe" />
                  {errors.name && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('email')} placeholder="john@example.com" />
                  {errors.email && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('password')} placeholder="••••••••" />
                  {errors.password && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input name="confirm" type="password" value={form.confirm} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('confirm')} placeholder="••••••••" />
                  {errors.confirm && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.confirm}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('phone')} placeholder="07XXXXXXXX" />
                  {errors.phone && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Location *</label>
                  <input name="location" value={form.location} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('location')} placeholder="Your hometown or base" />
                  {errors.location && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.location}</p>}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Experience (years) *</label>
                <input name="experience" type="number" min="0" max="50" value={form.experience} onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => { if (!isAllowedNumericKey(e)) e.preventDefault(); }} style={getFieldStyle('experience')} />
                {errors.experience && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.experience}</p>}
              </div>

              <div>
                <label style={labelStyle}>Languages *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LANGUAGES.map(lang => (
                    <button type="button" key={lang} onClick={() => toggleLanguage(lang)} style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', border: 'none', cursor: 'pointer', background: form.languages.includes(lang) ? '#fbbf24' : '#0f172a', color: form.languages.includes(lang) ? '#000' : '#9ca3af', fontWeight: '600', transition: 'all 0.2s' }}>
                      {lang}
                    </button>
                  ))}
                </div>
                {errors.languages && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}>{errors.languages}</p>}
              </div>

              <div>
                <label style={labelStyle}>Bio / Description *</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} onBlur={handleBlur} style={{ ...getFieldStyle('bio'), height: '100px', resize: 'none' }} placeholder="Describe yourself and your expertise..." />
                {errors.bio && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.bio}</p>}
              </div>

              <div>
                <label style={labelStyle}>Services Offered *</label>
                <input name="services" value={form.services} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('services')} placeholder="e.g. City Tours, Hiking, Wildlife (comma-separated)" />
                {errors.services && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.services}</p>}
              </div>

              <div>
                <label style={labelStyle}>Certifications</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CERTIFICATIONS.map(cert => (
                    <button type="button" key={cert} onClick={() => toggleCertification(cert)} style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', border: 'none', cursor: 'pointer', background: form.certifications.includes(cert) ? '#334155' : '#0f172a', color: form.certifications.includes(cert) ? '#fff' : '#9ca3af', fontWeight: '600', transition: 'all 0.2s' }}>
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#fbbf24', border: 'none', borderRadius: '14px', color: '#000', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '12px', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting Application...' : 'Register as Guide'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginTop: 8 }}>
              Looking to book a guide?{' '}
              <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>User Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

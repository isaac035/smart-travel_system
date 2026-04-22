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
  const getFieldStyle = (field) => ({ ...inputStyle, border: errors[field] ? '1.5px solid #ef4444' : inputStyle.border });
  const canSubmit = !hasErrors(validateForm()) && !loading;

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s'
  };

  const labelStyle = { display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 4, fontWeight: 500 };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 16px'
    }}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)', borderRadius: 20, padding: '36px 32px',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
              Registration Submitted!
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Your guide account is pending admin approval.<br />
              You will be able to log in once an admin approves your registration.
            </p>
            <Link to="/guide/login" style={{
              display: 'inline-block', padding: '12px 32px', borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ color: '#f59e0b', fontSize: 26, fontWeight: 700, margin: 0 }}>
                Become a Travel Guide
              </h1>
              <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>
                Register to receive booking requests from travelers
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('name')} placeholder="Your full name" />
                  {errors.name && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('phone')} placeholder="07XXXXXXXX" />
                  {errors.phone && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('email')} placeholder="guide@email.com" />
                {errors.email && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('password')} placeholder="Min 6 characters" />
                  {errors.password && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input name="confirm" type="password" value={form.confirm} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('confirm')} placeholder="Confirm password" />
                  {errors.confirm && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.confirm}</p>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 4 }}>
                <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Professional Details</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Location *</label>
                  <input name="location" value={form.location} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('location')} placeholder="Your hometown or base" />
                  {errors.location && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.location}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Experience (years) *</label>
                  <input name="experience" type="number" min="0" max="50" value={form.experience} onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => { if (!isAllowedNumericKey(e)) e.preventDefault(); }} style={getFieldStyle('experience')} />
                  {errors.experience && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.experience}</p>}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Languages *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LANGUAGES.map(lang => (
                    <button type="button" key={lang} onClick={() => toggleLanguage(lang)} style={{
                      padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: form.languages.includes(lang) ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                      background: form.languages.includes(lang) ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                      color: form.languages.includes(lang) ? '#f59e0b' : '#9ca3af',
                      transition: 'all 0.2s'
                    }}>
                      {lang}
                    </button>
                  ))}
                </div>
                {errors.languages && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{errors.languages}</p>}
              </div>

              <div>
                <label style={labelStyle}>Bio *</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} onBlur={handleBlur} rows={3} style={{ ...getFieldStyle('bio'), resize: 'vertical' }}
                  placeholder="Tell travelers about yourself and your expertise..." />
                {errors.bio && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.bio}</p>}
              </div>

              <div>
                <label style={labelStyle}>Services (comma separated) *</label>
                <input name="services" value={form.services} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('services')}
                  placeholder="City Tours, Wildlife Safaris, Trekking" />
                {errors.services && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.services}</p>}
              </div>

              <div>
                <label style={labelStyle}>Certifications</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CERTIFICATIONS.map(cert => (
                    <button type="button" key={cert} onClick={() => toggleCertification(cert)} style={{
                      padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: form.certifications.includes(cert) ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                      background: form.certifications.includes(cert) ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                      color: form.certifications.includes(cert) ? '#f59e0b' : '#9ca3af',
                      transition: 'all 0.2s'
                    }}>
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!canSubmit} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: !canSubmit ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8, transition: 'opacity 0.2s'
              }}>
                {loading ? 'Creating Account...' : 'Register as Guide'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 20 }}>
              Already have a guide account?{' '}
              <Link to="/guide/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
            </p>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
              Looking to book a guide?{' '}
              <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>User Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

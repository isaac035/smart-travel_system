import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function GuideSchedulePage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const { data } = await api.get('/guide-dashboard/schedule');
        setSchedule(data);
      } catch (err) {
        toast.error('Failed to load schedule');
        if (err.response?.status === 403) navigate('/guide/login');
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const isDateBooked = (date) => {
    return schedule.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const getBookingForDate = (date) => {
    return schedule.find(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <div style={{ color: '#6b7280' }}>Loading schedule...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => navigate('/guide/dashboard')} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer'
          }}>
            Back to Dashboard
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>My Schedule</h1>
          <div style={{ width: 120 }} />
        </div>

        {/* Calendar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              background: '#fff', cursor: 'pointer', fontSize: 14
            }}>Prev</button>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              background: '#fff', cursor: 'pointer', fontSize: 14
            }}>Next</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9ca3af', padding: '8px 0' }}>
                {day}
              </div>
            ))}
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const booked = isDateBooked(date);
              const booking = booked ? getBookingForDate(date) : null;
              const isToday = date.getTime() === today.getTime();
              const isPast = date < today;

              return (
                <div key={i} title={booking ? `${booking.travelerName} — ${booking.location}` : 'Free'} style={{
                  textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 14, cursor: 'default',
                  background: booked ? '#fef3c7' : isToday ? '#eff6ff' : 'transparent',
                  border: isToday ? '2px solid #3b82f6' : booked ? '1px solid #fcd34d' : '1px solid transparent',
                  color: isPast ? '#d1d5db' : booked ? '#92400e' : '#374151',
                  fontWeight: isToday ? 700 : booked ? 600 : 400,
                  position: 'relative'
                }}>
                  {i + 1}
                  {booked && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#f59e0b',
                      margin: '2px auto 0'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
          {[
            { color: '#fef3c7', border: '#fcd34d', label: 'Booked' },
            { color: '#eff6ff', border: '#3b82f6', label: 'Today' },
            { color: '#fff', border: '#e5e7eb', label: 'Free' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color, border: `1px solid ${item.border}` }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Upcoming Bookings List */}
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 14 }}>Upcoming Bookings</h3>
          {schedule.filter(b => new Date(b.startDate) >= today).length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No upcoming bookings</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schedule.filter(b => new Date(b.startDate) >= today).map(b => (
                <div key={b._id} style={{
                  background: '#fff', borderRadius: 10, padding: '14px 18px',
                  border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{b.travelerName}</span>
                    <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 10 }}>{b.location}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

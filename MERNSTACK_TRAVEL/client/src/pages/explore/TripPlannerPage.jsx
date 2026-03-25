import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import TripSetupStep from './trip-planner/TripSetupStep';
import LocationSelectStep from './trip-planner/LocationSelectStep';
import ItineraryStep from './trip-planner/ItineraryStep';
import TripSaveBar from './trip-planner/TripSaveBar';

const STEPS = ['Setup', 'Locations', 'Itinerary', 'Save'];

const DEFAULT_CONFIG = {
  tripName: 'My Sri Lanka Trip',
  startDate: null,
  endDate: null,
  totalDays: 0,
  startPoint: null,
};

export default function TripPlannerPage({ editTrip }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(() => {
    if (editTrip) {
      return {
        tripName: editTrip.name,
        startDate: null,
        endDate: null,
        totalDays: editTrip.days?.length || 3,
        startPoint: editTrip.startPoint || null,
      };
    }
    return { ...DEFAULT_CONFIG };
  });

  const [locationsByDay, setLocationsByDay] = useState(() => {
    if (editTrip?.days) {
      const byDay = {};
      editTrip.days.forEach((d) => {
        byDay[d.dayNumber] = d.locations.map((l) => {
          const loc = l.locationId || {};
          return { ...loc, _id: loc._id || l.locationId, notes: l.notes || '' };
        });
      });
      return byDay;
    }
    return {};
  });

  const [itineraryDays, setItineraryDays] = useState([]);
  const [itineraryStats, setItineraryStats] = useState(null);
  const [tripId, setTripId] = useState(editTrip?._id || null);

  const topRef = useRef(null);
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [step]);

  const handleItinerarySave = useCallback((days, stats) => {
    setItineraryDays(days);
    setItineraryStats(stats);
    setStep(3);
  }, []);

  const handleReset = () => {
    setStep(0);
    setConfig({ ...DEFAULT_CONFIG });
    setLocationsByDay({});
    setItineraryDays([]);
    setItineraryStats(null);
    setTripId(null);
  };

  return (
    <div className="min-h-[80vh]" style={{ background: '#ffffff' }}>
      <div ref={topRef} className="py-10 sm:py-12">
        {/* ── Stepper ── */}
        <nav style={{ marginBottom: 60 }}>
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            {/* Connector lines behind the circles */}
            <div style={{ position: 'absolute', top: 20, left: 32, right: 32, display: 'flex', gap: 0 }}>
              {STEPS.slice(0, -1).map((_, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div className={`h-[2px] w-full transition-colors duration-300 ${i < step ? 'bg-gray-900' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
            {/* Step circles + labels */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, position: 'relative' }}>
              {STEPS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className={`w-10 h-10 flex items-center justify-center text-sm font-semibold transition-all duration-200 ${i <= step
                      ? 'bg-gray-900 text-white'
                      : 'border-2 border-gray-300 text-gray-400 bg-white'
                    }`} style={{ borderRadius: 4 }}>
                    {i < step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : i + 1}
                  </span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide transition-colors ${i === step ? 'text-gray-900' : i < step ? 'text-gray-700' : 'text-gray-400'
                    }`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Step Content */}
        {step === 0 && <TripSetupStep config={config} setConfig={setConfig} onNext={() => setStep(1)} />}
        {step === 1 && <LocationSelectStep config={config} locationsByDay={locationsByDay} setLocationsByDay={setLocationsByDay} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <ItineraryStep config={config} locationsByDay={locationsByDay} setLocationsByDay={setLocationsByDay} onBack={() => setStep(1)} onSave={handleItinerarySave} />}
        {step === 3 && <TripSaveBar config={config} days={itineraryDays} stats={itineraryStats} tripId={tripId} setTripId={setTripId} onBack={() => setStep(2)} onReset={handleReset} />}
      </div>
    </div>
  );
}


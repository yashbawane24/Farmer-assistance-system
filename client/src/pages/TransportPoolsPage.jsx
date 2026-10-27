import React, { useState, useEffect } from 'react';
import {
  Truck,
  Users,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  TrendingDown,
  Info,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { api } from '../services/api.js';
import { getTranslation, translateCropName } from '../services/i18n.js';
import { DistrictSelect } from '../components/DistrictSelect.jsx';
import {
  MANDI_CROPS,
  MAHARASHTRA_DISTRICTS,
  TRANSPORT_VEHICLES,
  POPULAR_DESTINATION_MANDIS,
  isMaharashtraDistrict,
  districtLabel
} from '../config/maharashtra.js';

export function TransportPoolsPage({ activeProfile, lang = 'en', onNavigate, navigationParams }) {
  const t = getTranslation(lang);
  const p = t.pools || {};

  // Filters State — pre-populate from navigationParams or activeProfile
  const [selectedCrop, setSelectedCrop] = useState(
    navigationParams?.crop || activeProfile?.currentCrop || 'Tomato'
  );
  const [myDistrict, setMyDistrict] = useState(
    navigationParams?.district ||
    (isMaharashtraDistrict(activeProfile?.district) ? activeProfile.district : 'Nashik')
  );
  const [selectedMandi, setSelectedMandi] = useState(
    navigationParams?.mandi || ''
  );
  const [produceQuantity, setProduceQuantity] = useState(
    navigationParams?.quantity || (activeProfile?.landSize ? Math.round(activeProfile.landSize * 15) : 25)
  );

  // Data State
  const [availablePools, setAvailablePools] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Toast Notifications State (replaces alert())
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // Modal State for "Start New Pool"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    cropName: selectedCrop || 'Tomato',
    pickupDistrict: myDistrict || 'Nashik',
    pickupHub: activeProfile?.farmName || `${myDistrict || 'Nashik'} Rural Hub`,
    destinationMandi: POPULAR_DESTINATION_MANDIS[0],
    departureDate: getFutureDateISO(2),
    departureTime: '06:00',
    vehicleType: 'Eicher 10-Ton Container',
    initialQuantity: produceQuantity || 25
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Tooltip helper state for active formula tooltip
  const [activeTooltipPoolId, setActiveTooltipPoolId] = useState(null);

  // Show inline toast
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  // Helper for ISO date (YYYY-MM-DD)
  function getFutureDateISO(daysAhead = 2) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  }

  // Load data on filter changes
  useEffect(() => {
    loadAllPools();
  }, [selectedCrop, myDistrict, selectedMandi, produceQuantity, activeProfile?.id]);

  const loadAllPools = async () => {
    setLoading(true);
    try {
      const userId = activeProfile?.id || null;
      const [availRes, mineRes] = await Promise.all([
        api.getPools({
          crop: selectedCrop,
          district: myDistrict,
          mandi: selectedMandi,
          quantity: produceQuantity
        }),
        userId ? api.getMyPools(userId) : Promise.resolve([])
      ]);
      setAvailablePools(Array.isArray(availRes) ? availRes : []);
      setMyPools(Array.isArray(mineRes) ? mineRes : []);
    } catch (err) {
      console.error('Failed to load pools:', err);
      showToast('error', err.message || 'Failed to load transport pools');
    } finally {
      setLoading(false);
    }
  };

  // Format countdown string: "in 2 days", "Tomorrow", "Today"
  const getCountdownLabel = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return p.poolDeparted || 'Departed';
    }
    if (diffDays === 0) {
      return lang === 'mr' ? 'आज' : lang === 'hi' ? 'आज' : 'Today';
    }
    if (diffDays === 1) {
      return lang === 'mr' ? 'उद्या' : lang === 'hi' ? 'कल' : 'Tomorrow';
    }
    return lang === 'mr' ? `${diffDays} दिवसांत` : lang === 'hi' ? `${diffDays} दिनों में` : `in ${diffDays} days`;
  };

  // Join a pool
  const handleJoinPool = async (pool, requestedQty) => {
    const userId = activeProfile?.id || 1;
    const farmerName = activeProfile?.fullName || (lang === 'hi' ? 'पंजीकृत किसान' : lang === 'mr' ? 'नोंदणीकृत शेतकरी' : 'Registered Farmer');
    const phone = activeProfile?.phone || '';

    const remaining = Math.max(pool.capacity_quintal - pool.current_produce_quintal, 0);
    const actualQty = Math.min(requestedQty, remaining);

    if (actualQty <= 0) {
      showToast('error', p.poolFull || 'Pool is already full');
      return;
    }

    setActionLoadingId(pool.id);
    try {
      await api.joinPool(pool.id, {
        userId,
        farmerName,
        phone,
        quantity: actualQty
      });
      showToast('success', p.joinSuccess || 'Successfully joined transport pool!');
      await loadAllPools();
    } catch (err) {
      showToast('error', err.message || 'Could not join pool');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Leave a pool
  const handleLeavePool = async (poolId) => {
    const userId = activeProfile?.id || 1;
    setActionLoadingId(`leave-${poolId}`);
    try {
      await api.leavePool(poolId, userId);
      showToast('success', p.leaveSuccess || 'Successfully left pool. Reserved space freed.');
      await loadAllPools();
    } catch (err) {
      showToast('error', err.message || 'Could not leave pool');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create new pool
  const handleCreatePoolSubmit = async (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    if (createForm.departureDate < today) {
      showToast('error', lang === 'mr' ? 'कृपया आजची किंवा भविष्यातील तारीख निवडा' : lang === 'hi' ? 'कृपया आज की या भविष्य की तारीख चुनें' : 'Please select today or a future date');
      return;
    }

    const selectedVehicle = TRANSPORT_VEHICLES.find((v) => v.id === createForm.vehicleType);
    const maxCap = selectedVehicle ? selectedVehicle.capacity : 100;
    const initQty = Number(createForm.initialQuantity) || 10;

    if (initQty > maxCap) {
      showToast('error', `Initial quantity cannot exceed vehicle capacity of ${maxCap} quintals`);
      return;
    }

    setCreateSubmitting(true);
    try {
      await api.createPool({
        userId: activeProfile?.id || 1,
        creatorName: activeProfile?.fullName || 'Farmer',
        phone: activeProfile?.phone || '',
        cropName: createForm.cropName,
        pickupDistrict: createForm.pickupDistrict,
        pickupHub: createForm.pickupHub,
        destinationMandi: createForm.destinationMandi,
        departureDate: createForm.departureDate,
        departureTime: createForm.departureTime,
        vehicleType: createForm.vehicleType,
        initialProduceQuintal: initQty
      });

      setIsCreateModalOpen(false);
      showToast('success', p.createSuccess || 'New transport pool created successfully!');
      // Align page filter with the new pool's crop & district
      setSelectedCrop(createForm.cropName);
      setMyDistrict(createForm.pickupDistrict);
      await loadAllPools();
    } catch (err) {
      showToast('error', err.message || 'Failed to create transport pool');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px var(--space-md) 64px var(--space-md)', maxWidth: '1240px' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#1B382B' : '#C0392B',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '460px',
            fontSize: '0.92rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} color="#2ECC71" /> : <AlertTriangle size={20} color="#F1C40F" />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header & Pooling Economics Explainer */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Truck size={24} color="var(--color-primary-forest)" />
              </div>
              <h1 style={{ fontSize: '1.85rem', color: 'var(--color-primary-forest)', margin: 0, fontFamily: 'var(--font-display)' }}>
                {p.title || 'Nearby Farmer Transport Pools'}
              </h1>
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginTop: '8px', maxWidth: '720px' }}>
              {p.subtitle || 'Share truck capacity with neighboring farmers heading to the same market to slash freight costs by up to 50%.'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: '48px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            <span>{p.startPoolBtn || '+ Start a New Pool'}</span>
          </button>
        </div>

        {/* How Pooling Works Explainer Card */}
        <div
          style={{
            backgroundColor: '#F4EFE6',
            border: '1.5px solid #E2D9C8',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginTop: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <Info size={22} color="var(--color-primary-forest)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.55 }}>
            <strong>{lang === 'mr' ? 'वाहतूक बचत तत्त्व:' : lang === 'hi' ? 'पूलिंग बचत सिद्धांत:' : 'How Pooling Saves Freight:'}</strong>{' '}
            {p.explanation || 'When farmers combine produce in a single truck, distance-based diesel and loading expenses are divided proportionally — reducing per-quintal transportation costs by up to 50%.'}
          </div>
        </div>
      </div>

      {/* STICKY TOP FILTER BAR */}
      <div
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 40,
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--color-border-subtle)',
          padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(27, 56, 43, 0.06)',
          marginBottom: '32px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '18px',
            alignItems: 'flex-end'
          }}
        >
          {/* Crop Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
              🌾 {p.filterCrop || 'Produce Crop'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="input-select"
              style={{
                width: '100%',
                height: '48px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-subtle)',
                padding: '0 12px',
                backgroundColor: '#FFFFFF',
                fontSize: '0.95rem'
              }}
            >
              {MANDI_CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {translateCropName(crop, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
              📍 {p.filterDistrict || 'Pickup District'}
            </label>
            <DistrictSelect
              value={myDistrict}
              onChange={(newDist) => setMyDistrict(newDist)}
              lang={lang}
              style={{
                width: '100%',
                height: '48px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-subtle)',
                padding: '0 12px',
                backgroundColor: '#FFFFFF',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Destination Mandi Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
              🏛️ {p.filterMandi || 'Destination APMC Mandi'}
            </label>
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="input-select"
              style={{
                width: '100%',
                height: '48px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border-subtle)',
                padding: '0 12px',
                backgroundColor: '#FFFFFF',
                fontSize: '0.95rem'
              }}
            >
              <option value="">{p.allMandis || 'All Destination APMCs'}</option>
              {POPULAR_DESTINATION_MANDIS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Farmer Quantity Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-forest)' }}>
                ⚖️ {p.filterQuantity || 'My Produce Quantity'}
              </label>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-leaf-green)', backgroundColor: '#E8F5E9', padding: '2px 8px', borderRadius: '12px' }}>
                {produceQuantity} {lang === 'mr' || lang === 'hi' ? 'क्विंटल' : 'q'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[10, 25, 50, 100].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setProduceQuantity(q)}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: 'var(--radius-sm)',
                    border: produceQuantity === q ? '2px solid var(--color-primary-forest)' : '1.5px solid var(--color-border-subtle)',
                    backgroundColor: produceQuantity === q ? 'var(--color-primary-forest)' : '#F9F8F5',
                    color: produceQuantity === q ? '#FFFFFF' : 'var(--color-text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {q}q
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: MY RESERVED POOLS */}
      {myPools.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={20} color="var(--color-primary-forest)" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-forest)', margin: 0, fontWeight: 800 }}>
              {p.myPoolsTitle || 'My Reserved Pools'} ({myPools.length})
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: myPools.length === 1 ? 'minmax(320px, 580px)' : 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '18px'
            }}
          >
            {myPools.map((pool) => {
              const departureDate = pool.departure_date || pool.scheduled_date;
              const countdown = pool.countdown || getCountdownLabel(departureDate) || (lang === 'mr' ? '२ दिवसांत' : lang === 'hi' ? '२ दिनों में' : 'in 2 days');
              const isDeparted = pool.status === 'Departed';
              const cleanHub = (pool.pickup_hub || '').replace(new RegExp(`\\s*\\(${pool.pickup_district}\\)`, 'i'), '').trim();

              return (
                <div
                  key={pool.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #27AE60',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-primary-forest)', fontSize: '0.95rem' }}>
                      {lang === 'hi' ? 'समूह' : lang === 'mr' ? 'गट' : 'Pool'} #{pool.id}: {translateCropName(pool.crop_name, lang)}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: isDeparted ? '#E0E0E0' : '#E8F5E9',
                        color: isDeparted ? '#616161' : '#2E7D32',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Clock size={12} />
                      {countdown}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                    <MapPin size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    <strong>{cleanHub || pool.pickup_hub}</strong> ({districtLabel(pool.pickup_district, lang)}) → {pool.destination_mandi}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0', borderTop: '1px dashed #E0E0E0', borderBottom: '1px dashed #E0E0E0', margin: '10px 0' }}>
                    <span>{lang === 'mr' ? 'माझा आरक्षित माल:' : lang === 'hi' ? 'मेरा आरक्षित माल:' : 'My Reserved Produce:'}</span>
                    <strong style={{ color: 'var(--color-primary-forest)' }}>
                      {pool.my_reserved_quintal || produceQuantity} {lang === 'mr' || lang === 'hi' ? 'क्विंटल' : 'Quintals'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {departureDate} • {pool.departure_time || '06:00 AM'}
                    </div>

                    {!isDeparted && (
                      <button
                        type="button"
                        onClick={() => handleLeavePool(pool.id)}
                        disabled={actionLoadingId === `leave-${pool.id}`}
                        style={{
                          height: '36px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: '1px solid #E74C3C',
                          backgroundColor: '#FDEDEC',
                          color: '#C0392B',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <LogOut size={13} />
                        <span>{p.leavePool || 'Leave Pool'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: AVAILABLE TRANSPORT POOLS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-primary-forest)', margin: 0, fontWeight: 800 }}>
              {p.availablePoolsTitle || 'Available Transport Pools'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {lang === 'mr'
                ? `${districtLabel(myDistrict, lang)} व आसपासच्या पिकअप केंद्रांसाठी चालू गट`
                : lang === 'hi'
                ? `${districtLabel(myDistrict, lang)} और नजदीकी पिकअप केंद्रों के सक्रिय समूह`
                : `Active pools near ${myDistrict} for ${translateCropName(selectedCrop, lang)}`}
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-leaf-green)' }}>
            {availablePools.length} {lang === 'mr' ? 'गट उपलब्ध' : lang === 'hi' ? 'समूह उपलब्ध' : 'pools found'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)' }}>
            <RefreshCw className="spin" size={28} color="var(--color-primary-forest)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
              {lang === 'mr' ? 'वाहतूक गट शोधत आहे...' : lang === 'hi' ? 'परिवहन समूह खोजे जा रहे हैं...' : 'Loading transport pools...'}
            </p>
          </div>
        ) : availablePools.length === 0 ? (
          /* Empty State */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--color-border-strong)',
              padding: '48px 24px',
              textAlign: 'center'
            }}
          >
            <Truck size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
              {(p.emptyState || 'No pool yet for {crop} to {mandi} — start one and nearby farmers can join.')
                .replace('{crop}', translateCropName(selectedCrop, lang))
                .replace('{mandi}', selectedMandi || (lang === 'mr' ? 'या बाजारात' : lang === 'hi' ? 'इस मंडी में' : 'destination'))}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '520px', margin: '0 auto 20px' }}>
              {lang === 'mr'
                ? 'आपण पहिले शेतकरी म्हणून गाडी सुरू करा. आजूबाजूचे शेतकरी लगेच सामील होऊन आपले भाडे अर्धे करू शकतील.'
                : lang === 'hi'
                ? 'आप पहले किसान के रूप में वाहन शुरू करें। आसपास के किसान तुरंत जुड़कर भाड़ा आधा कर सकेंगे।'
                : 'Be the first farmer to start a pool on this route. Neighboring farmers will see it and fill the remaining capacity.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ minHeight: '48px', padding: '0 24px', fontWeight: 700 }}
              onClick={() => {
                setCreateForm((prev) => ({
                  ...prev,
                  cropName: selectedCrop,
                  pickupDistrict: myDistrict,
                  pickupHub: `${myDistrict} Rural Hub`,
                  destinationMandi: selectedMandi || POPULAR_DESTINATION_MANDIS[0],
                  initialQuantity: produceQuantity
                }));
                setIsCreateModalOpen(true);
              }}
            >
              <Plus size={18} />
              <span>{p.startPoolBtn || '+ Start a New Pool'}</span>
            </button>
          </div>
        ) : (
          /* Available Pools Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: availablePools.length === 1 ? 'minmax(340px, 640px)' : 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '24px'
            }}
          >
            {availablePools.map((pool) => {
              const capacity = pool.capacity_quintal || 100;
              const filled = pool.current_produce_quintal || 0;
              const remaining = Math.max(capacity - filled, 0);
              const fillPercent = Math.min(Math.round((filled / capacity) * 100), 100);
              const departureDate = pool.departure_date || pool.scheduled_date;
              const countdown = pool.countdown || getCountdownLabel(departureDate) || (lang === 'mr' ? '२ दिवसांत' : lang === 'hi' ? '२ दिनों में' : 'in 2 days');
              const isJoined = myPools.some((m) => m.id === pool.id);
              const joinableQty = Math.min(produceQuantity, remaining);
              const isFull = remaining <= 0;
              const econ = pool.economics || {};

              // Remove duplicate district in hub name if already present
              const cleanHub = (pool.pickup_hub || '').replace(new RegExp(`\\s*\\(${pool.pickup_district}\\)`, 'i'), '').trim();

              return (
                <div
                  key={pool.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Top Row: Crop Badge + Vehicle + Countdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary-forest)' }}>
                          {translateCropName(pool.crop_name, lang)}
                        </span>
                        <span
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#F4EFE6',
                            color: '#5C4A32',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {lang === 'hi' ? 'समूह' : lang === 'mr' ? 'गट' : 'Pool'} #{pool.id}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          backgroundColor: isFull ? '#FDEBD0' : fillPercent >= 90 ? '#FEF3C7' : '#E8F5E9',
                          color: isFull ? '#B9770E' : fillPercent >= 90 ? '#B45309' : '#15803D',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Clock size={13} />
                        {isFull ? (p.poolFull || 'Pool Full') : countdown}
                      </span>
                    </div>

                    {/* Route & Distance Card */}
                    <div style={{ backgroundColor: '#F9F8F5', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #ECE7DC' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <MapPin size={18} color="var(--color-primary-forest)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>
                          <strong style={{ color: 'var(--color-primary-forest)' }}>{cleanHub || pool.pickup_hub}</strong>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginLeft: '6px' }}>
                            ({districtLabel(pool.pickup_district, lang)})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '26px', color: 'var(--color-leaf-green)', fontWeight: 800, fontSize: '0.98rem' }}>
                        <span>→</span>
                        <span>{pool.destination_mandi}</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '10px', paddingLeft: '26px' }}>
                        <span>🛣️ {p.distance || 'Road Distance'}: ~{econ.distanceKm || pool.distance_km || 60} km</span>
                        <span>📅 {departureDate} • {pool.departure_time || '06:00 AM'}</span>
                      </div>
                    </div>

                    {/* Vehicle Badge & Capacity Progress Bar */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        marginBottom: '16px',
                        border: '1.5px solid var(--color-border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={16} color="var(--color-primary-forest)" />
                          {pool.vehicle_type}
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--color-primary-forest)' }}>
                          {filled} / {capacity} q ({fillPercent}%)
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: '100%', height: '10px', backgroundColor: '#E0DCD3', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div
                          style={{
                            width: `${fillPercent}%`,
                            height: '100%',
                            backgroundColor: fillPercent >= 90 ? '#E67E22' : 'var(--color-leaf-green)',
                            borderRadius: '5px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>

                      {/* Remaining capacity */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          {p.remaining || 'Remaining Space'}:
                        </span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: remaining > 0 ? 'var(--color-leaf-green)' : '#C0392B' }}>
                          {remaining} {lang === 'mr' || lang === 'hi' ? 'क्विंटल बाकी' : 'q left'}
                        </span>
                      </div>
                    </div>

                    {/* REAL-TIME FREIGHT COMPARISON & SAVINGS FOR MY QUANTITY */}
                    <div
                      style={{
                        border: '1.5px solid #C8E6C9',
                        backgroundColor: '#F1F8F1',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        marginBottom: '18px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {p.soloCost || 'Solo Truck Cost'} ({produceQuantity}q):
                        </span>
                        <span style={{ textDecoration: 'line-through', color: '#888', fontWeight: 600 }}>
                          ₹{econ.soloCostPerQuintal || 234}/q
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary-forest)' }}>
                          {p.pooledCost || 'Your Pooled Share'}:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary-forest)' }}>
                            ₹{econ.pooledCostPerQuintal || 70}/q
                          </span>
                          <span
                            title={econ.formula}
                            style={{
                              fontSize: '0.72rem',
                              backgroundColor: '#E8F5E9',
                              color: '#27AE60',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                            onClick={() => setActiveTooltipPoolId(activeTooltipPoolId === pool.id ? null : pool.id)}
                          >
                            {p.estimated || 'Estimated'} ℹ
                          </span>
                        </div>
                      </div>

                      {/* Tooltip formula explanation */}
                      {activeTooltipPoolId === pool.id && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #B0D7B4',
                            borderRadius: '6px',
                            padding: '10px',
                            color: '#2F4F2F',
                            marginBottom: '10px',
                            lineHeight: 1.45
                          }}
                        >
                          <strong>{p.formulaTooltip || 'Formula'}:</strong> {econ.formula}
                        </div>
                      )}

                      {/* You Save Badge */}
                      <div
                        style={{
                          backgroundColor: '#1B382B',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TrendingDown size={16} color="#A3E635" />
                          {p.youSave || 'You Save'}:
                        </span>
                        <span style={{ color: '#A3E635', fontSize: '1.05rem' }}>
                          ₹{econ.totalSavings ? econ.totalSavings.toLocaleString('en-IN') : Math.round((econ.savingsPerQuintal || 164) * produceQuantity).toLocaleString('en-IN')} (-{econ.savingsPercentage || 70}%)
                        </span>
                      </div>
                    </div>

                    {/* Member Privacy Section: First Names Only */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-forest)', marginBottom: '8px' }}>
                        <Users size={15} />
                        <span>{p.members || 'Farmers in Pool'} ({pool.members?.length || 0}):</span>
                      </div>
                      <div>
                        {pool.members && pool.members.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {pool.members.map((m, idx) => {
                              const name = m.firstName || m.farmer_name || (lang === 'mr' ? 'शेतकरी' : lang === 'hi' ? 'किसान' : 'Farmer');
                              const isMe = m.isCurrentUser;
                              return (
                                <span
                                  key={idx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    backgroundColor: isMe ? '#E8F5E9' : '#F4EFE6',
                                    color: isMe ? '#1B382B' : '#5C4A32',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    border: isMe ? '1px solid #A3E635' : '1px solid #E5DFD3'
                                  }}
                                >
                                  👨🏽‍🌾 {name} {isMe ? '(You)' : ''} {m.produceQuantityQuintal ? `• ${m.produceQuantityQuintal}q` : ''}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                            {p.noMembersYet || 'No members yet'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                        {p.organiserContact || 'The pool organiser will contact you after joining'}
                      </div>
                    </div>
                  </div>

                  {/* JOIN ACTION BUTTON */}
                  <div>
                    {isJoined ? (
                      <div
                        style={{
                          width: '100%',
                          minHeight: '48px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#E8F5E9',
                          border: '1.5px solid #27AE60',
                          color: '#1B382B',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <CheckCircle2 size={18} color="#27AE60" />
                        <span>{lang === 'mr' ? 'तुम्ही या गटात सहभागी आहात' : lang === 'hi' ? 'आप इस समूह में शामिल हैं' : 'Joined this pool'}</span>
                      </div>
                    ) : isFull ? (
                      <button
                        type="button"
                        disabled
                        className="btn btn-secondary btn-block"
                        style={{ minHeight: '48px', opacity: 0.6, cursor: 'not-allowed', width: '100%' }}
                      >
                        {p.poolFull || 'Pool Full'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        style={{ minHeight: '48px', fontWeight: 700, fontSize: '0.95rem', width: '100%' }}
                        disabled={actionLoadingId === pool.id}
                        onClick={() => handleJoinPool(pool, joinableQty)}
                      >
                        {actionLoadingId === pool.id ? (
                          <RefreshCw className="spin" size={18} />
                        ) : produceQuantity > remaining ? (
                          (p.joinWithRemaining || 'Only {n} q left — join with {n} q').replaceAll('{n}', remaining)
                        ) : (
                          `${p.joinPool || 'Join Pool'} (${joinableQty} ${lang === 'mr' || lang === 'hi' ? 'क्विंटल' : 'q'})`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* START A NEW POOL MODAL */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => !createSubmitting && setIsCreateModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={24} color="var(--color-primary-forest)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-forest)', fontWeight: 800 }}>
                  {p.createModalTitle || 'Start a New Farmer Transport Pool'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreatePoolSubmit}>
              {/* Crop Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  {p.createCrop || 'Produce Commodity'} *
                </label>
                <select
                  value={createForm.cropName}
                  onChange={(e) => setCreateForm({ ...createForm, cropName: e.target.value })}
                  className="input-select"
                  style={{ width: '100%', height: '48px', fontWeight: 600 }}
                  required
                >
                  {MANDI_CROPS.map((crop) => (
                    <option key={crop} value={crop}>{translateCropName(crop, lang)}</option>
                  ))}
                </select>
              </div>

              {/* Pickup District & Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    {p.createPickupDistrict || 'Pickup District'} *
                  </label>
                  <DistrictSelect
                    value={createForm.pickupDistrict}
                    onChange={(dist) => setCreateForm({ ...createForm, pickupDistrict: dist })}
                    lang={lang}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    {p.createPickupHub || 'Pickup Hub / Village'} *
                  </label>
                  <input
                    type="text"
                    value={createForm.pickupHub}
                    onChange={(e) => setCreateForm({ ...createForm, pickupHub: e.target.value })}
                    className="input-text"
                    style={{ width: '100%', height: '48px', padding: '0 12px' }}
                    placeholder="e.g. Niphad Rural Hub"
                    required
                  />
                </div>
              </div>

              {/* Destination APMC Mandi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  {p.createMandi || 'Destination APMC Mandi'} *
                </label>
                <select
                  value={createForm.destinationMandi}
                  onChange={(e) => setCreateForm({ ...createForm, destinationMandi: e.target.value })}
                  className="input-select"
                  style={{ width: '100%', height: '48px', fontWeight: 600 }}
                  required
                >
                  {POPULAR_DESTINATION_MANDIS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Departure Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    {p.createDate || 'Pickup Date'} *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={createForm.departureDate}
                    onChange={(e) => setCreateForm({ ...createForm, departureDate: e.target.value })}
                    className="input-text"
                    style={{ width: '100%', height: '48px', padding: '0 12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    {p.createTime || 'Pickup Time'} *
                  </label>
                  <input
                    type="time"
                    value={createForm.departureTime}
                    onChange={(e) => setCreateForm({ ...createForm, departureTime: e.target.value })}
                    className="input-text"
                    style={{ width: '100%', height: '48px', padding: '0 12px' }}
                    required
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  {p.createVehicle || 'Vehicle Type & Capacity'} *
                </label>
                <select
                  value={createForm.vehicleType}
                  onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })}
                  className="input-select"
                  style={{ width: '100%', height: '48px', fontWeight: 600 }}
                  required
                >
                  {TRANSPORT_VEHICLES.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Farmer Initial Quantity */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  {p.createMyQuantity || 'Your Produce Quantity (Quintals)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={TRANSPORT_VEHICLES.find((v) => v.id === createForm.vehicleType)?.capacity || 160}
                  value={createForm.initialQuantity}
                  onChange={(e) => setCreateForm({ ...createForm, initialQuantity: Math.max(1, Number(e.target.value)) })}
                  className="input-text"
                  style={{ width: '100%', height: '48px', padding: '0 12px' }}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: '48px', padding: '0 20px' }}
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createSubmitting}
                >
                  {p.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minHeight: '48px', padding: '0 24px', fontWeight: 700 }}
                  disabled={createSubmitting}
                >
                  {createSubmitting ? (
                    <RefreshCw className="spin" size={18} />
                  ) : (
                    p.submitCreate || 'Create & Join Pool'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

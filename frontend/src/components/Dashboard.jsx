import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Plus, Trash2, Activity, ShieldCheck, LogOut, Upload, KeyRound, X, Copy } from 'lucide-react';
import jsQR from 'jsqr';

function Dashboard({ username, onLogout }) {
    const [services, setServices] = useState([]);
    const [logs, setLogs] = useState([]);
    const [view, setView] = useState('otp'); // 'otp' or 'logs'
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMethod, setAddMethod] = useState('qr'); // 'qr' or 'manual'
    const [newServiceName, setNewServiceName] = useState('');
    const [newSecretKey, setNewSecretKey] = useState('');
    const [qrError, setQrError] = useState('');
    const fileInputRef = useRef(null);

    // Auto-refresh OTP timers
    const [timeLeft, setTimeLeft] = useState(30 - (Math.floor(Date.now() / 1000) % 30));

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
            setTimeLeft(remaining);

            // When cycle resets, fetch fresh codes
            if (remaining === 30) {
                services.forEach(s => fetchOtpCode(s.id));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [services]);

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/otp');
            if (res.ok) {
                const data = await res.json();
                // Add code placeholders and fetch immediately
                const initialServices = data.map(s => ({ ...s, code: '------' }));
                setServices(initialServices);
                initialServices.forEach(s => fetchOtpCode(s.id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOtpCode = async (id) => {
        try {
            const res = await fetch(`/api/otp/${id}/token`);
            if (res.ok) {
                const data = await res.json();
                setServices(prev => prev.map(s => s.id === id ? { ...s, code: data.code } : s));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceName: newServiceName, secretKey: newSecretKey.replace(/\s+/g, '').toUpperCase() })
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewServiceName('');
                setNewSecretKey('');
                setAddMethod('qr');
                setQrError('');
                fetchServices();
            } else {
                alert('Failed to add. Ensure the secret is a valid Base32 key.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setQrError('');
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, img.width, img.height);

                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    parseOtpAuthUri(code.data);
                } else {
                    setQrError('No QR code found in the image. Please try a clearer image.');
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const parseOtpAuthUri = (uri) => {
        try {
            // e.g., otpauth://totp/GitHub:thanapat?secret=JBSWY3DPEHPK3PXP&issuer=GitHub
            if (!uri.startsWith('otpauth://totp/')) {
                setQrError('Invalid QR Code type. Only TOTP codes are supported.');
                return;
            }

            const url = new URL(uri);
            const secret = url.searchParams.get('secret');
            let issuer = url.searchParams.get('issuer');

            // If issuer is missing, try extracting from the path
            if (!issuer) {
                let pathInfo = decodeURIComponent(url.pathname).replace(/^\//, '');
                // The label is either 'issuer:account' or just 'account'
                issuer = pathInfo.split(':')[0];
            }

            if (!secret) {
                setQrError('No Secret found in QR code!');
                return;
            }

            setNewServiceName(issuer || 'Unknown Service');
            setNewSecretKey(secret);
            setAddMethod('manual'); // Switch to manual tab to show the decoded result for confirmation
            setQrError('');
        } catch (err) {
            setQrError('Failed to parse the QR Code data.');
            console.error(err);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            const res = await fetch(`/api/otp/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchServices();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const calculateDashOffset = () => {
        // Calculate width percentage instead of stroke displacement
        return `${(timeLeft / 30) * 100}%`;
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        // You can add a small local state animation here later if you want a checkmark feedback
    };

    return (
        <>
            <div className="dashboard-container animate-fade-in">
                <nav className="navbar" style={{ borderRadius: '16px', marginBottom: '2rem' }}>
                    <div className="nav-brand">
                        <ShieldCheck size={24} color="var(--accent-color)" />
                        ChronoAuth
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Welcome, <b>{username}</b></span>
                        <button
                            className="btn"
                            style={{ padding: '0.5rem', background: view === 'otp' ? 'var(--glass-bg)' : 'transparent', color: 'var(--text-primary)' }}
                            onClick={() => setView('otp')}
                        >
                            <Clock size={18} style={{ marginRight: '0.5rem' }} /> OTPs
                        </button>
                        <button
                            className="btn"
                            style={{ padding: '0.5rem', background: view === 'logs' ? 'var(--glass-bg)' : 'transparent', color: 'var(--text-primary)' }}
                            onClick={() => { setView('logs'); fetchLogs(); }}
                        >
                            <Activity size={18} style={{ marginRight: '0.5rem' }} /> Logs
                        </button>
                        <button className="btn btn-danger" onClick={onLogout} style={{ padding: '0.5rem' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </nav>

                {view === 'otp' && (
                    <>
                        <div className="dashboard-header">
                            <h2>Your Authenticators</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Service
                            </button>
                        </div>

                        <div className="otp-grid">
                            {services.map(service => (
                                <div key={service.id} className="glass-panel otp-card animate-fade-in" style={{ padding: '1.5rem 2rem' }}>
                                    <div className="otp-card-header" style={{ marginBottom: '1rem' }}>
                                        <div className="service-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {service.serviceName}
                                            </div>
                                            {service.owner && service.owner !== username && (
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                    Owner: {service.owner}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`timer-text ${timeLeft <= 5 ? 'warning' : ''}`} style={{ fontSize: '1rem' }}>
                                            {timeLeft}s
                                        </span>
                                    </div>

                                    <div className="otp-value-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="otp-code">
                                            {service.code.substring(0, 3)} <span>{service.code.substring(3, 6)}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.5rem', background: 'var(--bg-color)' }}
                                                onClick={() => handleCopy(service.code)}
                                                title="Copy Code"
                                            >
                                                <Copy size={18} color="var(--text-secondary)" />
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.5rem', background: 'transparent' }}
                                                onClick={() => handleDeleteService(service.id)}
                                                title="Delete Service"
                                            >
                                                <Trash2 size={18} color="var(--danger-color)" className="btn-danger" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="timer-container" title={`${timeLeft} seconds remaining`}>
                                        <div
                                            className={`timer-progress ${timeLeft <= 5 ? 'warning' : ''}`}
                                            style={{ width: calculateDashOffset() }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {services.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                    <ShieldCheck size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
                                    <h3>No Authenticators Yet</h3>
                                    <p>Click "Add Service" to scan or paste a setup key.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {view === 'logs' && (
                    <div className="logs-container animate-fade-in">
                        <h2>Activity Logs</h2>
                        <div className="glass-panel" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td>
                                                <span className={`badge ${log.action === 'LOGIN' ? 'badge-info' : 'badge-success'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>{log.details}</td>
                                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No activity logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
            {showAddModal && createPortal(
                <div
                    className="modal-overlay animate-fade-in"
                    onClick={(e) => {
                        // Close if the click is directly on the overlay backdrop
                        if (e.target.classList.contains('modal-overlay')) {
                            setShowAddModal(false);
                            setQrError('');
                        }
                    }}
                >
                    <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0 }}>Add New Service</h3>
                                <div className="tab-container" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: '8px' }}>
                                    <button
                                        className={`btn ${addMethod === 'qr' ? 'btn-primary' : ''}`}
                                        style={{ flex: 1, padding: '0.5rem', background: addMethod !== 'qr' ? 'transparent' : '' }}
                                        onClick={() => { setAddMethod('qr'); setQrError(''); }}
                                    >
                                        <Upload size={16} style={{ marginRight: '0.5rem' }} /> Scan QR
                                    </button>
                                    <button
                                        className={`btn ${addMethod === 'manual' ? 'btn-primary' : ''}`}
                                        style={{ flex: 1, padding: '0.5rem', background: addMethod !== 'manual' ? 'transparent' : '' }}
                                        onClick={() => { setAddMethod('manual'); setQrError(''); }}
                                    >
                                        <KeyRound size={16} style={{ marginRight: '0.5rem' }} /> Manual Entry
                                    </button>
                                </div>
                            </div>
                            <button
                                className="btn"
                                style={{ padding: '0.5rem', background: 'transparent', marginLeft: '1rem' }}
                                onClick={() => { setShowAddModal(false); setQrError(''); }}
                                aria-label="Close Modal"
                            >
                                <X size={20} color="var(--text-secondary)" />
                            </button>
                        </div>

                        {addMethod === 'qr' ? (
                            <div className="qr-upload-section" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '12px', width: '100%', marginBottom: '1rem' }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={24} style={{ marginRight: '0.75rem' }} />
                                    Upload QR Image
                                </button>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Upload a screenshot of the QR Code from your provider (GitHub, Google, AWS, etc.)
                                </p>
                                {qrError && (
                                    <div className="alert alert-danger" style={{ marginTop: '1rem', color: 'var(--danger-color)', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(255, 71, 87, 0.1)', borderRadius: '8px' }}>
                                        {qrError}
                                    </div>
                                )}
                                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                    <button type="button" className="btn" onClick={() => setShowAddModal(false)} style={{ width: '100%' }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleAddService} className="animate-fade-in">
                                {qrError && (
                                    <div className="alert alert-danger" style={{ marginBottom: '1rem', color: 'var(--danger-color)', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(255, 71, 87, 0.1)', borderRadius: '8px' }}>
                                        {qrError}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Service Name</label>
                                    <input
                                        type="text"
                                        value={newServiceName}
                                        onChange={e => setNewServiceName(e.target.value)}
                                        placeholder="e.g. GitHub, Google, AWS"
                                        required
                                    />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Simply enter the name of the service for your own reference.</small>
                                </div>
                                <div className="form-group">
                                    <label>Secret Key (Base32)</label>
                                    <input
                                        type="text"
                                        value={newSecretKey}
                                        onChange={e => setNewSecretKey(e.target.value)}
                                        placeholder="e.g. JBSWY3DPEHPK3PXP"
                                        style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }}
                                        required
                                    />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Enter the raw string secret. Spaces will be automatically ignored.</small>
                                </div>
                                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                    <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Service</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default Dashboard;

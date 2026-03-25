import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import Topbar from '../components/Topbar.jsx'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [confirmation, setConfirmation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Set up reCAPTCHA (required by Firebase for phone auth)
  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    })
    return () => {
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear()
    }
  }, [])

  async function sendOTP() {
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return }
    setLoading(true)
    setError('')
    try {
      const fullPhone = '+91' + phone // India code
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      setError('Failed to send OTP. Check your number and try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError('')
    try {
      const result = await confirmation.confirm(otp)
      // Check if user has a profile in Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (!userDoc.exists()) {
        // New user — go to register to complete profile
        navigate('/register')
      } else {
        const data = userDoc.data()
        navigate(data.isAdmin ? '/admin' : '/dashboard')
      }
    } catch (err) {
      setError('Wrong OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Topbar />
      <div id="recaptcha-container"></div>
      <div className="aw">
        <div className="ac">
          <h2 className="at2">Welcome back</h2>
          <p className="as">Login with your mobile number</p>

          {error && (
            <div className="al d" style={{ marginBottom: '16px' }}>
              <div className="at">{error}</div>
            </div>
          )}

          {step === 'phone' ? (
            <>
              <div className="fg">
                <label className="fl">Mobile number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '9px 12px', background: '#f5f0e8', border: '1px solid #ddd0b8', borderRadius: '6px', fontSize: '13px', color: '#8a7050' }}>+91</span>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <button
                className="btn btp btf"
                onClick={sendOTP}
                disabled={loading}
                style={{ marginBottom: '12px' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div className="fg">
                <label className="fl">Enter OTP sent to +91{phone}</label>
                <input
                  type="tel"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }}
                />
              </div>
              <button className="btn btp btf" onClick={verifyOTP} disabled={loading} style={{ marginBottom: '12px' }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button className="btn btf" onClick={() => setStep('phone')} style={{ marginTop: '8px' }}>
                Change number
              </button>
            </>
          )}

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#8a7050', marginTop: '20px' }}>
            No account? <Link to="/register" style={{ color: '#b45309', fontWeight: '700' }}>Register here</Link>
          </p>
        </div>
      </div>
    </>
  )
}

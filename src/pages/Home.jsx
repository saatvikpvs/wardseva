import { Link } from 'react-router-dom'
import Topbar from '../components/Topbar.jsx'

export default function Home() {
  return (
    <>
      <Topbar />

      <section className="hero">
        <h1 className="ht">Your ward.<br /><span>Your voice.</span></h1>
        <p className="hs">
          Report potholes, broken streetlights, and drainage issues directly
          to GVMC — and track every fix.
        </p>
        <div className="hb">
          <Link to="/report" className="btn btp" style={{ padding: '13px 32px', fontSize: '15px' }}>
            Report an issue
          </Link>
          <Link to="/dashboard" className="btn" style={{ padding: '13px 32px', fontSize: '15px', background: 'transparent', color: '#a0896a', borderColor: '#3a2a10' }}>
            View my ward
          </Link>
        </div>
        <p style={{ fontSize: '12px', color: '#5a4020', marginTop: '20px' }}>
          Serving all 98 wards of Greater Visakhapatnam · GVMC
        </p>
      </section>

      <div className="stbar">
        <div className="sbi"><div className="sbn" style={{ color: '#e8a833' }}>1,284</div><div className="sbll">Issues reported</div></div>
        <div className="sbi"><div className="sbn" style={{ color: '#6aab4f' }}>558</div><div className="sbll">Resolved</div></div>
        <div className="sbi"><div className="sbn" style={{ color: '#e8a833' }}>98</div><div className="sbll">Wards covered</div></div>
        <div className="sbi"><div className="sbn" style={{ color: '#6aab4f' }}>4,200+</div><div className="sbll">Citizens registered</div></div>
      </div>

      <div className="fg2">
        {[
          { bg: '#fff8ec', color: '#e8a833', title: 'Report with location', desc: 'Upload a photo and pin the exact location. Your report goes directly to the ward officer assigned by GVMC.' },
          { bg: '#eafaf0', color: '#6aab4f', title: 'Track every fix', desc: 'Get notified when your complaint is assigned and resolved. Confirm the fix yourself or reopen if incomplete.' },
          { bg: '#fff0f0', color: '#dc2626', title: 'Accountability built in', desc: 'Issues older than 60 days auto-escalate to Commissioner. Wards with 10+ open complaints get bad governance flag.' },
          { bg: '#e8f4ff', color: '#378add', title: 'Support your neighbours', desc: 'See all complaints in your ward. Support issues you\'ve also noticed — high-support issues get priority repair.' },
          { bg: '#fff8ec', color: '#e8a833', title: 'Ward community board', desc: 'Post about upcoming festivals, local events, or community announcements. Stay connected with your ward.' },
          { bg: '#eafaf0', color: '#6aab4f', title: 'Ward profile', desc: 'Sachivalayam number, ward officer, police station and all essential local contacts in one place.' },
        ].map((f, i) => (
          <div className="fc" key={i}>
            <div className="fic" style={{ background: f.bg }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={f.color} strokeWidth="1.8" />
                <path d="M8 12l3 3 5-5" stroke={f.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="ftt">{f.title}</div>
            <div className="fd">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="cta">
        <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Ready to make your ward better?</p>
        <p style={{ fontSize: '13px', color: '#8a7050', marginBottom: '20px' }}>Join thousands of citizens already using WardSeva across Visakhapatnam.</p>
        <Link to="/register" className="btn btp" style={{ padding: '13px 36px', fontSize: '15px' }}>
          Register with your ward
        </Link>
      </div>

      <footer>
        WardSeva · Greater Visakhapatnam Municipal Corporation ·{' '}
        <Link to="/admin" style={{ color: '#e8a833' }}>GVMC Admin Login</Link>
      </footer>
    </>
  )
}

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Topbar from "../components/Topbar.jsx";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
const provider = new GoogleAuthProvider();
  // Initialize reCAPTCHA
useEffect(() => {
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );

      window.recaptchaVerifier.render();
    }
  } catch (error) {
    console.error("Recaptcha error:", error);
  }
}, []);  async function sendOTP() {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullPhone = "+91" + phone;
      const appVerifier = window.recaptchaVerifier;

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhone,
        appVerifier
      );

      setConfirmation(confirmationResult);
      setStep("otp");
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please try again.");
    }

    setLoading(false);
  }

  async function verifyOTP() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await confirmation.confirm(otp);

      const userDoc = await getDoc(doc(db, "users", result.user.uid));

      if (!userDoc.exists()) {
        navigate("/register");
      } else {
        const data = userDoc.data();
        navigate(data.isAdmin ? "/admin" : "/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
    }

    setLoading(false);
  }
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      navigate("/register");
    } else {
      const data = userDoc.data();
      navigate(data.isAdmin ? "/admin" : "/dashboard");
    }

  } catch (err) {
    console.error(err);
    setError("Google login failed");
  }
}
  return (
    <>
      <Topbar />

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="aw">
        <div className="ac">
          <h2 className="at2">Welcome back</h2>
          <p className="as">Login with your mobile number</p>

          {error && (
            <div className="al d" style={{ marginBottom: "16px" }}>
              <div className="at">{error}</div>
            </div>
          )}

          {step === "phone" ? (
            <>
              <div className="fg">
                <label className="fl">Mobile number</label>

                <div style={{ display: "flex", gap: "8px" }}>
                  <span
                    style={{
                      padding: "9px 12px",
                      background: "#f5f0e8",
                      border: "1px solid #ddd0b8",
                      borderRadius: "6px",
                      fontSize: "13px",
                      color: "#8a7050"
                    }}
                  >
                    +91
                  </span>

                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <button
                className="btn btp btf"
                onClick={sendOTP}
                disabled={loading}
                style={{ marginBottom: "12px" }}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="fg">
                <label className="fl">
                  Enter OTP sent to +91{phone}
                </label>

                <input
                  type="tel"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  style={{
                    letterSpacing: "8px",
                    fontSize: "20px",
                    textAlign: "center"
                  }}
                />
              </div>

              <button
                className="btn btp btf"
                onClick={verifyOTP}
                disabled={loading}
                style={{ marginBottom: "12px" }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                className="btn btf"
                onClick={() => setStep("phone")}
                style={{ marginTop: "8px" }}
              >
                Change number
              </button>
            </>
          )}
<button
  className="btn btf"
  onClick={loginWithGoogle}
  style={{
    marginTop: "12px",
    background: "#4285F4",
    color: "white",
    width: "100%"
  }}
>
  Login with Google
</button>
<p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#8a7050",
              marginTop: "20px"
            }}
          >
            No account?{" "}
            <Link
              to="/register"
              style={{ color: "#b45309", fontWeight: "700" }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Leaf, ShieldCheck, Sprout } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, changeLanguage } = useLanguage();
  const ui = (key) => t(`ui.${key}`);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) return toast.error(ui("enterCredentials"));
    setLoading(true);
    try {
      await login(form.email, form.password);
      const savedLanguage = JSON.parse(localStorage.getItem("user") || "{}").language;
      if (savedLanguage) changeLanguage(savedLanguage);
      if (!remember) localStorage.removeItem("tomato-ai-language");
      toast.success(ui("welcomeBack"));
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || ui("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-orb" />
        <div className="auth-logo"><span>🌿</span> {ui("brand")}</div>
        <div className="auth-visual-content">
          <div className="auth-kicker"><Sprout size={15} /> {ui("smartAgriculture")}</div>
          <h1>{ui("authHeadline")}</h1>
          <p>{ui("authDescription")}</p>
          <div className="auth-feature-list">
            <span><Leaf size={17} /> {ui("resnetIntelligence")}</span>
            <span><ShieldCheck size={17} /> {ui("weatherGuidance")}</span>
          </div>
        </div>
        <div className="auth-visual-tomato">🍅</div>
        <small className="auth-visual-footer">{ui("tagline")}</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">🌿 <strong>{ui("brand")}</strong></div>
          <div className="auth-heading">
            <span className="auth-kicker">{ui("welcomeBack")}</span>
            <h2>{ui("loginTitle")}</h2>
            <p>{ui("loginDescription")}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="premium-field"><span>{ui("emailUsername")}</span><input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
            <label className="premium-field"><span>{ui("password")}</span><div className="password-wrap"><input type={show ? "text" : "password"} placeholder={ui("enterPassword")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /><button type="button" onClick={() => setShow(!show)} aria-label={ui("togglePassword")}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <div className="auth-options"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {ui("rememberMe")}</label><button type="button" className="text-button" onClick={() => toast(ui("passwordResetHelp"))}>{ui("forgotPassword")}</button></div>
            <button className="auth-submit" disabled={loading}>{loading ? ui("signingIn") : <>{ui("loginButton")} <ArrowRight size={18} /></>}</button>
          </form>
          <div className="auth-divider"><span>{ui("or")}</span></div>
          <button className="guest-button" type="button" onClick={() => navigate("/register")}>{ui("continueGuest")} <ArrowRight size={16} /></button>
          <p className="auth-switch">{ui("newToAgri")} <Link to="/register">{ui("createAccount")}</Link></p>
        </div>
      </section>
    </main>
  );
}

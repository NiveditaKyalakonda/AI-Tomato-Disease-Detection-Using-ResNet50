import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", language: "en", location: "" });
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t, changeLanguage } = useLanguage();
  const ui = (key) => t(`ui.${key}`);
  const navigate = useNavigate();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || !form.location) return toast.error(ui("completeRequired"));
    if (form.password.length < 6 || form.password !== confirm) return toast.error(ui("passwordsMismatch"));
    setLoading(true);
    try {
      await register(form);
      changeLanguage(form.language);
      toast.success(ui("accountCreated"));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || ui("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-register">
      <section className="auth-visual">
        <div className="auth-visual-orb" />
        <div className="auth-logo"><span>🌿</span> {ui("brand")}</div>
        <div className="auth-visual-content"><div className="auth-kicker">{ui("fieldMonitored")}</div><h1>{ui("signupHeadline")}</h1><p>{ui("signupDescription")}</p></div>
        <div className="auth-visual-tomato">🌱</div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">🌿 <strong>{ui("brand")}</strong></div>
          <div className="auth-heading"><span className="auth-kicker">{ui("getStarted")}</span><h2>{ui("createFarmAccount")}</h2><p>{ui("signupFormDescription")}</p></div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid-two"><label className="premium-field"><span>{ui("fullName")}</span><input placeholder={ui("fullName")} value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" /></label><label className="premium-field"><span>{ui("location")}</span><div className="password-wrap"><input placeholder={ui("enterLocation")} value={form.location} onChange={(e) => update("location", e.target.value)} /><MapPin size={17} /></div></label></div>
            <label className="premium-field"><span>{ui("email")}</span><input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" /></label>
            <div className="form-grid-two"><label className="premium-field"><span>{ui("password")}</span><div className="password-wrap"><input type={show ? "text" : "password"} placeholder={ui("minimumPassword")} value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" /><button type="button" onClick={() => setShow(!show)} aria-label={ui("togglePassword")}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><label className="premium-field"><span>{ui("confirmPassword")}</span><input type="password" placeholder={ui("repeatPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></label></div>
            <label className="premium-field"><span>{ui("preferredLanguage")}</span><select value={form.language} onChange={(e) => update("language", e.target.value)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option><option value="ta">தமிழ்</option><option value="ml">മലയാളം</option><option value="mr">मराठी</option><option value="bn">বাংলা</option></select></label>
            <button className="auth-submit" disabled={loading}>{loading ? ui("creatingAccount") : <>{ui("createAccountButton")} <ArrowRight size={18} /></>}</button>
          </form>
          <p className="auth-switch">{ui("alreadyAccount")} <Link to="/login">{ui("loginButton")}</Link></p>
        </div>
      </section>
    </main>
  );
}

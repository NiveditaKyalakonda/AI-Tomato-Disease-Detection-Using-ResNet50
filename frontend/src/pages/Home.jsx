import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowRight, AudioLines, BookOpen,
  Check, ChevronDown, CloudSun, Cpu, Flame, Globe2, Leaf, Menu,
  ScanLine, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const heroImage = "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=1400&q=85";

const features = [
  { icon: Cpu, number: "01", title: "ResNet50 intelligence", text: "Transfer-learning based image classification built to recognize common tomato leaf diseases with clear confidence scores.", tone: "green" },
  { icon: Flame, number: "02", title: "Explainable by design", text: "Grad-CAM visualizations help you see which regions of the leaf influenced an AI prediction.", tone: "orange" },
  { icon: CloudSun, number: "03", title: "Weather-aware guidance", text: "Bring local weather signals together with disease insights to help plan timely crop care.", tone: "blue" },
  { icon: Globe2, number: "04", title: "Made for every grower", text: "Explore disease information and practical recommendations in supported Indian languages.", tone: "purple" },
];

export default function Home() {
  const navigate = useNavigate();
  const { languages, language, languageNames, changeLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToDetection = () => navigate(user ? "/prediction" : "/login", user ? undefined : { state: { from: { pathname: "/prediction" } } });
  const ui = (key) => t(`ui.${key}`);

  return (
    <div className="marketing-page">
      <header className="marketing-header">
        <Link to="/" className="brand-lockup" aria-label="AgriVision AI home">
          <span className="brand-symbol"><Leaf size={22} /><i /></span>
          <span>{ui("brand").replace(" AI", "")} <b>AI</b></span>
        </Link>
        <button className="marketing-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`marketing-nav ${menuOpen ? "marketing-nav-open" : ""}`} aria-label="Main navigation">
          <a href="#platform" onClick={() => setMenuOpen(false)}>{ui("platform")}</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{ui("howItWorks")}</a>
          <a href="#diseases" onClick={() => setMenuOpen(false)}>{ui("diseaseLibrary")}</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>{ui("about")}</a>
        </nav>
        <div className="marketing-actions">
          <label className="marketing-language" aria-label="Select language">
            <Globe2 size={16} />
            <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {languages.map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
          {user ? <Link to="/dashboard" className="marketing-signin">{ui("openDashboard")} <ArrowRight size={16} /></Link> : <Link to="/login" className="marketing-signin">{ui("signIn")} <ArrowRight size={16} /></Link>}
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-badge"><span className="badge-pulse" /> {ui("badge")}</div>
            <h1>{ui("heroTitle")}</h1>
            <p className="hero-description">{ui("heroDescription")}</p>
            <div className="hero-actions">
              <button className="button-primary" onClick={goToDetection}><ScanLine size={18} /> {ui("detectDisease")} <ArrowRight size={17} /></button>
              <a className="button-secondary" href="#diseases"><BookOpen size={17} /> {ui("exploreDiseases")}</a>
            </div>
            <div className="hero-proof">
              <span className="proof-avatars"><i>🌱</i><i>👩🏽‍🌾</i><i>🌿</i></span>
              <span><strong>{ui("builtForField")}</strong><small>{ui("researchGrower")}</small></span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-photo-frame">
              <img src={heroImage} alt="Healthy tomato plants growing in a field" />
              <div className="photo-shade" />
              <div className="hero-image-caption"><span><Leaf size={15} /> {ui("cropIntelligence")}</span><small>{ui("fieldInsights")}</small></div>
            </div>
            <div className="analysis-card">
              <div className="analysis-card-top"><span className="analysis-icon"><ScanLine size={17} /></span><span><small>{ui("illustrativeAnalysis")}</small><strong>{ui("leafHealthReport")}</strong></span><span className="verified-label"><Check size={12} /> {ui("sample")}</span></div>
              <div className="analysis-disease"><span className="disease-thumbnail"><Leaf size={21} /></span><span><small>{ui("exampleFinding")}</small><strong>{ui("earlyBlight")}</strong></span><span className="confidence-score">96.4<small>%</small></span></div>
              <div className="analysis-meter"><span /></div>
              <div className="analysis-meta"><span>{ui("exampleConfidence")}</span><span>{ui("moderateSeverity")}</span></div>
              <div className="analysis-footnote"><ShieldCheck size={14} /> {ui("sampleDisclaimer")}</div>
            </div>
            <div className="visual-orbit visual-orbit-one" /><div className="visual-orbit visual-orbit-two" />
          </div>
        </section>

        <section className="trust-strip" aria-label="Platform capabilities">
          <div><span className="trust-icon"><Cpu size={18} /></span><span><strong>{ui("resnetIntelligence")}</strong><small>{ui("transferLearning")}</small></span></div>
          <div><span className="trust-icon trust-icon-red"><Flame size={18} /></span><span><strong>Grad-CAM</strong><small>{ui("explainableByDesign")}</small></span></div>
          <div><span className="trust-icon trust-icon-blue"><CloudSun size={18} /></span><span><strong>{ui("weatherContext")}</strong><small>{ui("weatherGuidance")}</small></span></div>
          <div><span className="trust-icon trust-icon-purple"><AudioLines size={18} /></span><span><strong>{ui("multilingual")}</strong><small>{ui("languageDescription")}</small></span></div>
        </section>

        <section className="features-section" id="platform">
          <div className="section-heading">
            <span className="section-kicker">{ui("practical")}</span>
            <h2>{ui("featuresTitle")}</h2>
            <p>{ui("featuresDescription")}</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, number, title, text, tone }) => (
              <article className="feature-card" key={title}>
                <div className={`feature-icon feature-${tone}`}><Icon size={21} /></div>
                <span className="feature-number">{number}</span>
                <h3>{ui(({ "ResNet50 intelligence":"resnetIntelligence", "Explainable by design":"explainableByDesign", "Weather-aware guidance":"weatherGuidance", "Made for every grower":"multilingual" })[title])}</h3><p>{ui(({ "ResNet50 intelligence":"transferDescription", "Explainable by design":"gradcamDescription", "Weather-aware guidance":"weatherDescription", "Made for every grower":"languageDescription" })[title])}</p>
                <a href="#how-it-works" aria-label={`Learn how ${title} works`}><ArrowRight size={17} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow-section" id="how-it-works">
          <div className="workflow-visual">
            <div className="workflow-image"><img src={heroImage} alt="Tomato crop used to illustrate the disease detection workflow" /></div>
            <div className="workflow-callout"><Sparkles size={16} /><span><strong>From image to insight</strong><small>One simple, guided workflow</small></span></div>
            <div className="workflow-ring" />
          </div>
          <div className="workflow-copy">
            <span className="section-kicker">{ui("clearerCare")}</span>
            <h2>{ui("understandSignal")}</h2>
            <p>{ui("workflowDescription")}</p>
            <div className="workflow-steps">
              <div><span>1</span><p><strong>{ui("uploadPhoto")}</strong><small>{ui("uploadPhotoHelp")}</small></p></div>
              <div><span>2</span><p><strong>{ui("reviewResult")}</strong><small>{ui("reviewResultHelp")}</small></p></div>
              <div><span>3</span><p><strong>{ui("exploreGuidance")}</strong><small>{ui("exploreGuidanceHelp")}</small></p></div>
            </div>
            <button className="button-primary" onClick={goToDetection}>{ui("tryDetection")} <ArrowRight size={17} /></button>
          </div>
        </section>

        <section className="disease-band" id="diseases">
          <div>
            <span className="section-kicker">{ui("knowSigns")}</span>
            <h2>{ui("fieldGuide")}</h2>
            <p>{ui("fieldGuideDescription")}</p>
            <Link to="/diseases" className="button-light">{ui("browseLibrary")} <ArrowRight size={17} /></Link>
          </div>
          <div className="disease-highlights">
            <div><span className="condition-dot condition-orange" /><span><strong>{ui("earlyBlight")}</strong><small>{ui("fungalDisease")} · {ui("leafLesions")}</small></span><ArrowRight size={16} /></div>
            <div><span className="condition-dot condition-red" /><span><strong>{ui("lateBlight")}</strong><small>{ui("oomycete")} · {ui("rapidSpread")}</small></span><ArrowRight size={16} /></div>
            <div><span className="condition-dot condition-green" /><span><strong>{ui("leafMold")}</strong><small>{ui("fungalDisease")} · {ui("humidConditions")}</small></span><ArrowRight size={16} /></div>
            <div className="disease-note"><ShieldCheck size={16} /> {ui("informationalOnly")}</div>
          </div>
        </section>

        <section className="closing-cta" id="about">
          <span className="cta-leaf"><Leaf size={21} /></span>
          <span className="section-kicker">{ui("tagline")}</span>
          <h2>{ui("closingTitle")}</h2>
          <p>{ui("closingDescription")}</p>
          <button className="button-primary" onClick={goToDetection}><ScanLine size={18} /> {ui("startAnalysis")} <ArrowRight size={17} /></button>
          <small className="cta-disclaimer"><ShieldCheck size={14} /> {ui("decisionSupport")}</small>
        </section>
      </main>

      <footer className="marketing-footer">
        <Link to="/" className="brand-lockup"><span className="brand-symbol"><Leaf size={20} /><i /></span><span>AgriVision <b>AI</b></span></Link>
        <span>{ui("productTitle")}</span>
        <span>{ui("tagline")}</span>
      </footer>
    </div>
  );
}

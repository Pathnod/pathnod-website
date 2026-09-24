export function HomePage() {
  return (
    <main id="main">
      <section className="hero shell">
        <div className="hero-copy" data-scroll-reveal>
          <p className="eyebrow"><span className="eyebrow-line" /> Evidence for the physical world</p>
          <h1>Trust what is<br /><em>on the ground.</em></h1>
          <p className="hero-lede">GPS can be spoofed. Self-reported uptime can be wrong. Pathnod is building independent, privacy-conscious observations for physical networks.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/operators/">Operate a DePIN network <span aria-hidden="true">↗</span></a>
            <a className="button button-text" href="/beta/">Join the beta waitlist <span aria-hidden="true">→</span></a>
          </div>
          <p className="hero-note">Early research and prototyping · No public network yet</p>
        </div>
        <div className="hero-visual" data-scroll-reveal role="img" aria-label="A registered physical device answers a local Bluetooth challenge with a signed reply; nearby phones provide independent observations.">
          <div className="visual-topline"><span>FIELD NOTE / 001</span><span>LOCAL SIGNAL</span></div>
          <div className="visual-grid">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="device-core"><span className="device-icon" aria-hidden="true">⌁</span><span>PHYSICAL<br />DEVICE</span></div>
            <span className="witness witness-one"><span /> 01 / witness</span>
            <span className="witness witness-two"><span /> 02 / witness</span>
            <span className="witness witness-three"><span /> 03 / witness</span>
          </div>
          <div className="visual-flow" aria-hidden="true">
            <span><strong>01 / DEVICE</strong>Registered equipment</span>
            <span><strong>02 / LOCAL EXCHANGE</strong>BLE challenge + signed reply</span>
            <span><strong>03 / WITNESSES</strong>Independent observations</span>
          </div>
          <div className="visual-bottomline"><span>PATHNOD / EARLY CONCEPT</span><span>↗ 2026</span></div>
        </div>
      </section>

      <div className="chapter-strip"><div className="shell strip-inner"><span>01 / The blind spot</span><span>02 / The approach</span><span>03 / Work with us</span></div></div>

      <section id="problem" className="section shell problem-section">
        <div className="section-label">01 — The blind spot</div>
        <div className="section-body" data-scroll-reveal>
          <h2>Networks know what a device <em>reports.</em><br />Not always what is <em>there.</em></h2>
          <div className="section-columns">
            <p>Imagine a network paying thousands of chargers, hotspots or sensors for being deployed where they claim. A device-reported GPS coordinate alone is not independent evidence.</p>
            <p>Physical inspections do not scale. Pathnod explores a new layer of observation: nearby smartphones interacting directly with devices over Bluetooth.</p>
          </div>
          <div className="statement"><span className="statement-number">THE QUESTION</span><p>How can an operator gain confidence that infrastructure is actually present, without sending an inspector to every site?</p></div>
        </div>
      </section>

      <section id="approach" className="approach-section">
        <div className="shell">
          <div className="section-label">02 — The approach</div>
          <div className="approach-heading" data-scroll-reveal><h2>A different kind of<br /><em>field evidence.</em></h2><p>Built around local interaction, independent witnesses and measured confidence—not a single “verified location” claim.</p></div>
          <div className="steps">
            <article className="step" data-scroll-reveal><span className="step-index">01 / DISCOVER</span><div className="step-symbol" aria-hidden="true">◎</div><h3>A phone passes nearby</h3><p>A participating phone detects a registered device's Bluetooth service when it comes within radio range.</p></article>
            <article className="step" data-scroll-reveal><span className="step-index">02 / CHALLENGE</span><div className="step-symbol" aria-hidden="true">⌁</div><h3>The device responds</h3><p>A fresh challenge asks the device to sign a response with its own key, linking the observation to that device.</p></article>
            <article className="step" data-scroll-reveal><span className="step-index">03 / CORROBORATE</span><div className="step-symbol" aria-hidden="true">✳</div><h3>Signals add up</h3><p>Multiple observations can give operators a stronger, auditable signal than self-reporting alone.</p></article>
          </div>
          <div className="caveat"><span>WHAT THIS DOES NOT CLAIM</span><p>A nearby observation is not proof of exact GPS location, a unique human, or the absence of collusion. Those limits shape the product.</p></div>
        </div>
      </section>

      <section className="section shell status-section">
        <div className="section-label">Where we are</div>
        <div className="section-body status-body" data-scroll-reveal><h2>Building the first<br /><em>real-world test.</em></h2><p>Pathnod is in an early validation stage. We are prototyping the device–phone exchange and speaking with physical network operators. The broader privacy and on-chain architecture is a direction under development, not a deployed guarantee.</p><a className="inline-link" href="https://github.com/Pathnod" target="_blank" rel="noopener noreferrer">Follow the work on GitHub <span aria-hidden="true">↗</span></a></div>
      </section>

      <section id="work-with-us" className="participate-section"><div className="shell"><div className="section-label">03 — Work with us</div><h2 data-scroll-reveal>Two ways to help shape<br /><em>what comes next.</em></h2><div className="path-cards">
        <article className="path-card path-card-dark" data-scroll-reveal><div><span className="card-kicker">FOR NETWORK OPERATORS</span><h3>Tell us where verification breaks down.</h3><p>Run a DePIN or other physical network? Share how you verify deployment today and explore a potential pilot with us.</p></div><a href="/operators/" className="card-link">Talk to the team <span aria-hidden="true">↗</span></a></article>
        <article className="path-card path-card-light" data-scroll-reveal><div><span className="card-kicker">FOR FUTURE TESTERS</span><h3>Be first to try Pathnod.</h3><p>Join the beta waitlist. We will reach out when there is a suitable test for your device and location.</p></div><a href="/beta/" className="card-link">Join the waitlist <span aria-hidden="true">↗</span></a></article>
      </div></div></section>
    </main>
  );
}

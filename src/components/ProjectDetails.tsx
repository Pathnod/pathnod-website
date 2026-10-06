const team = [
  { name: 'Théo Dubois', alias: 'Thox', role: 'Full-stack software engineer', photo: 'theo', linkedin: 'https://www.linkedin.com/in/th%C3%A9o-dubois-662407194/', bio: 'Software engineer with nearly two years of experience building SaaS products, developer tools and open-source projects. Works with TypeScript, React, Go, Rust, APIs and PostgreSQL. Blockchain builder and hackathon finalist.' },
  { name: 'Zakaria Chaikhi', alias: 'Kazai', role: 'Blockchain engineer', photo: 'zak', linkedin: 'https://www.linkedin.com/in/zakaria-chaikhi-55907b2a0/', bio: 'Blockchain engineer who loves creating new things, building useful products and contributing to open source.' },
  { name: 'Antonin Chaikhi', alias: 'Lornmalvo777', role: 'Product manager', photo: 'antonin', linkedin: 'https://www.linkedin.com/in/antonin-chaikhi/', bio: 'Banking IT professional with eight years of experience as a Product Owner and Product Manager. Shapes digital products and aligns business, technology, risk and compliance teams in Agile environments.' },
];

const questions = [
  ['What does Pathnod actually check?', 'A nearby phone sends a fresh Bluetooth challenge and verifies the device’s signed response. It provides a signal that the device answered, not proof of an exact GPS position, a unique person or the absence of collusion.'],
  ['Why Bluetooth?', 'Bluetooth lets a participating phone interact directly with nearby equipment, rather than relying only on what the equipment reports remotely. Radio range varies with the environment; it is not a precise distance measurement.'],
  ['Why start with iPhone? What about Android?', 'Our first working phone prototype is on iOS, so initial tests focus on iPhone. You can join the waitlist without one. Android support has no announced release date; an invitation depends on your device and the available test.'],
  ['What about privacy?', 'The waitlist collects only the details described in our privacy notice. The prototype and its broader privacy architecture are still being developed: we do not claim that every observation is already anonymous or that a production privacy guarantee is deployed.'],
  ['Will this drain my battery?', 'We are still measuring battery use on real devices. We do not yet have a reliable battery-impact figure or promise always-on background operation. Test instructions will explain what a session involves.'],
  ['Do I need a wallet? Will I earn rewards?', 'No wallet is needed to join the waitlist. No rewards, token allocation or payments are promised during the beta. Signing up does not install an app or commit you to testing.'],
];

export function ProjectDetails() {
  return <>
    <section id="team" className="section shell" aria-labelledby="team-heading">
      <div className="section-label">The people</div>
      <div className="section-body" data-scroll-reveal>
        <h2 id="team-heading">Who’s building <em>Pathnod.</em></h2>
        <p className="section-intro">Three builders working on an early-stage, open-source project for the Colosseum hackathon.</p>
        <div className="team-grid">{team.map(member => <article className="team-card" key={member.photo}>
          <img src={`/assets/team-${member.photo}.jpg`} alt={`Portrait of ${member.name}`} width="100" height="100" loading="lazy" decoding="async" />
          <div><h3>{member.name}</h3><span className="team-alias">{member.alias} · {member.role}</span><p>{member.bio}</p><a className="inline-link" href={member.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></div>
        </article>)}</div>
      </div>
    </section>
    <section id="faq" className="section shell faq-section" aria-labelledby="faq-heading">
      <div className="section-label">Questions</div>
      <div className="section-body" data-scroll-reveal><h2 id="faq-heading">Before you <em>join.</em></h2>
        {questions.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p>{question === 'What about privacy?' && <a className="inline-link" href="/privacy/">Read the privacy notice</a>}</details>)}
      </div>
    </section>
  </>;
}

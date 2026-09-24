import { SubpageLayout } from '../components/SubpageLayout';

export function OperatorsPage() {
  return <SubpageLayout
    audience="operator"
    eyebrow="For physical network operators"
    title={<>Let's understand<br /><em>the blind spots.</em></>}
    introduction="We are speaking with DePIN teams and infrastructure operators about the cost of knowing what is really deployed in the field."
    aside={<>Your workflow first.<br />Our prototype second.</>}
    formEyebrow="USER RESEARCH"
    formIntroTitle={<>A focused<br />conversation.</>}
    formIntro="Tell us how your network verifies devices today. We would like to hear where self-reported data, manual inspections, and fraud controls fall short."
    footnote="This is a research conversation, not a sales call or a claim that Pathnod is ready for production."
    panelTitle="Talk to the team"
    panelIntro="Share enough context for us to prepare a useful conversation."
    secondaryTitle="WHAT WE WOULD DISCUSS"
    details={[
      { title: 'Today’s workflow', body: 'How deployment and presence are verified across your network.' },
      { title: 'Failure modes', body: 'Where GPS, self-reporting, inspections or incentives become unreliable.' },
      { title: 'Potential pilot', body: 'Whether an independent observation signal could fit your operation.' },
    ]}
  />;
}

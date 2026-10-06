import { SubpageLayout } from '../components/SubpageLayout';

export function BetaPage() {
  return <SubpageLayout
    audience="beta"
    eyebrow="For future testers"
    title={<>Be part of the<br /><em>first field tests.</em></>}
    introduction="Pathnod is still in development. Join the list if you would like to hear about a suitable beta when testing opens."
    aside={<>Observe the physical world.<br />Help us make the signal better.</>}
    formEyebrow="THE BETA WAITLIST"
    formIntroTitle={<>Early access,<br />when it is ready.</>}
    formIntro="Signing up does not install an app or commit you to a test. We will contact you only about relevant Pathnod beta opportunities."
    footnote="No wallet needed. No rewards are promised during the beta."
    panelTitle="Join the waitlist"
    panelIntro="A few details help us invite the right testers first."
    secondaryTitle="WHAT TO EXPECT"
    details={[
      { title: 'iPhone first', body: 'Our first working phone prototype is on iOS, so initial tests focus on iPhone. No iPhone? You can still join the list. Android support has no announced date; invitations depend on your device and the available test.' },
      { title: 'Clear test instructions', body: 'You will know what the test involves before deciding to participate.' },
      { title: 'Your choice', body: 'You can say no; joining the list creates no obligation.' },
    ]}
  />;
}

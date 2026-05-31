// Every guided tutorial in the product lives here. Each page has its own tour,
// and each tour is a short list of steps that point at a real part of the screen
// through a data-tour attribute. Keeping the copy in one file means a new
// engineer can tune the whole onboarding voice without touching any page.
//
// Voice: your analyst buddy leaning over your shoulder. Warm, excited about the
// numbers and rooting for you. Plain words. No jargon. Each step earns one click.

export type Placement = 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  // CSS selector for the element to highlight, almost always a data-tour hook.
  selector: string
  title: string
  body: string
  // Preferred side for the card. The guide flips it automatically when there is
  // not enough room, so this is only a hint.
  placement?: Placement
}

export interface PageTour {
  id: string
  // Decides whether this tour belongs to the current route.
  match: (pathname: string) => boolean
  steps: TourStep[]
}

// Tours are checked in order, so more specific routes come first.
export const PAGE_TOURS: PageTour[] = [
  {
    id: 'player',
    match: (p) => p.startsWith('/player/'),
    steps: [
      {
        selector: '[data-tour="player-header"]',
        title: 'Meet your guy',
        body: 'Everything that matters sits right up top. Name, position and the FieldVision rating. One glance and you have got him.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="player-tabs"]',
        title: 'Now we dig in',
        body: 'This is where the fun is. Stats, every match he played, scout notes and film. Tap around and explore.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'team',
    match: (p) => p.startsWith('/team/'),
    steps: [
      {
        selector: '[data-tour="team-header"]',
        title: 'Scout the enemy',
        body: 'This is the other side. Where they sit in the table, their best eleven and the full squad. Now you know what is coming.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'dashboard',
    match: (p) => p === '/' || p.startsWith('/dashboard'),
    steps: [
      {
        selector: '[data-tour="nav-brand"]',
        title: 'Hey, welcome in',
        body: 'Stick with me for thirty seconds and you will own this place. Right here is home base.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="nav-links"]',
        title: 'This is your map',
        body: 'Your squad, your strategy, the market and the league all live up here. One click gets you anywhere.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dash-club"]',
        title: 'Make it yours',
        body: 'Switch the club you run whenever you want. Every screen redraws itself around your pick.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dash-metrics"]',
        title: 'The quick read',
        body: 'Position, points, goals and form. Your whole season sitting in one tidy strip.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dash-evaluation"]',
        title: 'Here is the good stuff',
        body: 'This is where we flex. Team DNA and the league landscape straight out of our vision model.',
        placement: 'top',
      },
      {
        selector: '[data-tour="dash-insights"]',
        title: 'Let the model talk',
        body: 'It watches every match and tells you what your players do best. Tap any card to open it up.',
        placement: 'top',
      },
      {
        selector: '[data-tour="dash-upload"]',
        title: 'Feed it some film',
        body: 'Any angle. Any quality. We turn raw video into all these numbers. That is the whole trick.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'squad',
    match: (p) => p.startsWith('/squad'),
    steps: [
      {
        selector: '[data-tour="squad-pitch"]',
        title: 'Your starting eleven',
        body: 'Here is your lineup on real grass. Click two players to swap them or just drag a card onto the pitch.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="squad-formation"]',
        title: 'Switch it up',
        body: 'Pick a new shape and the eleven slides itself into the best fit.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="squad-toggles"]',
        title: 'Show me a play',
        body: 'Flip on the tactical runs or open the AI playbook and watch a move animate across the pitch.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="squad-bench"]',
        title: 'Do not forget the bench',
        body: 'Everyone not starting is waiting down here. Hover to open it then pull someone into the side.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'strategy',
    match: (p) => p.startsWith('/strategy'),
    steps: [
      {
        selector: '[data-tour="strategy-timeline"]',
        title: 'Look into the future',
        body: 'Scrub a season and watch the kids age up and graduate. Empty spots light up where you will need bodies.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="strategy-plans"]',
        title: 'Keep three plans ready',
        body: 'Park Plan A, B and C side by side so you are never building from scratch again.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="strategy-depth"]',
        title: 'Check your depth',
        body: 'Every position shows your starter and who is behind them, pushed forward to the season you picked.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'development',
    match: (p) => p.startsWith('/development'),
    steps: [
      {
        selector: '[data-tour="dev-metrics"]',
        title: 'Where the growth is',
        body: 'Age, eligibility and room to get better. In the college game that is the only currency that counts.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dev-tabs"]',
        title: 'Slice it your way',
        body: 'Eligibility ledgers, roster flow and a value matrix that digs up hidden gems on your own bench.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'market',
    match: (p) => p.startsWith('/market') || p.startsWith('/search'),
    steps: [
      {
        selector: '[data-tour="market-search"]',
        title: 'Just say it',
        body: 'Type the player you want like you are talking to me. The model turns your words into real filters.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="market-examples"]',
        title: 'Need a spark',
        body: 'Tap an example and see how a search reads. Borrow one then make it your own.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="market-quicklinks"]',
        title: 'Or just dive in',
        body: 'Skip the typing and browse by position, the top rated or your saved shortlist.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'roles',
    match: (p) => p.startsWith('/roles'),
    steps: [
      {
        selector: '[data-tour="finder-search"]',
        title: 'Describe your dream guy',
        body: 'Type the kind of player you want in plain words. The AI hands back a ranked shortlist.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="finder-playstyles"]',
        title: 'Or start with a style',
        body: 'Tap a ready made playstyle and it fills in the qualities for you. A one tap head start.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="finder-results"]',
        title: 'Watch it rank live',
        body: 'Every score and reason updates the second you change your search. Tap a player to open them.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'league',
    match: (p) => p.startsWith('/league'),
    steps: [
      {
        selector: '[data-tour="league-tabs"]',
        title: 'The whole division',
        body: 'Table, fixtures, player leaders and team stats for everyone. Tap a tab to switch the view.',
        placement: 'bottom',
      },
    ],
  },
]

export function tourForPath(pathname: string): PageTour | null {
  return PAGE_TOURS.find((tour) => tour.match(pathname)) ?? null
}

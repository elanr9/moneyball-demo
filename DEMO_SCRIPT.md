# FieldVision Demo Script

A five minute walkthrough for the YC demo. Every screen runs on the simulated
universe, so the data is instant and identical on every reload. Default managed
team is Brandeis. The marquee player is Elan Romo.

## The story in one line

FieldVision is AI Moneyball for soccer. Upload your game film and we turn it
into a global player database, a FIFA style squad manager, a scouting market,
and a FotMob style league center, with advanced metrics no other D3 provider
has.

## Flow

### 1. Coach dashboard (`/dashboard`)

- Land here. Point out the hero strip: league position, points, goals for and
  against, squad rating, team FV rating, and recent form.
- Highlight the green FieldVision Insights panel. These talking points are auto
  generated from the exclusive metrics like progressive runs and press
  intensity. This is the Moneyball moment. Click any insight to jump to that
  player.
- Show the recent results and the roster spotlight (top rated and top scorer).
- Point at the film upload dropzone to tell the upload your games story.
- Use the Managed Club selector to switch teams live if asked.

### 2. Squad (`/squad`)

- Open Squad from the sidebar. The best XI fills the pitch in the team
  formation, FIFA Ultimate Team style.
- Switch the formation from the dropdown and watch the XI rebuild.
- Click a slot to swap any squad player in. Click a card to open the profile.
- Call out the bench and reserves below.

### 3. Player profile (`/player/:teamId/:slug`)

- Click Elan Romo from the squad or an insight.
- Show the big card, identity, overall and potential, and the attribute radar.
- Scroll the season stat groups. The green tiles are FieldVision exclusives.
- Open the Match Log tab for the FV rating trend and the per match table.
- Open the Highlights tab for the auto generated clip grid.

### 4. Transfer market (`/market`)

- Open Transfer Market from the scout sidebar (toggle to Scout mode).
- Type a natural language search like "left footed winger with elite
  progressive runs".
- Show the filter rail, the result cards, compare, and similar players.

### 5. League center (`/league`)

- Open League. Walk the Table tab. Highlight the managed team and the top eight
  postseason cutoff.
- Fixtures and Results tab shows the full season plus the postseason bracket.
- Player Stats tab is the FotMob leaderboards. Point at a FieldVision exclusive
  leaderboard.
- Team Stats tab ranks every club.

### 6. Opponent scouting (`/team/:teamId`)

- Click any opponent crest in the table.
- Show their likely XI in their formation, the full squad by position, and the
  schedule. This is how a coach scouts the next opponent.

## Closing line

All of this comes from uploaded film. One pipeline gives a coach their squad, a
scout the market, and the whole league a stat center, with metrics that have
never existed at the D3 level.

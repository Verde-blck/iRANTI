# Irin Ajo: product design spec

Reference device: a 360 × 800 dp Android phone with 2 GB of RAM (Tecno Spark and Infinix Hot class). All sizes are dp on Android and pt on iOS. Sample copy uses Tolu, who walks in Lagos.

## 1. User flows

### 1.1 First launch to first completed journey

1. **Splash.** Holds until fonts and the local database are ready, 1.2 s at most. Never waits for the network.
2. **Welcome.** Get Started goes to step 3. I Already Have an Account goes to Sign In (2.6), then straight to Home with their settings and history synced down.
3. **Motivation.** Pick one or more of four cards, then Continue. Skip counts as Just Walk.
4. **Basics.** Name, daily distance goal (default 4.0 km), gender, language. Prefer Not to Say opens an inline voice picker. Choosing Pidgin switches the rest of onboarding to Pidgin at once.
5. **Permissions.** Location explainer, then the native dialog. Then the Motion & Fitness (iOS) or Physical Activity (Android) explainer, then its dialog. On Tecno, Infinix, itel, Xiaomi, Oppo, Realme and Samsung phones, a third step asks them to let Irin Ajo run in the background. Declining any step continues with reduced features (2.5).
6. **Home, first run.** Ring at 0.0 km of 4.0 km, streak card says a first walk starts the streak, Recent Journeys shows its empty state.
7. **Start Walk.** The button expands into the Walk screen. Tracking starts on the tap, before the first GPS fix.
8. **First 1,000 steps.** The voice announcement plays from the bundled voice pack and music ducks under it.
9. **Hold to End.** Journey Complete plays its sequence and reveals the First Walk keepsake.
10. **Done.** A sheet asks about reminders in context: "Want a nudge tomorrow morning?" Allow triggers the native notification dialog (Android 13+ and iOS). Then Home, with the ring, a 1-day streak and the first journey card.
11. **Backup.** No account is needed to walk. Profile shows a backup card, and the avatar on Home carries a small Forest dot until they sign in or dismiss it.

Why no sign-up before the first walk: an OTP that arrives late on a weak network should never stand between someone and their first step.

### 1.2 Returning user, daily walk

1. A reminder arrives at their usual walking time, learned from their last 14 walks (default 6:30 am): "Good morning, Tolu. It's 25°C, a good hour to walk." Tap opens Home.
2. Home shows today's ring, the streak, and a heat line if it is 32°C or hotter.
3. Two ways to start:
   - Start Walk on Home starts tracking immediately, no planned route.
   - The centre Walk tab opens Walk Ready (2.8) with up to three routes that would complete today's goal. They pick one and tap Start This Walk; the planned route shows on the map.
4. During the walk: an announcement every 1,000 steps, a hydration prompt when due, live sharing if Walk Safe is on. Locking the phone stops nothing; the lock screen shows distance and time.
5. Optional: Pause opens Walk Paused. Resume returns to Walk.
6. Hold to End opens Journey Complete. Done returns them to the tab they started from, with Home updated. Share Journey opens the native share sheet with a generated image.
7. If they have a streak running and haven't walked 1 km by 7:00 pm, one reminder: "A short walk keeps your 6-day streak going."

### 1.3 Offline walk, then sync

1. App opens with no data. Home looks the same, with one caption under the name: "Offline. Your walks are saved on this phone."
2. Start Walk. GPS works without data, but the first fix can take up to a minute without assisted GPS. Steps count straight away, and distance comes from steps until the fix lands.
3. The map uses cached tiles for their usual area. Outside it, the map shows plain land colour with the route and position marker, and the caption "Map offline. Your route is still recording."
4. Announcements play from cached clips. Hydration uses the last known temperature if it is under 3 hours old, otherwise the time-of-day table in 2.10.
5. If Walk Safe is on, sharing pauses and the Walk screen shows SHARING PAUSED. Send a Text Instead opens the SMS composer with a prefilled message, which works on any SIM with no data.
6. Hold to End. Journey Complete uses a cached map snapshot, or the route on plain ground if tiles are missing. Keepsakes are checked on the phone and revealed as normal. The journey is named by time of day only ("Evening walk") until it can be reverse-geocoded.
7. Journey rows show a small CloudOff icon while unsynced.
8. The connection returns. The sync queue runs while the app is open, or in a background task (WorkManager on Android, BGTaskScheduler on iOS). Order: journeys oldest first (encoded polyline, about 5 KB each), then keepsakes, then profile and settings. After upload, neighbourhood names, new-street counts and landmark highlights fill in, and the CloudOff icons disappear. No toast.
9. Conflicts: journeys and keepsakes get UUIDs on the phone, so they never collide. Profile fields use last write wins. The phone's earned date for a keepsake is final.
10. Large downloads (map tiles, Pidgin voice packs) wait for Wi-Fi unless the user allows mobile data in Settings > Data.

## 2. Screens

### 2.0 Shared rules

These apply to every screen and aren't repeated below.

- **Tab bar.** Home, Explore, Walk, Journey, Profile. Forest, 64 dp tall plus the bottom inset. Full spec in 3.4. Hidden on Walk, Journey Complete, onboarding, and while the keyboard is open.
- **Walk in progress.** If a walk is running and they leave the Walk screen, every tab screen shows a 40 dp Forest strip under the status bar: "WALKING · 2.3 km · 18:04" with a ChevronUp. Tap returns to Walk.
- **Back.** Android back and iOS swipe-back work on every stacked screen. On Walk, back minimises to the previous tab and the walk keeps running. On Journey Complete, back equals Done. On a tab root, back goes to Home; on Home it leaves the app. Walk and Journey Complete open as full-screen modals with swipe-to-dismiss turned off on iOS, so a stray swipe can't hide a live walk.
- **Safe areas.** Use react-native-safe-area-context everywhere. Content stays inside the insets; backgrounds, maps and the tab bar fill behind them. Floating controls sit 16 dp above the bottom inset (iOS home indicator or Android gesture bar).
- **Offline.** Offline is normal, not an error. One Caption line with a CloudOff icon on screens that need the network for something. No banners, no red.
- **Loading.** Local data renders in the first frame. Skeletons (static Sand Deep blocks, no shimmer) appear only if a read takes longer than 150 ms. Network content shows skeletons, then content. Never a full-screen spinner.
- **Errors.** Inline, inside the component that failed, with one action (usually Try Again). Message in Ink with a CircleAlert icon in Error.
- **Lock screen.** While a walk runs, Android shows an ongoing notification (the foreground service) with "WALKING · 4.8 km", "54:12 · 6,241 steps" and a Pause action. While walking, the timer ticks in the notification's header (Android's built-in chronometer, so the notification needn't update every second) and the text reads "6,241 steps"; paused, the text reads "54:12 · 6,241 steps" and the action becomes Resume. iOS shows a Live Activity with the same values and a Pause button. Why: they can check progress from the lock screen, and Android needs the notification for background tracking anyway.
- **Formats.** 4.8 km, 6,241 steps, 12 Oct 2026, 6:12 am (12-hour, lowercase am and pm), timer 54:12 then 1:04:12, pace 11:17 /km, 31°C.
- **Copy.** Headings and body in sentence case. Buttons, chips and tabs in Title Case. Uppercase only in status labels. At most one Pidgin or Yoruba touch per English screen, marked "(touch)" in the copy tables. Status labels stay in English in both languages. Why: they are short, recognisable, and match the lock screen.

### 2.1 Splash

**Purpose:** show the brand while local data loads.

**Layout, top to bottom**
1. Forest fills the whole screen, including behind the status and navigation bars.
2. Path mark, 64 dp, exactly centred (matches the Android 12 system splash position): the Ọ̀nà footpath, a gentle S-curve walked in Sand steps (round dots, every third a short dash, as in the Ọ̀nà pattern), from a hollow Sand start ring to a Papaya arrival dot. The same mark is the app icon (3.10). Source: assets/brand/path-mark.svg.
3. 16 dp gap. Wordmark "Irin Ajo", Manrope 800, 36/40, Sand, -0.5 tracking.
4. 8 dp gap. Tagline "Every Step, a Journey.", Plus Jakarta Sans Medium 16/24, Sand.
5. Bottom 120 dp: one Ọ̀nà pattern band (Sage at 35% on Forest), flush with the bottom edge, running behind the navigation bar.

**Components and states**
- Default: as above.
- Loading: if the database takes longer than 3 s (first launch after an update with a migration), a Sand Caption line appears 24 dp under the tagline. No spinner.
- Error: the database fails to open. The caption reads as below, with a Secondary button (Sand surface) Try Again. After two failures, Contact Support opens a prefilled email.
- Empty: none.

**Offline:** identical. Splash never touches the network.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Tagline | Every Step, a Journey. | Every Step, a Journey. (brand line, not translated) |
| Slow load | Getting your journeys ready. | We dey arrange your journeys. |
| Error | Something went wrong opening your journeys. | Something no work as we open your journeys. |
| Buttons | Try Again · Contact Support | Try Again · Contact Support |

**Motion:** Android 12+ shows the system splash first (Forest with the path mark only, an API limit). The app splash keeps the mark in the same place and fades in the wordmark, tagline and pattern over 200 ms. The iOS launch screen matches the app splash's first frame, so nothing jumps. Then a 250 ms cross-fade to Welcome or Home.

### 2.2 Onboarding a: Welcome

**Purpose:** say what Irin Ajo is and start setup.

**Layout, top to bottom**
1. Top 44% of the screen: Forest panel, edge to edge behind the status bar. Path mark at 96 dp centred in the panel. An Ọ̀nà pattern band (Sage at 35%) runs along the panel's bottom 72 dp.
2. 32 dp gap. Headline, Screen title, Ink, left-aligned.
3. 12 dp gap. Body, Stone.
4. Flexible space.
5. Get Started, Primary, full width.
6. 12 dp gap. I Already Have an Account, Secondary (White surface), full width.
7. 16 dp above the bottom inset.

**Components and states**
- Buttons: default, pressed. No empty, loading or error states here; Sign In handles its own.

**Offline:** both buttons work. Sign In shows its offline state.

**Copy** (shown in English on first launch; the Pidgin strings appear if they sign out after choosing Pidgin)

| Element | English | Pidgin |
|---|---|---|
| Headline | Your next journey starts with a step. | Your next journey go start with one step. |
| Body | Walk more, see where you've been, and watch your city open up one street at a time. | Waka more, see where you don pass, and watch your city open up one street at a time. |
| Buttons | Get Started · I Already Have an Account | Make We Start · I Don Get Account |

**Motion:** none.

### 2.3 Onboarding b: Motivation

**Purpose:** learn why they walk, so Home and Walk Ready lead with what matters to them.

**Layout, top to bottom**
1. 48 dp Odò pattern band (Sage on Sand) along the top edge, behind the status bar.
2. Top row: Back (ChevronLeft) left, "Step 1 of 3" Caption centred, Skip text button right. Under it, a 3-segment progress bar: segments 4 dp tall, 4 dp apart, Forest for done, Sand Deep for to do.
3. 24 dp. Title, Screen title.
4. 8 dp. Helper, Body, Stone.
5. 24 dp. 2 × 2 grid of option cards, 12 dp gaps, 148 dp tall: Lucide icon 28 dp in Forest, title in Label Ink, one line of Caption Stone.
   - Get Active (Sun)
   - Explore (Compass)
   - Challenge Myself (Mountain)
   - Just Walk (Footprints)
6. Flexible space. Continue, Primary.

**Components and states**
- Option card. Default: White, no border. Selected: 2 dp Forest border and a 24 dp Forest circle with a White Check in the top-right corner. Pressed: Forest 8% overlay.
- Continue with nothing selected: stays enabled; tapping it shows an inline message under the grid. Why: a disabled button doesn't say what's missing.

**What each choice changes.** Home's order never changes, so Start Walk and the ring are always in the same place. Choices change what sits inside the cards.

| Choice | Effect |
|---|---|
| Get Active | Ring card shows active minutes under the steps line. Tips start with Habits and After Meals. |
| Explore | Ring card shows "3 new streets this week". Walk Ready ranks routes through unwalked streets first. |
| Challenge Myself | Streak card adds the nearest challenge ("Walk Lagos: 32.4 of 50 km"). Journey tab opens scrolled to Challenges. |
| Just Walk | Streak card stays hidden until a 3-day streak exists. Tip card shows one line until tapped. Streak reminder is off by default. |

**Offline:** works fully.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | What brings you here? | Wetin bring you come? |
| Helper | Pick as many as you like. | Pick as many as you want. |
| Get Active | Move more, feel better. | Move body, feel better. |
| Explore | Find streets you've never walked. | Find street wey you never waka before. |
| Challenge Myself | Set a distance and go for it. | Set distance, go collect am. |
| Just Walk | No pressure. Just walk. | No pressure. Just waka. |
| Card titles | Get Active · Explore · Challenge Myself · Just Walk | Get Active · Explore · Challenge Myself · Just Waka |
| Error | Pick at least one, or tap Skip. | Pick at least one, or tap Skip. |
| Buttons | Continue · Skip | Continue · Skip |

**Motion:** none.

### 2.4 Onboarding c: Basics

**Purpose:** collect the four things the app needs before the first walk.

**Layout, top to bottom**
1. Pattern band and top row as Motivation, "Step 2 of 3", no Skip.
2. 24 dp. Title, Screen title.
3. 24 dp. Name: Label above a text input.
4. 24 dp. Daily goal: Label, then a White stepper card (20 dp radius, 72 dp tall): Minus icon button, value in Stat ("4.0 km"), Plus icon button. Range 1.0 to 15.0 km in 0.5 km steps. A Caption under it updates live with steps and time. Default 4.0 km. Why: a new walker can finish it in under an hour, and early wins build the habit.
5. 24 dp. Gender: Label, then one White card with three 54 dp radio rows (Woman, Man, Prefer Not to Say) and Sage dividers, then a Caption helper. Why rows, not three side-by-side cards: Prefer Not to Say won't fit a third of the width.
6. Voice picker, only when Prefer Not to Say is selected: Label, then a White card with two radio rows, Ada and Tunde, each with a 48 dp Play preview button.
7. 24 dp. Language: Label, then two option cards side by side, English and Pidgin. Choosing Pidgin switches the screen immediately.
8. Continue, Primary, pinned above the keyboard when it is open.

Default voice: Woman gets Tunde (male voice). Man gets Ada (female voice). Prefer Not to Say gets whichever they pick here.

**Components and states**
- Name input: default, focused (2 dp Forest border), error (message below), 1 to 30 characters.
- Gender: none selected, selected. Missing on Continue shows an inline message.
- Voice picker: hidden, shown, missing (inline message). Preview: Play swaps to Pause while the clip plays; if media volume is 0, a Caption says so.
- Continue: always enabled; tapping with missing fields scrolls to the first one and shows its message.

**Offline:** works fully. Both English voice packs are bundled, so previews play.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | A few basics | Small things we need |
| Name label | What should we call you? | Wetin we go dey call you? |
| Name placeholder | First name | First name |
| Goal label | Daily distance goal | How far you wan waka every day |
| Goal helper | About 5,300 steps, around 50 minutes. | Like 5,300 steps, about 50 minutes. |
| Gender options | Woman · Man · Prefer Not to Say | Woman · Man · I No Wan Talk |
| Gender helper | This sets your walk voice. You can change it anytime. | Na this one go choose the voice wey go talk to you. You fit change am anytime. |
| Voice label | Pick a voice for your walk updates | Choose the voice wey go dey update you |
| Voice rows | Ada, female voice · Tunde, male voice | Ada, woman voice · Tunde, man voice |
| Language options | English · Pidgin | English · Pidgin |
| Name error | Add a name so we know what to call you. | Put your name make we know wetin to call you. |
| Gender error | Pick one so we can choose your walk voice. | Pick one make we fit choose your voice. |
| Voice error | Pick a voice to continue. | Pick one voice make we continue. |
| Volume hint | Turn your volume up to hear it. | Increase your volume make you hear am. |
| Button | Continue | Continue |

**Motion:** none. The voice picker appears in place.

### 2.5 Onboarding d: Permissions

**Purpose:** get location and motion access with honest reasons, one at a time.

**Layout, top to bottom** (same for each step)
1. Pattern band and top row as Motivation, "Step 3 of 3".
2. 32 dp. A 64 dp Sand Deep circle holding a 32 dp Forest icon.
3. 24 dp. Title, Screen title.
4. 12 dp. Body, Stone.
5. 24 dp. White card: "If you say no" in Label Ink, then one line of Body Stone.
6. Flexible space. Primary button. 12 dp. Not Now, text button, centred.

**Step 1: Location (MapPin).** Primary button triggers the native dialog. Ask for "While using the app" only. Why: Android's foreground service and iOS background location mode keep tracking with the screen locked, so there's no need to ask for Always, which most people refuse. If they pick approximate location on Android 12+, a follow-up card appears with Open Settings and Continue Anyway.

**Step 2: Motion & Fitness on iOS, Physical Activity on Android (Footprints).** Same layout; the button and title of the native dialog use the platform's name.

**Step 3: Android only, on Tecno, Infinix, itel, Xiaomi, Oppo, Realme and Samsung (BatteryFull icon).** Three short numbered illustrations (SVG) for that brand's battery settings, redrawn from dontkillmyapp.com guidance. Primary button opens the brand's battery screen by intent, falling back to App Info. Text button Done. Why only these brands: they are the ones that stop foreground services; everyone else would get a step for nothing.

**Components and states**
- Granted: moves to the next step when the dialog closes.
- Denied once: moves on; the outcome is stored.
- Permanently denied (Android "Don't allow" twice, iOS denied): any later ask shows the explainer with Open Settings instead of the native dialog.
- Location denied: walks track steps and estimate distance; no map or route.
- Motion denied: steps are estimated from GPS distance and marked "Estimated" on Journey Detail.
- Both denied: Home's ring card is replaced by a permission card with Open Settings.

**Offline:** works fully.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Location title | See your journey on the map | See your waka for map |
| Location body | We use your location only while you walk, to draw your route and measure distance. You'll see a notification whenever it's on. | We dey use your location only when you dey waka, to draw your route and measure distance. You go see notification anytime e dey on. |
| Location, if no | We'll still count your steps and estimate distance, but there's no map or route. | We go still count your steps and guess the distance, but map and route no go show. |
| Approximate | Precise location is off, so distances can be off by a lot. | Precise location no on, so the distance fit dey wrong well well. |
| Motion title | Count every step | Count every step |
| Motion body | Your phone's motion sensor counts steps more accurately than GPS and uses less battery. | Your phone motion sensor dey count steps better pass GPS, and e no dey chop battery like that. |
| Motion, if no | We'll estimate your steps from the distance you walk. | We go guess your steps from how far you waka. |
| Battery title | Keep tracking with the screen off | Make e dey count even when screen off |
| Battery body | Some phones close apps in the background to save battery. Let Irin Ajo keep running so your walk keeps counting. | Some phones dey close apps for background to save battery. Allow Irin Ajo make e dey run so your waka go keep counting. |
| Buttons | Allow Location · Allow Motion & Fitness (iOS) · Allow Physical Activity (Android) · Open Battery Settings · Open Settings · Continue Anyway · Not Now · Done | Allow Location · Allow Motion & Fitness · Allow Physical Activity · Open Battery Settings · Open Settings · Continue Like That · Later · Done |

**Motion:** none.

### 2.6 Sign In

**Purpose:** bring back an existing account, or back up a new one from Profile.

**Layout, top to bottom**
1. Back. Screen title ("Welcome back" from Welcome, "Back up your journeys" from Profile).
2. 12 dp. Body, Stone.
3. 32 dp. Continue with Google (Secondary, Google mark per Google's rules). On iOS, Continue with Apple above it (App Store rules require it when Google sign-in is offered). Use Phone Number (Secondary).
4. Phone path: country code fixed to +234 with a picker, number input, Send Code (Primary). Then a 6-digit code input, Resend Code after 60 s, and after a second resend, Send via WhatsApp as a text button.

After sign-in, settings and the last 90 days of journeys download first; older journeys follow in the background.

**Maps as built (November 2026):** Mapbox through @rnmapbox/maps 10.3 (Mapbox Maps SDK 11.33). The 3.5 base style ships in the app as src/map/irin-ajo-style.json (Mapbox Streets v8 data, the 3.5 colours, widths and label rules; labels use Mapbox's DIN Pro until Plus Jakarta Sans is uploaded to Studio). EXPO_PUBLIC_MAPBOX_STYLE_URL switches to a Studio-hosted copy, which offline packs will need. Walk: 2D, follows the walker (zoom 16, eased) until they pan, then Recentre (48 dp White circle, LocateFixed, top right); walked route over its casing, start ring, the concentric position marker (Sage without a fix); logo and attribution top left. Journey Detail: pan and zoom, no rotation or tilt, fitted to the route without a fly-in; route, start ring, end dot, a numbered marker every kilometre. Mapbox is loaded only when its native code is in the build; otherwise both screens draw the route on plain land colour (Expo Go, web, older builds).

**Expo SDK 58 (November 2026):** the app moved from SDK 57 to SDK 58 (React Native 0.88, React 19.3), because the store version of Expo Go only runs the newest SDK. Changes it needed: the custom tab bar uses the new tab bar props (emitter and navigateToTab with route keys, all five tabs declared in the layout); text input refs use TextInputInstance under React Native's strict TypeScript API; and Irin Ajo's own reminders (daily, streak, weekly) are kept silent while the app is open, since SDK 58 shows notifications in the foreground by default. Android release builds now shrink code with R8 by default; the custom modules are Expo modules, which don't rely on reflection, but the first release build should be tested before submission.

**As built (server connected, November 2026):** sign-in, sessions and sync use the Irin Ajo API (Richard's API guide, 16 Nov 2026; staging until launch).
- Sessions: a 15-minute access token and a 60-day refresh token, kept in SecureStore (readable after first unlock, never copied to a new phone; memory only in builds without SecureStore). An expired access token is refreshed once and the request retried; a refused refresh token signs the person out but keeps their walks. Automatic retries only on 429, 502, 503 and no connection, after Retry-After.
- Code errors: wrong code ("That code didn't match", tries left counted by the server); expired, not found or too many tries ("That code has expired. Send a new one."); rate limited; the send channel failing ("Try the other option"); a sign-in method not switched on yet. A code the server has refused isn't sent again, so tapping Verify after the automatic check can't use up a try. The resend wait comes from the server (resendAfterSec).
- New account: this phone's profile and settings become the account's, with the sign-up name. Existing account: the server's profile wins unless this phone's edits are newer (Profile.updatedAt; last write wins).
- Sync runs on launch, when the app returns, a few seconds after a change worth sending, every 10 minutes while open, and from the Backup row. Order: profile up, queued journey changes up (each journey once, in its current state; gone means deleted), new keepsakes up, then changes down from the saved cursor. A first sync restores the last 90 days, then everything. Journeys from the server are applied without being queued again; a local edit still waiting to upload wins only if it's newer. Deletes are final. Keepsakes are only ever added. Area names and landmarks arrive about a minute after upload, so a sync that uploaded comes back after 90 seconds. Failures wait for the next sync; nothing is shown unless the person asked.
- Profile shows a sync line under the Account card: "Synced just now", "Synced 4 min ago", "3 journeys waiting to sync" (with CloudOff) or "Not synced yet". Sign Out ends the session on the server; walks stay on the phone.
- Journey Detail adds a landmark highlight ("You walked past Tafawa Balewa Square.") when the server has one.
- Apple sign-in goes through the server (POST /auth/apple) and works once Apple keys are set there. Google stays "not connected yet" for the same reason.

**Components and states**
- Buttons: loading (spinner in place of the label).
- Code input: default, error (message below, input clears).
- Error: server unreachable, message with Try Again.

**Offline:** buttons disabled with a Caption, plus Get Started Instead (Secondary) on the Welcome path.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Welcome back · Back up your journeys | Welcome back · Back up your journeys |
| Body (backup) | Sign in so your walks and keepsakes are safe if you change phones. | Sign in make your waka and keepsakes dey safe if you change phone. |
| Code sent | We sent a 6-digit code to 0803 123 4567. | We don send 6-digit code to 0803 123 4567. |
| Wrong code | That code didn't match. Check it and try again. | That code no match. Check am and try again. |
| Server error | Couldn't reach Irin Ajo. Try again in a moment. | We no fit reach Irin Ajo. Try again small time. |
| Offline | Signing in needs a connection. You can start fresh and back up later. | To sign in need network. You fit start fresh and back up later. |
| Buttons | Continue with Google · Continue with Apple · Use Phone Number · Send Code · Resend Code · Send via WhatsApp · Get Started Instead | Continue with Google · Continue with Apple · Use Phone Number · Send Code · Send Code Again · Send via WhatsApp · Start Fresh Instead |

**Motion:** none.

### 2.7 Home

**Purpose:** show today's journey at a glance and start a walk in one tap.

**Layout, top to bottom** (Sand, 20 dp side padding, scrolls)
1. Header, 16 dp under the status bar. Left: the greeting in Label Stone, then the first name on the next line in Screen title Ink (one line, ellipsis). Right: 40 dp avatar, taps to Profile. Why two lines: names vary in length, so the large line should be the short one. The offline caption, when needed, sits 4 dp under the name.
2. 20 dp. Start Walk: 64 dp, full width, Papaya fill, Ink label, Footprints icon 24 dp before the label. While a walk is running it reads "Return to Walk · 0.6 km" with the live distance and opens the Walk screen. The heat line, when shown, sits 8 dp below: Thermometer 16 dp and a Caption in Stone.
3. 24 dp. Today's journey card (White, 20 dp radius, 20 dp padding):
   - Section heading.
   - 16 dp. Full progress ring, 200 dp across, 14 dp stroke, round caps, Sand Deep track, Papaya progress, starting at 12 o'clock and running clockwise. Why a full ring: a closed loop reads as a journey you complete, and its centre holds a 44 dp number without crowding; a half ring pushes the figures under the arc and makes the card taller.
   - Inside the ring: "4.8" in Hero with " km" in Section, both Ink and tabular. Under it, "of 8 km" in Label Stone.
   - 20 dp under the ring: three equal columns divided by 1 dp Sage lines. Steps, Time, and To go (distance left to the goal; "Reached" under Goal once it's met). Values in Section, tabular; labels in Caption Stone. Why: the card should answer "how much further?" at a glance.
   - Optional motivation line in Caption Stone (2.3).
4. 16 dp. Streak card (White, 72 dp, 16 dp padding): Sunrise 24 dp in Papaya, then the streak in Label Ink over a Caption Stone line, ChevronRight in Sage at the right. Tap opens the Journey tab at the calendar.
5. 16 dp. This week card (White): Section heading left, week total in Label Stone right. A 120 dp chart area below: seven bars, Monday to Sunday, 20 dp wide, 4 dp top corners, evenly spaced. Past days in Forest, today in Papaya, future days as a 4 dp Sand Deep stub. The daily goal is a 1 dp dashed Sage line across the chart. Day initials in Caption Stone under each bar; today's initial in Plus Jakarta Sans Bold, Ink. The scale is the larger of the week's best day and the goal. Each walked day shows its distance above its bar in Caption (today in Ink Bold), on a White backing so it reads cleanly across the goal line. Under the day initials, a key: a short dashed Sage line and "Daily goal 8 km". Why: nothing on the chart should need a tap to discover.
6. 16 dp. Daily tip card (White): category icon 16 dp in Forest on a 32 dp Sand Deep circle, and category name in Caption Stone; 8 dp; tip in Body Ink, up to 4 lines; 12 dp; More Tips text button with ChevronRight. The whole card opens Tips.
7. 32 dp. Section heading "Recent journeys" with See All text button at the right (opens the Journey tab). One White card with up to three 72 dp rows divided by 1 dp Sage lines inset 16 dp. Row: 56 dp route thumbnail, title in Label Ink, meta in Caption Stone, CloudOff 16 dp in Stone at the right when unsynced. Why one card with rows: three separate boxes stacked start to look like a spreadsheet.
8. Bottom padding: tab bar height plus 40 dp, which clears the raised Walk button.

No patterns anywhere on Home.

**Components and states**
- Ring. Default as above. Empty (no walk yet today): track only, "0.0 km", and the empty line under the ring. Goal reached: ring full, Check 20 dp in Forest above the number, goal line under the ring. Past the goal: the ring stays full and the number keeps counting. Why: a second lap of colour reads as noise. Loading: Sand Deep ring and an 80 × 44 dp block in the centre. Error: step sensor unavailable, the steps value reads "Steps unavailable" and distance still shows.
- Streak card. Default, empty (no streak), ended (streak broke yesterday), walked today.
- This week. Default, empty week (all stubs and a Caption line inside the chart area).
- Tip card. Always has content; the library is bundled.
- Recent journeys. Default, empty (Footprints 32 dp in a 64 dp Sand Deep circle with one line; no pattern, by the Home rule).
- Heat line. Shown when it is 32°C or hotter between 10:00 am and 4:00 pm. Names the hour the heat usually drops, from the forecast online or the time-of-day table (2.10) offline.
- Permission card. Replaces the ring when both location and motion are denied, with Open Settings.

**Offline**
- Shows: everything. Ring, streak, week and journeys come from the local database; the tip from the bundled library; the heat line from the last known temperature.
- Disabled: nothing.
- Syncs later: journeys walked offline (CloudOff on their rows).

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Greeting | Good morning, · Good afternoon, · Good evening, | Morning o, · Afternoon o, · Evening o, |
| Button | Start Walk | Start Waka |
| Card heading | Today's journey | Today waka |
| Ring | 4.8 km · of 8 km | 4.8 km · out of 8 km |
| Under ring | 6,241 · Steps · 54 min · Time · 3.2 km · To go | 6,241 · Steps · 54 min · Time · 3.2 km · Remain |
| Goal met (third figure) | Reached · Goal | Done · Goal |
| Week key | Daily goal 8 km | Daily goal 8 km |
| Button, walk running | Return to Walk · 0.6 km | Back to Your Waka · 0.6 km |
| Empty ring | Your journey today starts at the door. | Today waka go start from your door. |
| Goal reached | Goal reached. Well done, you don try. (touch) | You don reach your goal. Well done o. |
| Streak | 6-day streak · Walk 1 km today to keep it going. | 6 days straight · Waka 1 km today make e no break. |
| Streak, walked today | 6-day streak · Today counts. See you tomorrow. | 6 days straight · Today don count. See you tomorrow. |
| Streak empty | Walk 1 km today to start a streak. | Waka 1 km today make your streak start. |
| Streak ended | Your 14-day streak ended. Today is a fresh start. | Your 14-day streak don end. Today na new start. |
| Week | This week · 24.6 km | This week · 24.6 km |
| Week empty | Your week is open. One walk starts it. | This week still open. One waka go start am. |
| Tip button | More Tips | More Tips |
| Recent | Recent journeys · See All | Your last journeys · See All |
| Recent row | Morning walk in Yaba · 4.8 km · 54 min · Today, 6:12 am | Morning waka for Yaba · 4.8 km · 54 min · Today, 6:12 am |
| Recent empty | No journeys yet. Your first one will show up here. | No journey yet. Your first one go show here. |
| Heat | It's 33°C now. A walk after 5:30 pm will feel easier. | Sun don hot, 33°C. Waka after 5:30 pm go sweet pass. |
| Offline | Offline. Your walks are saved on this phone. | No network. Your waka dey save for this phone. |
| Permission card | Turn on location or motion access to track your walks. · Open Settings | On location or motion make we fit track your waka. · Open Settings |

**Motion:** Start Walk expands into the Walk screen (3.7). Nothing else animates; values update in place.

### 2.8 Walk Ready

**Purpose:** offer routes that would finish today's goal, or start straight away. Opens from the centre Walk tab when no walk is running.

Why this state exists: route suggestions need a place to live, and the centre tab should offer more than a copy of Home's one-tap start.

**Layout, top to bottom**
1. Map, top 45% of the screen, lazy-loaded. Position marker. Suggested routes in Sage (3 dp, dashed); the selected one in Forest (4 dp, dashed), which is the planned-route style used on Walk.
2. Sheet (Sand, 28 dp top radius) overlapping the map by 24 dp, not draggable:
   - Screen title, then the remaining distance in Label Stone.
   - 16 dp. Up to three suggestion cards (White, 20 dp radius, 16 dp padding), 12 dp apart: name in Label Ink, meta in Caption Stone, safety tag, and "Completes today's goal" in Caption Forest. Selected: 2 dp Forest border. Tapping a selected card deselects it.
3. Start Walk (Papaya, 64 dp), pinned 16 dp above the tab bar. Its label becomes Start This Walk when a route is selected.
4. Tab bar visible.

Suggestion rules: loops that start and end where they are standing, within 10% of the remaining distance (minimum 1.5 km), ranked by safety rating for the current hour, then by unwalked streets if they chose Explore. After sunset, routes rated Take Care are left out.

**Components and states**
- Loading: map area in Sand Deep, three skeleton cards.
- Goal already met: replaces the remaining-distance line; suggestions become their three most-walked loops.
- Empty (no routes generated, common outside big cities): one line, Start Walk still works.
- Error: inline message with Try Again; Start Walk still works.
- No location permission: map area in Sand Deep with MapPinOff, suggestions hidden, Start Walk tracks steps only.

**Offline**
- Shows: up to three of their own past loops that match the remaining distance, on cached tiles.
- Disabled: new route generation.
- Syncs later: nothing.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Ready when you are | Anytime you ready |
| Remaining | 3.2 km to go for today's goal. | 3.2 km remain for today goal. |
| Card | Yaba backstreets loop · 3.4 km · 42 min · Flat | Yaba backstreets loop · 3.4 km · 42 min · Flat |
| Card note | Completes today's goal | E go complete today goal |
| Buttons | Start Walk · Start This Walk | Start Waka · Start This Waka |
| Goal met | You've reached today's goal. Walk on for the joy of it. | You don reach today goal. Waka on for enjoyment. |
| Empty | No suggested routes here yet. Start a walk and we'll learn your area. | We never get route for here. Start to waka and we go learn your area. |
| Error | Couldn't load suggestions. · Try Again | Suggestions no load. · Try Again |
| Offline card | Your usual loop · 3.1 km | Your normal loop · 3.1 km |

**Motion:** Start Walk expansion (3.7). Nothing else.

### 2.9 Walk

**Purpose:** show how far they've gone while they move, readable at arm's length and usable with one thumb.

**Layout, top to bottom** (360 × 800 reference)
1. Top bar, 56 dp, under the status bar.
   - Left: Minimise (ChevronDown), 48 dp.
   - Centre: "WALKING" in Status style, Forest, after an 8 dp Papaya dot. Under it, the timer in Stat, Ink, tabular.
   - Right: Voice (Volume2) and Walk Safe (ShieldCheck), 48 dp each. While sharing, the Walk Safe icon sits on a 40 dp Forest circle in Sand.
2. Walk Safe chip, only while sharing, 8 dp under the top bar, centred: 28 dp tall, Sand Deep, 8 dp radius, ShieldCheck 14 dp and the status in Status style, Forest.
3. Distance block, vertically centred in the space between the top bar and the player row:
   - Distance in Display, Ink, tabular, centred together with "km" in Stat Stone, baseline-aligned 4 dp after it. Tabular figures stop the number jittering; the pair re-centres once per walk, at 10.0 km. (A fixed four-character box was tried and pushed the number about 20 dp off centre.)
   - 4 dp. Steps in Stat Ink, tabular, followed by " steps" in Label Stone.
   - 8 dp. The calorie line in Label Stone.
4. 20 dp above the map: two White cards in a row, 64 dp tall, 16 dp radius, 12 dp apart. Mini player takes the remaining width; hydration indicator is 104 dp wide.
5. Map: the bottom 40% of the screen height, full width, running under the bottom inset. Walked route in Papaya with a Forest casing; planned route (if any) in Forest, dashed; position marker (3.4). Recentre (LocateFixed), a 48 dp White circle 12 dp in from the map's top-right corner, appears only after they pan. Mapbox logo and attribution sit at the map's top-left so the controls never cover them.
6. Controls float on the map, 20 dp from the sides, 16 dp above the bottom inset, 12 dp apart, equal width, 64 dp tall:
   - Pause: Forest fill, Pause icon and White label.
   - Hold to End: White fill, 1.5 dp Forest border, Forest label. Press and hold for 1.2 s; Forest fills from left to right and the label turns White where the fill has passed (two label layers, the top one clipped to the fill). Light haptic on press, success haptic on completion. Releasing early drains the fill over 150 ms. With TalkBack or VoiceOver on, a double-tap opens a confirm dialog instead. Why: press-and-hold is hard with a screen reader.

Pause and Hold to End are the only controls in thumb reach; everything else sits in the top bar. Tab bar hidden. No patterns.

**Behaviour**
- Tracking starts at the tap. Until the first GPS fix, distance comes from steps × stride (0.76 m default, calibrated from their GPS walks), then GPS takes over. Distance never goes down.
- The screen may lock; tracking continues (foreground service of type location on Android, background location mode on iOS). "Keep screen on during walks" is off by default in Settings. Why: battery on 2 to 3 GB phones.
- At 15% battery the map stops rendering and keeps its last frame, and a snackbar appears.
- Announcements play every 1,000 steps (script below). Nothing changes on screen when they play. Why: the numbers are already there.
- If a walk starts after sunset and they have a trusted contact, a slim White card (48 dp) appears where the Walk Safe chip sits, for 10 s, with a Share text button.
- Low-RAM devices (3 GB or less): map capped at 30 fps; no 3D buildings, pitch or rotation.
- Phone calls: tracking continues, announcements are skipped. The phone shows the call over Irin Ajo (a banner, or full screen when locked); answering moves Irin Ajo to the background without closing it, and the walk is there when they come back. Irin Ajo doesn't answer calls itself: iOS doesn't allow it, and on Android it would need phone permissions out of place in a walking app. On Android the voice checks the audio mode before speaking (in call, in communication or ringing, which covers WhatsApp calls; no permission needed) and stays silent; a step mark passed during a call isn't announced afterwards. iOS interrupts other apps' audio during calls itself.

**Components and states**
- Status. WALKING (Forest, Papaya dot). PAUSED (Stone, Sage dot), see 2.11.
- Distance. Default. Before the first GPS fix: step-based distance, and the map shows "Finding your location".
- Calorie line. Default. No weight set: same line, estimated with 70 kg. Hidden everywhere if Show Calories is off in Settings. Why the switch exists: some people walk to feel better, not to count food.
- Mini player. Controls whatever music app is playing, rather than connecting to particular services. Why: most Nigerians listen on Audiomack and Boomplay, and since February 2026 Spotify limits new developer apps to 5 allowlisted users unless the developer is a registered business with 250,000 monthly users, which rules out its SDK for launch.
  - Android, playing or paused, with notification access: 40 dp artwork (8 dp radius), song title in Label Ink, then "artist · app" in Caption Stone (one line each), then Play/Pause and SkipForward as 48 dp icon buttons. No previous-track button. The artwork is dropped when the card is narrower than 220 dp (360 dp phones), so the title keeps some room.
  - Android, without notification access: Music icon, "Music playing" or "Play music" in Label, "Allow access to see the song" in Caption, and the same two controls, which work through media key events (no permission needed) and go to whichever app last played. Tapping the text opens the access sheet: what it's for, that Irin Ajo never reads or keeps messages, Allow Access (opens the system notification access screen) and Not Now.
  - Android, access granted but no music app active: "Play music" with "Audiomack, Boomplay, Spotify or any music app"; no controls. Tap opens the phone's music app, or a toast if there isn't one.
  - iPhone, Expo Go and web: a plain card, "Your music" with "Play it from your music app." iOS lets apps control only Apple Music, so Apple Music control (MusicKit, with Media & Apple Music access) is the next iPhone step. Lock-screen and Control Center controls work for every app, and announcements duck any music on both platforms.
  - Implementation: a local Expo module (modules/now-playing, Android only) using MediaSessionManager through an empty NotificationListenerService that never reads notifications. App names come from the package (Android 11+ hides other apps' labels): Audiomack, Boomplay, Spotify, YouTube Music, Apple Music, Deezer.
  - Tapping the song (with access and a session) opens the Now playing sheet: 160 dp cover (16 radius; Sand Deep square with a Music icon if none), title in Section and "artist · app" in Body Stone, centred; then Previous (48 dp), Play/Pause (64 dp Forest circle, White icon) and Next; then Play From the Start (Secondary, RotateCcw), which seeks to 0 when the app allows it and otherwise sends "previous" (most players restart the song a few seconds in); then Open {app} (text), which opens that app's own player through its media session; then a Caption: "To repeat a song nonstop, turn on repeat in {app}." Why: Android lets other apps restart a song but not set a music app's repeat mode, so loop lives in the music app, one tap away. Covers come through at up to 400 px so the sheet stays sharp.
  - Builds of the module without the newer functions hide Previous and Play From the Start (Play stays centred), so an older development build never breaks.
  - Partner marks are not shown; the card names the app in text only.
- Hydration indicator. Default: Droplet 20 dp in Forest, "Refill in" in Caption Stone over the minutes in Label Ink. Due: 2 dp Forest border and "Refill now". Off (reminders off in Settings): hidden, and the player takes the full width.
- Map. Loading: Sand Deep. Offline outside the cache: land colour only, with route, marker and a caption chip. No location permission: Sand Deep panel with MapPinOff, a line, and Open Settings; controls still float on it.
- Controls. Pause: default, pressed. Hold to End: default, holding, complete.

**Voice announcement script** (every 1,000 steps; engine in 2.18)

| Case | English | Pidgin |
|---|---|---|
| Standard | 6,000 steps. You've walked 4.8 kilometres in 54 minutes. That's about 212 calories. The next 1,000 steps will bring you to 252 calories. | 6,000 steps. You don waka 4.8 kilometres for 54 minutes. E reach like 212 calories. When you waka the next 1,000 steps, e go reach 252 calories. |
| Calories off | 6,000 steps. You've walked 4.8 kilometres in 54 minutes. | 6,000 steps. You don waka 4.8 kilometres for 54 minutes. |
| Goal reached (once) | That's today's goal. Well done, you don try. | You don reach today goal. Well done o. |

**Offline**
- Shows: everything; map from cached tiles or plain land colour.
- Disabled: live Walk Safe sharing (pauses), streaming tracks that aren't downloaded.
- Syncs later: the journey. Shared positions are not backfilled.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Status | WALKING · PAUSED | WALKING · PAUSED |
| Steps | 6,241 steps | 6,241 steps |
| Calorie line | 212 kcal · 252 kcal at 7,000 steps | 212 kcal · 252 kcal when you reach 7,000 steps |
| Buttons | Pause · Hold to End | Pause · Hold Am to End |
| Finding GPS | Finding your location | We dey find where you dey |
| Map offline | Map offline. Your route is still recording. | Map no load. We still dey record your route. |
| No location | Turn on location to see your route. · Open Settings | On your location make you see your route. · Open Settings |
| Battery | Battery at 15%. Your walk is still recording. | Battery don reach 15%. We still dey record your waka. |
| After dark | It's dark out. Share this walk with Mum? · Share | E don dark. You wan share this waka with Mum? · Share |
| Player | Your music · Play it from your music app. · Play music · Audiomack, Boomplay, Spotify or any music app · Music playing · Allow access to see the song | Your music · Play am from your music app. · Play music · Audiomack, Boomplay, Spotify or any music app · Music dey play · Allow access make you see the song |
| Player access sheet | See what's playing · To show the song and its cover here, Android asks you to give Irin Ajo notification access. Irin Ajo only uses it to see your music player. It never reads or keeps your messages. · On the next screen, find Irin Ajo and turn it on. · Allow Access · Not Now | See wetin dey play · To show the song and the cover here, Android go ask you to give Irin Ajo notification access. Irin Ajo only dey use am to see your music player. E no dey read or keep your messages. · For the next screen, find Irin Ajo and on am. · Allow Am · Later |
| No music app | Open your music app to start a song. | Open your music app make you start song. |
| Hydration | Refill in · 12 min · Refill now | Water in · 12 min · Fill water now |
| Screen reader confirm | End this walk? · End Walk · Keep Walking | You wan end this waka? · End Waka · Continue Waka |

**Motion:** the Start Walk expansion brings this screen in (3.7). The position marker moves between GPS fixes in a straight line over the fix interval; that is position, not decoration. Nothing else.

### 2.10 Hydration Prompt

**Purpose:** remind them to refill before they need to, without stopping the walk.

**Layout, top to bottom**
1. A White card over the map, anchored 12 dp above the controls, full width minus 40 dp, 20 dp radius, 20 dp padding. The stats above stay visible.
2. Droplet 24 dp in Forest beside the title in Section Ink.
3. 4 dp. Reason in Body Stone.
4. 16 dp. Got It, Secondary (Sand surface on the White card), full width.

At the same time, the voice speaks the title and reason (music ducks) and the phone gives one medium haptic. If the screen is locked, a notification carries the same text. Got It dismisses the card and restarts the interval from now.

**When it fires**

| Temperature | Interval |
|---|---|
| Below 26°C | 45 min |
| 26 to 29°C | 35 min |
| 30 to 32°C | 25 min |
| 33°C and above | 15 min |

Pace above 6 km/h takes 5 min off the interval, never going below 10 min. At walk start, if it is 30°C or hotter, a snackbar appears in the first minute.

Offline, the app uses the last known reading if it is under 3 hours old. Otherwise it uses this estimate, which errs warm so reminders come early rather than late. Region comes from the profile city or last location.

| Time | South (Lagos, Ibadan, Port Harcourt, Benin City, Enugu) | North and centre (Abuja, Kaduna, Kano) |
|---|---|---|
| 5:00 to 9:00 am | 25°C | 24°C |
| 9:00 am to 12:00 pm | 29°C | 31°C |
| 12:00 to 4:00 pm | 32°C | 35°C |
| 4:00 to 7:00 pm | 30°C | 32°C |
| 7:00 pm to 5:00 am | 27°C | 27°C |

**Components and states**
- Default: reason names minutes and temperature.
- Hot (33°C and above): reason gives the sipping line.
- Estimated temperature: the reason names the time of day, not a number. Why: we don't state a temperature we guessed.
- Ignored for 2 minutes: the card collapses into the hydration indicator's "Refill now" state.
- No empty, loading or error states.

**Offline:** same card, using the estimated wording when needed. Nothing to sync.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Time to refill. | Time don reach to fill your water. |
| Reason | You've walked 35 minutes in 31°C heat. | You don waka 35 minutes for 31°C heat. |
| Hot | It's 34°C. Small sips, often, will help. | Sun hot well well, 34°C. Dey drink small small. |
| Estimated | You've walked 35 minutes in the afternoon heat. | You don waka 35 minutes for afternoon sun. |
| Start snackbar | It's 31°C. Carry water if you can. | E dey 31°C. Carry water if you fit. |
| Button | Got It | I Hear |

**Motion:** standard overlay fade, 200 ms.

### 2.11 Walk Paused

**Purpose:** let them rest without losing the walk.

**Layout, top to bottom**
1. Top bar: status reads PAUSED in Stone with a Sage dot; the timer stops.
2. Distance, steps and calorie line stay exactly where they were.
3. A Sand sheet with a 28 dp top radius and 24 dp padding covers the player row and the map. No scrim. Why: the numbers above should stay readable.
   - Title in Screen title Ink.
   - 8 dp. Body in Stone.
   - 24 dp. Resume, Forest fill at Walk control size (64 dp), Play icon.
   - 12 dp. Hold to End, as on Walk.

**Behaviour:** GPS drops to one reading every 30 s and the map stops rendering. If they move more than 50 m while paused, a line appears in the sheet; there is no auto-resume. After 30 minutes paused, one notification. After 3 hours paused, the walk ends and saves, and Journey Complete shows the next time they open the app.

**Components and states:** default; moving hint shown; long pause (notification). No empty, loading or error states.

**Offline:** identical.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Take a breather. | Rest small. |
| Body | Your timer is paused and your route is saved. | Your timer don pause and your route dey save. |
| Moving | Looks like you're moving. Resume? | E be like say you dey waka. You wan continue? |
| Notification | Your walk is paused. Resume or end it? | Your waka dey pause. Continue or end am? |
| Buttons | Resume · Hold to End | Continue · Hold Am to End |

**Motion:** standard sheet slide, 250 ms.

### 2.12 Walk Safe

**Purpose:** let someone they trust follow a walk live.

Opens from the Walk top bar, Profile > Walk Safe, and the after-dark card on Walk.

**Layout, top to bottom** (stack screen, Sand)
1. Back. Screen title.
2. 8 dp. Intro in Body Stone.
3. 24 dp. Status card (White):
   - Not sharing: Label Ink line, Caption Stone line, Start Sharing (Primary).
   - Sharing: status in Status style Forest, Caption Stone line with start time, Stop Sharing (Secondary).
4. 32 dp. Section heading "Trusted contacts" (up to 3). One White card with 64 dp rows: 40 dp initials avatar (Sand on Forest), name in Label Ink, number in Caption Stone, a radio for who to share with on this walk, and a "Default" tag. Tapping a row opens a contact sheet: Make Default, Send Link Again, Reset Link, and Remove Contact (Error text on the White sheet).
5. 12 dp. Add Contact (Secondary). Opens the native contact picker. Why the picker: Android's pick intent and iOS's CNContactPickerViewController need no contacts permission, so we never read their address book.
6. 32 dp. Section heading "How we send the link". Two option cards, WhatsApp and SMS. Default: WhatsApp if installed, otherwise SMS. Caption helper below.
7. 24 dp. White card with a switch row: share automatically on walks after dark. Off by default.

**How sharing works**
- Each trusted contact gets one personal link that never changes. It shows a live position only while a walk with sharing is on; at other times it says they aren't walking. Why: Mum saves one link instead of getting a new message every walk.
- The first time for each contact, Start Sharing opens WhatsApp or the SMS composer with the message ready; they tap send. We never send SMS directly (no SEND_SMS permission). After that, starting a share sends nothing new. Contacts who have Irin Ajo get a push notification and an in-app live view instead of the link.
- Tracking page (web, under 100 KB): name, status, a static map image refreshed every 30 s showing the last 15 minutes of route, last update time, distance so far, and a Call Tolu button (tel: link). No sign-in. When the walk ends it shows the finish time.
- Shared location points are deleted 24 hours after the walk. Reset Link makes the old link stop working.

**Components and states**
- Empty (no contacts): Ọ̀nà pattern in a 120 dp square with a 20 dp radius, Section title, Body Stone line, Add Contact. Patterns are allowed in empty states.
- Loading: Start Sharing shows a spinner while the session is created (10 s maximum).
- Error, no connection at start: message plus Send a Text Instead, which opens the SMS composer with a plain message about where and when they're walking.
- Connection drops mid-walk: the Walk chip changes to SHARING PAUSED with CloudOff; the tracking page shows the last update time; sharing resumes on its own when the connection returns.
- Remove Contact: confirm dialog.

**Offline**
- Shows: contacts and settings.
- Disabled: Start Sharing, replaced by Send a Text Instead.
- Syncs later: contact list changes. Location points are not backfilled.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Walk Safe | Walk Safe |
| Intro | Share your live location with someone you trust. It only shares during a walk and stops when the walk ends. | Share where you dey with person wey you trust. E go share only when you dey waka, and e go stop when you finish. |
| Not sharing | Not sharing · Pick a contact, then start sharing. | You no dey share · Pick person, then start to share. |
| Sharing | SHARING WITH MUM · Since 6:12 pm · Updates every 30 seconds | SHARING WITH MUM · From 6:12 pm · E dey update every 30 seconds |
| Send helper | We open WhatsApp or your messages with the link ready. You tap send. | We go open WhatsApp or your messages with the link ready. You go press send. |
| First message | I'm walking with Irin Ajo. You can follow my walk here: [link] | I dey waka with Irin Ajo. You fit follow my waka here: [link] |
| Auto switch | Share automatically on walks after dark | Share by itself when I waka after dark |
| Empty | Add someone you trust · They'll see where you are only while you're walking. | Add person wey you trust · Dem go see where you dey only when you dey waka. |
| No connection | Sharing needs a connection. | To share need network. |
| SMS fallback | I'm going for a walk from Yaba at 6:12 pm. I'll text you when I'm back. | I dey go waka from Yaba by 6:12 pm. I go text you when I come back. |
| Paused | SHARING PAUSED | SHARING PAUSED |
| Remove dialog | Remove Mum from Walk Safe? Her link will stop working. | Remove Mum from Walk Safe? Her link no go work again. |
| Tracking page, idle | Tolu isn't walking right now. | Tolu no dey waka now. |
| Tracking page, live | Updated 6:41 pm · 2.3 km so far | Updated 6:41 pm · 2.3 km so far |
| Tracking page, ended | Tolu finished their walk at 7:04 pm. | Tolu don finish waka by 7:04 pm. |
| Buttons | Start Sharing · Stop Sharing · Add Contact · Make Default · Send Link Again · Reset Link · Remove Contact · Send a Text Instead · Call Tolu | Start to Share · Stop to Share · Add Person · Make Am Default · Send Link Again · Change Link · Remove Person · Send SMS Instead · Call Tolu |

**Motion:** none.

### 2.13 Journey Complete

**Purpose:** show what the walk added up to and mark the moment.

**Layout, top to bottom**
1. Top 45%: static map snapshot of the route area (Mapbox snapshotter, cached tiles), with the route drawn on top as an SVG path: Papaya 6 dp over a Forest casing, start as a Forest ring, end as a Papaya dot. Why a snapshot: one image and one path cost far less than a live map on a 2 GB phone, and nothing here needs panning.
2. A 28 dp Oòrùn pattern band (Forest at 25% and Papaya, on Sand) along the map's bottom edge: one row of the tile's 28 dp cells, so the pattern is never rescaled.
3. 20 dp. "JOURNEY COMPLETE" in Status style, Forest. 4 dp. Journey name in Screen title Ink, with a 48 dp Pencil icon button to rename.
4. 20 dp. Distance in Metric, Ink, tabular.
5. 12 dp. Three columns: steps and time in Stat Ink, kcal in Stat Stone, each over a Caption label. Why kcal is last and in Stone: calories stay secondary even here.
6. 16 dp. The dynamic line in Body Ink.
7. 20 dp. Keepsake card, only if one was earned (White, 16 dp padding): the badge at 120 × 150 dp on the left; "NEW KEEPSAKE" in Status style Forest, title in Section Ink, milestone in Caption Stone on the right. Tap opens the Keepsake sheet (2.19).
8. Buttons pinned 16 dp above the bottom inset, side by side, 54 dp: Share Journey (Secondary) and Done (Primary). Content above scrolls if it doesn't fit. Why Done is primary: most walks are routine, so finishing should be the obvious tap.

**Dynamic line** (first rule that matches wins)
1. First journey ever saved.
2. Longest walk ever, across all history (not only the journeys in memory).
3. Beat yesterday's distance.
4. Found at least 0.5 km of new streets.
5. This walk completed today's goal.
6. This walk extended the streak.
7. Default line.

**Share Journey:** a small sheet offers Story (1080 × 1920) or Square (1080 × 1080), then the native share sheet. The image is made on the phone: Sand background, Oòrùn band at the top, the route on plain land colour (no map tiles, so it stays small), distance in Manrope ExtraBold, steps and time, journey name, date, and the wordmark with tagline at the bottom. PNG under 300 KB. The first and last 200 m of the route are trimmed by default. Why: a shared route shouldn't point to their front door.

**Components and states**
- Default: as above.
- No snapshot (tiles not cached): plain land colour (#ECE6DA) with the route; same sequence.
- Snapshot slow: the route waits up to 1 s for the snapshot, then draws on plain ground.
- Very short walk (under 100 m or under 1 minute): before this screen, a dialog asks whether to save. Discard is Error text on the White dialog.
- No keepsake: section left out.
- Rename: an empty name keeps the previous one.

**Offline**
- Shows: everything. The name uses time of day only, and the new-streets line gives distance ("You walked 1.2 km of new streets.") because street names arrive with sync.
- Disabled: nothing. Sharing hands the image to the target app, which queues it.
- Syncs later: the journey, its keepsake, its neighbourhood name.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Status | JOURNEY COMPLETE | JOURNEY COMPLETE |
| Name | Evening walk in Surulere | Evening waka for Surulere |
| Stat labels | Steps · Time · kcal | Steps · Time · kcal |
| Longest | Your longest walk yet, by 0.9 km. | Na your longest waka be this, by 0.9 km. |
| Beat yesterday | You beat yesterday by 1.3 km. | You pass yesterday by 1.3 km. |
| New streets | You found 3 new streets. | You find 3 new streets. |
| Goal | That's today's goal done. | Today goal don complete. |
| Streak | Day 6 of your streak. | Day 6 for your streak. |
| First journey | Your first journey. The map starts here. | Your first journey. The map don start here. |
| Default | Another journey on the map. You don try. (touch) | Another journey for map. You don try. |
| Keepsake | NEW KEEPSAKE · First 10 km · 10 km walked | NEW KEEPSAKE · First 10 km · 10 km don waka |
| Short walk | That was a short one. Save it anyway? · Save · Discard | This one short o. You still wan save am? · Save · Discard |
| Share formats | Story · Square | Story · Square |
| Buttons | Share Journey · Done | Share Your Waka · Done |

**Motion:** the Journey Complete sequence (3.7): route draws, stats count up, dynamic line appears, keepsake reveals. Tapping anywhere jumps to the end state.

### 2.14 Explore

**Purpose:** find a walk worth taking nearby, not just a place to go.

**Layout, top to bottom**
1. 16 dp under the status bar: search field, 54 dp, White, 16 dp radius, Search icon 20 dp in Stone, placeholder in Stone.
2. 12 dp. Chips in a horizontal scroll, 40 dp, 8 dp apart: Nearby (selected by default), Parks, Cafés, Landmarks, Quiet Routes. Single select.
3. The map fills the rest of the screen behind a draggable sheet.
4. Sheet (Sand, 28 dp top radius, handle), snapping at 40% and 85% of the screen height. Section heading, then journey cards 12 dp apart.
5. Journey card (White, 20 dp radius, 16 dp padding, 104 dp): 72 dp route thumbnail; name in Label Ink (up to 2 lines); meta in Caption Stone; safety tag. Bookmark icon button (48 dp) at the top right.
6. Tab bar visible.

Tapping a card fits the map to that route (Forest, dashed) and turns the sheet into a preview: name in Section, a two-line description in Body Stone, distance, time and difficulty in a row, the safety tag (tap for the breakdown sheet), the distance to the start in Caption, then Start This Walk (Papaya, 64 dp) and Save (Secondary). The walk to the start point counts toward the walk. Why: every step counts, and it saves a second tap when they get there.

**Naming:** "{place} {time of day} walk" or "{area} loop", always shown with the distance. Examples: Ikoyi Link Bridge evening walk, 3.4 km. Unilag lagoon front walk, 4.2 km. Muri Okunola Park loop, 1.6 km. Jabi Lake evening walk, 4.0 km.

**Search:** walks come first ("3 walks around Freedom Park"), places second. A place result opens the walks that pass it.

**Chips:** Nearby is within 3 km of them. Parks, Cafés and Landmarks show walks that pass those places. Quiet Routes shows walks with low traffic and good footpaths.

**Difficulty:** Easy (under 4 km, flat). Moderate (4 to 8 km, or some hills). Hard (over 8 km, or steep).

**Safety rating:** Good, Fair or Take Care, recalculated for the current hour from three inputs: lighting (OpenStreetMap lit tags, streetlight data, time of sunset), foot traffic (anonymised Irin Ajo walks by hour plus how many shops and stops line the route), and footpaths (sidewalk tags and road type). The breakdown sheet rates each input Good, Fair or Poor. After sunset, Take Care routes drop out of Nearby.

**Performance:** cards render first; the map mounts after the first interactions settle (InteractionManager), with a Sand Deep placeholder until then.

**Components and states**
- Loading: three skeleton cards, map placeholder.
- Empty (no walks mapped in the area): Compass in a 64 dp Sand Deep circle and one line. No pattern, by the Explore rule.
- Search, no results: one line.
- Error: one line with pull-to-refresh.
- Location off: map centres on their profile city; Caption with Open Settings.
- Card: default, pressed, saved (Bookmark drawn in Forest with a 2 dp stroke).

**Offline**
- Shows: up to 30 walks cached for their usual area at the last sync, cached tiles, saved walks. Safety tags show the date they were rated.
- Disabled: search (the placeholder changes).
- Syncs later: bookmarks and Felt Safe feedback.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Search | Where do you want to walk? | Where you wan waka go? |
| Chips | Nearby · Parks · Cafés · Landmarks · Quiet Routes | Near You · Parks · Cafés · Landmarks · Quiet Routes |
| Heading | Popular journeys nearby | Journeys wey people like near you |
| Card | Ikoyi Link Bridge evening walk · 3.4 km · 45 min · Easy | Ikoyi Link Bridge evening waka · 3.4 km · 45 min · Easy |
| Safety tag | Safety: Good · Safety: Fair · Safety: Take Care | Safety: Good · Safety: Fair · Safety: Take Care |
| Preview | Along the bridge as the sun goes down, busy with other walkers. | Waka for the bridge as sun dey go down. Plenty people dey waka there. |
| Start point | Starts 1.2 km from you | E start 1.2 km from you |
| Safety note | Ratings are a guide. Trust your own sense of a place too. | Rating na guide. Still trust wetin your mind talk about the place. |
| Empty | No mapped walks here yet. Walk your own and we'll learn the area. | No waka for here yet. Do your own and we go learn the area. |
| No results | No walks found for Bariga. Try a nearby area or landmark. | We no see waka for Bariga. Try area wey near or one landmark. |
| Error | Couldn't load walks. Pull down to try again. | Walks no load. Pull down try again. |
| Location off | Turn on location to see walks near you. · Open Settings | On location make you see waka near you. · Open Settings |
| Offline search | Search needs a connection | To search need network |
| Rated date | Rated 10 Oct | Rated 10 Oct |
| Buttons | Start This Walk · Save | Start This Waka · Save |

**Motion:** none. The sheet follows the finger.

**As built (November 2026):** Explore reads the API's walk endpoints (GET /walks/nearby with lat, lng and category; GET /walks/search with q, lat and lng). Chips map to the API's nearby, parks, cafes, landmarks and quiet; a sixth chip, Saved, lists walks saved on this phone (kept whole, so they work offline; synced once the server has a place for them). The sheet is non-modal, drags from its handle or toggles on tap, and snaps at 40% and 85% of the screen, capped at the space under the search and chips. Cards: route thumbnail, name, "3.4 km · 45 min · Easy", safety tag, Bookmark (a sibling of the card's button, not inside it). Preview: All walks (back), name, meta, safety tag, "Starts 0.8 km from you", "Rated 10 Nov", the safety note, Start This Walk (Papaya) and Save. Start This Walk starts tracking with the walk as a planned route (ActiveWalk.planned: id, name, polyline), drawn dashed Forest under the walked route on Walk; the drawn map fits the plan and the walker together. Search runs on submit; place results list the walks near that place. States: three skeleton cards while loading; empty; no results; error (pull to refresh); location off (Caption plus Open Settings, list centred on the profile city); offline (the last Nearby list, up to 30 walks, and saved walks; search disabled); signed out. Map: Mapbox with walk start points (tap to preview) and the selected route fitted above the sheet; the drawn fallback shows the selected route on land colour. After dark, Take Care walks also drop out of Nearby in the app.

Server note: the walk endpoints currently need a signed-in token. Signed-out requests go without one and show "Sign in to see walks near you. It backs up your walks too." with Sign In; once the server allows signed-out browsing, the list appears without an app change.

### 2.15 Journey

**Purpose:** see where walking has taken them over time.

**Layout, top to bottom**
1. Screen title. Under it, a month switcher: ChevronLeft, month and year in Label Ink, ChevronRight (48 dp targets; next month disabled while it's in the future).
2. 16 dp. Month total in Metric Ink with the journey count in Label Stone on the same baseline. Under it, a Caption Stone comparison with last month.
3. 20 dp. Calendar card (White):
   - Weekday initials in Caption Stone, Monday first.
   - Grid of 40 dp cells, dates in Label, tabular.
   - Goal met: 36 dp Papaya disc, Ink date.
   - Walked but under goal: 2 dp Papaya ring, Ink date.
   - Missed: Stone date with a 4 dp Sage dot under it.
   - Today: 1.5 dp Forest ring, 2 dp outside any disc or ring.
   - Future: Stone date, no mark.
   - Legend under the grid in Caption Stone with matching marks.
   - 16 dp, Sage divider, 16 dp. Streak row: Sunrise 20 dp in Papaya, current streak in Label Ink, best streak in Caption Stone at the right.
   - Streak rule: a day counts when they walk at least 1.0 km in total. Why: the streak rewards showing up; the ring already rewards distance.
4. 32 dp. Timeline for the selected month. Week headers in Caption Stone. Rows as on Home, inside one White card per week. The first 5 rows show, then Show All 18 Journeys expands the list in place. Why: Challenges stay reachable without a separate tab.
5. 32 dp. Section heading "Challenges" and a Caption Stone line. Cards (White, 16 dp padding, 12 dp apart): Lucide icon, title in Label Ink, one line in Caption Stone, an 8 dp progress bar (Papaya on Sand Deep), and the value in Label Ink, tabular. The streak challenge uses seven 12 dp circles instead of a bar. Finished challenges move into a row of small cards at the end. Each challenge, when finished, awards its keepsake.

Tapping a calendar day: one journey opens Journey Detail, several open a short sheet listing them, none does nothing.

**Components and states**
- Empty (new user): Ilé pattern in a 120 dp square, one line, Start Walk (Papaya).
- Empty month: calendar shows missed and future days; the timeline reads as below.
- Loading: local data; skeleton only past 150 ms.
- Error: none; all local.

**Offline:** everything is local. The city challenge checks walks against simplified city boundaries bundled with the app (about 60 KB for the main cities). Nothing is disabled. Journeys sync later.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Journey | Journey |
| Month | October 2026 | October 2026 |
| Summary | 86.4 km · 18 journeys | 86.4 km · 18 journeys |
| Comparison | 12.3 km more than September. | 12.3 km pass September. |
| First month | Small small, the kilometres add up. (touch) | Small small, the kilometres dey add up. |
| Legend | Goal met · Walked · Missed | Goal reach · Waka · Miss |
| Streak | Current streak: 6 days · Best: 14 days | Streak now: 6 days · Best: 14 days |
| Week headers | This week · 5 to 11 Oct | This week · 5 to 11 Oct |
| Expand | Show All 18 Journeys | Show All 18 Journeys |
| Challenges | Challenges · Side trips for the curious. | Challenges · Small adventure for you. |
| Walk Lagos | Cross the city on foot, one walk at a time. · 32.4 of 50 km | Cross the city with your leg, one waka at a time. · 32.4 out of 50 km |
| 7-Day Streak | Seven days in a row, morning or evening. · 4 of 7 days | Seven days straight, morning or evening. · 4 out of 7 days |
| First 100 km | That's Third Mainland Bridge more than eight times. · 61.2 of 100 km | Na Third Mainland Bridge pass eight times be that. · 61.2 out of 100 km |
| Empty | Your journeys will collect here, one walk at a time. | Your journeys go gather here, one waka at a time. |
| Empty month | No journeys in September. | No journey for September. |

**Motion:** none.

### 2.16 Journey Detail

**Purpose:** look back at one walk in detail.

**Layout, top to bottom**
1. Map, top 40%, interactive (pan and zoom; no rotation or tilt), lazy-loaded. Route in Papaya with its casing, start as a Forest ring, end as a Papaya dot, a marker at every kilometre (18 dp White circle, 1.5 dp Forest border, number in Caption). Back (ChevronLeft) as a 48 dp White circle at the top left inside the safe area; More (EllipsisVertical) at the top right with Rename, Share Journey and Delete Journey.
2. A Sand sheet with a 28 dp top radius overlaps the map by 24 dp.
3. Journey name in Screen title; date, time and area in Caption Stone.
4. 16 dp. Distance in Hero, Ink.
5. 12 dp. Three columns in Stat Ink over Caption labels: time, steps, average pace. Under them, the calorie estimate in Caption Stone.
6. 24 dp. Pace card (White): Section heading, then a 160 dp chart. X is kilometres; Y is minutes per km with faster at the top. Forest 2 dp line; average as a 1 dp dashed Sage line with its value in Caption. Axis labels in Caption Stone, no gridlines, no fill. Touch and drag shows a 1 dp Forest scrubber with the value.
7. 16 dp. Highlights: up to three White cards, icon 24 dp in Forest and one line of Body Ink. New streets are the parts of the route more than 25 m from any earlier walk, worked out on the phone.
8. 16 dp. Feedback card (White): one Label line, then Felt Safe and Felt Unsafe as Secondary buttons. The answer feeds the safety ratings and the buttons are replaced by a thank-you line.
9. 24 dp. White card with Delete Journey (Error text button, centred).
10. Bottom padding 32 dp plus the inset.

Delete opens a dialog: Cancel (Secondary) on top, Delete Journey (Error text) below. Keepsakes already earned stay.

**As built** (before Mapbox and sync):
- Map: the route on plain land colour (#ECE6DA), the spec's tiles-not-cached state, drawn as SVG with the 3.5 app layers: casing 9, walked 6, start ring, end dot, and a km marker at every whole kilometre along the route. Not yet pannable; that comes with Mapbox. Back and More sit on the map inside the safe area and scroll away with it; Android back and iOS swipe-back work throughout.
- Pace: walks record the moving time at each whole kilometre (Journey.kmTimes, stored as JSON in the journeys table, migration 2). The chart plots each kilometre and the last stretch if it's 0.25 km or more (its pace scaled to per km, labelled with its distance, e.g. 4.8); the y range is at least 30 s so a steady walk looks steady. The average's value is in the card header, not on the line, so it never collides with the data. Walks of 1 km or more saved before kilometre times were recorded show "Pace for each kilometre wasn't recorded for this walk."; a walk with one kilometre shows its pace as a sentence.
- Calories: "About 212 kcal", plus "· estimated for 70 kg" when no weight is set. Add Weight arrives with the Goals screen.
- Highlights: new streets (from 0.1 km) and fastest kilometre (needs two whole kilometres). Landmarks arrive with sync.
- Felt Safe / Felt Unsafe saves on the journey (Journey.feltSafe) and queues it for sync; hidden for walks with no route.
- More menu: a Sand sheet with Rename, Share Journey and Delete Journey (Ink label, Trash2 in Error, since Error text fails on Sand). Share shows a "not built yet" toast until share images exist.
- Delete: the dialog has Cancel (Secondary) and Delete Journey (Error text) only. Before deleting, every keepsake earned so far is stored with its date (kv keptKeepsakes, the earliest date kept), and Profile shows stored keepsakes as earned, so deleting never takes one away. The deletion is queued for sync as a tombstone. A snackbar confirms it.
- A journey that's no longer on the phone shows one Body Stone line with Back.

**Components and states**
- Map loading: Sand Deep with the route thumbnail scaled up.
- Map offline (tiles not cached): plain land colour with the route and a caption chip.
- No route (location denied during the walk): map area in Sand Deep with one line.
- Pace chart: walks under 1 km show one line instead of the chart.
- Highlights: section hidden when none qualify.
- Steps estimated (motion denied): "Estimated" in Caption after the steps label.
- Weight not set: a Caption line with an Add Weight text button under the calorie estimate.

**Offline**
- Shows: everything stored locally; cached tiles.
- Disabled: landmark highlights until synced.
- Syncs later: rename, delete, feedback.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Meta | 12 Oct 2026 · 6:12 am · Yaba | 12 Oct 2026 · 6:12 am · Yaba |
| Stat labels | Time · Steps · Avg pace | Time · Steps · Avg pace |
| Stats | 54:12 · 6,241 · 11:17 /km | 54:12 · 6,241 · 11:17 /km |
| Calories | About 212 kcal | Like 212 kcal |
| No weight | Add your weight in Goals for a closer estimate. · Add Weight | Put your weight for Goals make the number correct pass. · Add Weight |
| Pace | Pace · Avg 11:17 | Pace · Avg 11:17 |
| Pace empty | Walk 1 km or more to see your pace. | Waka 1 km or more make you see your pace. |
| New streets | You explored 2.1 km of new streets. | You waka 2.1 km for new streets. |
| Fastest km | Your fastest kilometre was km 3, at 10:42. | Your fastest kilometre na km 3, for 10:42. |
| Landmark | You walked past Tafawa Balewa Square. | You waka pass Tafawa Balewa Square. |
| Feedback | How did this route feel? · Felt Safe · Felt Unsafe | How this route take be? · E Safe · E No Safe |
| Feedback thanks | Thanks. This helps other walkers. | Thank you. This one go help other people. |
| No route | No route for this walk. Steps and time were recorded. | No route for this waka. We record steps and time. |
| Map offline | Map offline | Map no load |
| Menu | Rename · Share Journey · Delete Journey | Change Name · Share Your Waka · Delete This Waka |
| Delete dialog | Delete this journey? It will be removed from your stats, calendar and challenges. Keepsakes you've earned stay. This can't be undone. · Cancel · Delete Journey | You wan delete this journey? E go comot from your stats, calendar and challenges. Keepsakes wey you don get go remain. You no fit bring am back. · Cancel · Delete This Waka |

**Motion:** none. The camera fits the route without a fly-in.

### 2.17 Tips

**Purpose:** one practical, moderate habit a day, built around how Nigerians actually eat.

**Layout, top to bottom**
1. Back. Screen title.
2. 16 dp. Today's tip card (White, 20 dp padding): category icon and name in Caption Stone, the full tip in Body Ink, Bookmark icon button.
3. 8 dp. Disclaimer in Caption Stone.
4. 24 dp. Chips in a horizontal scroll: All, Portions, After Meals, Drinks, Smart Swaps, Habits, Saved.
5. 16 dp. The library, one section per category: Section heading with its icon, then a White card of rows. Each row shows the tip's first line in Label Ink with a ChevronDown; tapping expands it in place to the full tip in Body and a Bookmark button. Three rows per category, then a See All 24 text button.

Category icons: Portions (ChartPie), After Meals (Utensils), Drinks (CupSoda), Smart Swaps (ArrowLeftRight), Habits (Repeat), Saved (Bookmark).

Text only, no images. Why: a photo of jollof costs data and doesn't make the advice clearer.

**Editorial rules:** every tip is one thing they can do today. No daily calorie targets, fasting plans, detox teas, slimming products or "never eat" rules. No shaming words (bad food, cheat day, guilty). Tips are written or checked by a registered Nigerian dietitian. 280 characters at most. Today's tip changes at 4:00 am; if they set a weight goal, Portions and Smart Swaps come up more often.

**Sample tips**

| Category | English | Pidgin |
|---|---|---|
| Portions | Serve your jollof with a cupped hand, not a heaped spoon. Fill the rest of the plate with salad, beans or fish. | Dish your jollof with cupped hand, no be heaped spoon. Fill the rest of the plate with salad, beans or fish. |
| After Meals | A 10-minute walk after dinner helps your body handle the meal. A few rounds of the compound count. | Waka 10 minutes after you chop dinner. E dey help your body handle the food. Even round the compound dey count. |
| Drinks | Malt and minerals carry a lot of sugar. Swap one bottle a day for water, or zobo made with less sugar. | Malt and minerals get plenty sugar. Change one bottle every day to water, or zobo wey no too sweet. |
| Smart Swaps | Love dodo? Have boli or boiled plantain a few days a week. Same sweetness, much less oil. | You like dodo? Chop boli or boiled plantain some days. E still sweet, but oil no plenty. |
| Habits | Dish food in the kitchen and leave the pot there. Going back for more becomes a choice, not a habit. | Dish food for kitchen and leave the pot there. To go collect more go be choice, no be habit. |
| Portions | Drinking garri? Go easy on the sugar and add groundnuts. You'll stay full for longer. | You dey drink garri? Reduce the sugar and add groundnut. E go hold your belle well. |

**Components and states**
- Row: collapsed, expanded, saved.
- Saved, empty: one line.
- No loading or error states; the library is bundled.

**Offline**
- Shows: the whole library (about 200 tips, under 200 KB of text).
- Disabled: nothing.
- Syncs later: saved tips. New tips arrive with each sync.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Tips | Tips |
| Today | Today's tip | Today tip |
| Disclaimer | General guidance, not medical advice. If you have diabetes, high blood pressure or another condition, check with your doctor first. | Na general advice, no be doctor advice. If you get diabetes, high BP or any other condition, talk to your doctor first. |
| Chips | All · Portions · After Meals · Drinks · Smart Swaps · Habits · Saved | All · Portions · After Food · Drinks · Smart Swaps · Habits · Saved |
| Saved empty | Tap the bookmark on any tip to keep it here. | Tap the bookmark for any tip make e stay here. |
| Button | See All 24 | See All 24 |

**Motion:** none. Rows expand in place.

### 2.18 Voice Settings

**Purpose:** control what the walk voice says and how it sits with music.

Opens from Profile > Settings > Voice, and from the Volume2 button on Walk (as a modal sheet over Walk with the same content).

**Layout, top to bottom**
1. Back. Screen title.
2. 16 dp. White card with a switch row: announcements, with a Caption.
3. 24 dp. Section heading "Voice". White card with two rows, Ada and Tunde: radio, name in Label, description in Caption Stone, Play preview (48 dp).
4. 24 dp. Section heading "What it says". White card with a switch row for calories (on by default).
5. 24 dp. Section heading "Music while the voice speaks". White card with three radio rows: Lower Music (default), Pause Music, Keep Music Playing. Caption under the card. Why three choices instead of a slider: Android and iOS set how far other apps' audio ducks, so we can offer duck, pause or mix, but not a percentage.
6. 24 dp. Section heading "Voice packs". One row per pack: language and voice in Label, size and status in Caption Stone, and a Download text button, or Remove (Error text) for downloaded packs that aren't bundled.

**Voice engine** (for the dev team)
- Clips are recorded by two Nigerian voice actors, a woman (Ada) and a man (Tunde), each reading English and Pidgin, from the recording script (voice-recording/script.json, about 200 lines each). Never generated during a walk. Why real voices: natural Pidgin, and the app should sound like people, not a machine. Numbers, step counts and units sound the same in both languages, so each actor records them once and both language packs share them.
- Both English packs (Ada and Tunde) ship inside the app, so the first walk works offline whichever voice they get. Pidgin packs download when Pidgin is chosen, on Wi-Fi or on mobile data with consent.
- Stitching: clips join with 40 ms gaps. Numbers are recorded inside a carrier sentence and trimmed, so each one has level intonation. Numbers above 99 are built from parts: 252 is "two hundred and" plus "fifty-two". Distances read "four point eight kilometres".
- Fallback when a pack is missing or damaged: the phone's own text-to-speech, using an en-NG voice if installed, otherwise en-GB.
- Audio focus: Lower Music uses AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK on Android and the duckOthers option on iOS. Pause Music uses AUDIOFOCUS_GAIN_TRANSIENT and interruptSpokenAudioAndMixWithOthers. Keep Music Playing requests no focus on Android and uses mixWithOthers on iOS. Focus is released as soon as the clip ends.

**Until the recordings arrive** (built now): the phone's own text-to-speech reads the same wording (expo-speech, works in Expo Go), using a Nigerian English voice if the phone has one, otherwise British English. Ada and Tunde are the same phone voice at different pitches (1.1 and 0.85), with a Caption under the Voice card saying so. Music settings are saved but apply once recorded clips play through the audio engine; the Caption says so. The Voice packs section is hidden until packs exist. Settings save as they change. The announcer runs from the root layout, so it keeps speaking when Walk is minimised; it starts counting from the current step total, so a restored walk never announces late. The water reminder speaks its title and reason when it appears. On Walk, the speaker icon shows VolumeX while announcements are off; Profile's Walk voice row shows the chosen voice or Off.

**Wording for clips:** the step update's last sentence is "The next 1,000 steps will bring you to 252 calories." rather than naming the next step total mid-sentence, so it's built from clips already in the script.

**Components and states**
- Announcements off: the sections below are shown at 40% opacity and don't respond.
- Preview: playing (Pause icon), stopped.
- Pack: bundled, downloadable, downloading (progress and Cancel), downloaded, failed (message and Try Again).

**Offline**
- Shows: every setting; previews for packs on the phone.
- Disabled: Download, with a Caption.
- Syncs later: voice choice and switches.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Title | Voice | Voice |
| Switch | Walk announcements · Every 1,000 steps | Waka announcement · Every 1,000 steps |
| Voices | Ada · Female voice, Nigerian English · Tunde · Male voice, Nigerian English | Ada · Woman voice, Nigerian Pidgin · Tunde · Man voice, Nigerian Pidgin |
| What it says | Include calories | Talk calories too |
| Music options | Lower Music · Pause Music · Keep Music Playing | Reduce Music · Pause Music · Make Music Continue |
| Music caption | Music comes back as soon as the voice stops. | Music go come back as the voice finish. |
| Pack row | Pidgin · Ada · 1.2 MB · Download | Pidgin · Ada · 1.2 MB · Download |
| Downloading | 0.6 of 1.2 MB · Cancel | 0.6 out of 1.2 MB · Cancel |
| Download failed | Download didn't finish. Try again on Wi-Fi. · Try Again | Download no finish. Try again with Wi-Fi. · Try Again |
| Offline | Connect to download. | You need network to download. |
| Preview clip | 1,000 steps. You've walked 0.8 kilometres. | 1,000 steps. You don waka 0.8 kilometres. |

**Motion:** none.

### 2.19 Profile

**Purpose:** their walking record, their keepsakes and their settings, in one place.

**Layout, top to bottom**
1. Cover, 136 dp plus the status bar, edge to edge. Their cover photo (16:9, resized to 1080 px wide), or, until they add one, the Ọ̀nà pattern on Forest: an empty state, so the pattern is allowed. A 40 dp White circle with ImagePlus at the bottom right changes it.
2. Avatar, 88 dp on a 4 dp Sand ring (no shadow), overlapping the cover by half; a 28 dp Forest camera badge says it can be changed. Photo (square, resized to 216 px) or initials. To its right, below the cover: an Edit Profile chip (40 dp, White, 12 radius, Pencil and Forest label).
3. 12 dp. Name in Screen title; "Walking since Aug 2026 · Lagos" in Caption Stone.
4. 24 dp, then sections 32 dp apart:
   - Backup card (no account only): CloudUpload in a Sand Deep circle, Section title, Body Stone line, Back Up My Journeys (Primary), I Have an Account (text button). With an account, the Backup row in Account shows the masked number.
   - About card: their bio (up to 160 characters), or a Stone prompt with an Add About text button. Below a Sage divider, up to three facts worked out from their last 30 walks, each with a 16 dp icon in a 32 dp Sand Deep circle: usual time of day (if it's at least half their walks), usual distance (median), and the area they walk most (if it comes up 3 or more times). Why: the card is never empty, even before they write anything.
   - Your walking: a wide card with lifetime distance in Metric, "walked in total", and how many times that is across Third Mainland Bridge (11.8 km). Then a 2 x 2 grid of White tiles, 12 dp gaps: Journeys, Current streak (Sunrise in Papaya), Best streak, Longest walk. Lifetime figures come from the whole database, not the 120 days in memory.
   - Keepsakes: heading with "7 of 9", then the shelf (96 x 120 badges, 12 dp apart, title under each), running to the right screen edge to show it scrolls. Tap opens the Keepsake sheet.
   - Preferences card: Language (opens a two-option sheet), Daily goal (opens the goal sheet, below), Walk voice, Reminders.

**Daily goal sheet** (from Preferences): title, one Body Stone line, the Basics stepper (White, 20 radius, 72 dp: Minus, value in Stat, Plus; 1.0 to 15.0 km in 0.5 km steps, light selection haptic per step), a Caption estimate, then Save Goal (Primary) and Cancel (text). Nothing changes until Save, so a stray tap can't move today's ring; the sheet always opens at the saved goal. At either limit the button dims to 40% and a Caption names the limit. The estimate uses their own stride and pace from up to 20 recent walks of 1 km or more once there are 3 ("...at your usual pace"), otherwise 0.76 m and 12 min per km; steps round to the nearest 100 and time to the nearest 5 minutes. Saving a new value updates Home's ring and week chart at once and shows a snackbar. Screen readers get one adjustable control with the value spoken. A goal change applies to today; when the calendar's goal-met marks are built, store the goal per day so past days keep the goal they had.
   - Account card: Backup, Walk Safe, Privacy. Sign Out (text button) under it when signed in.
5. Rows are 56 dp: 24 dp Forest icon, Label, value in Caption Stone, Sage chevron; dividers start at the text.

**Edit Profile** (sheet): Name (required, 30 characters), About you (multiline, 160, with a "0 / 160" counter), City. Save (Primary).

**Sub-screens** (stack screens, same list style)
- **Goals.** Daily distance (stepper as in Basics). Walking days per week, 3 to 7, default 5 (used for the weekly summary, not the streak). Weight goal: current weight, target weight, and pace, Gentle (0.25 kg a week) or Steady (0.5 kg a week), nothing faster. Weight also sharpens calorie estimates. Remove Weight Goal in Error text.
- **Connected Devices.** Health Connect (Android) or Apple Health (iOS), with Connect or Disconnect, plus, on Android, Music Controls showing whether notification access is on, with Open Settings. Music needs no account connection (2.9). Health integrations write walks as walking workouts with distance and steps, and read nothing. Why: reading steps from other apps would double-count.
- **Reminders** (opens from Preferences > Reminders; the row shows the daily time or Off). Daily reminder (on; Auto or a set time). Streak reminder at 7:00 pm (on, except for Just Walk). Weekly summary, Sunday 6:00 pm (on). Walk Safe updates (on) appears once Walk Safe is built.
  - Layout: Back, title, then a permission card when notifications aren't allowed (BellOff, "Notifications are off", Body Stone line, Turn On to show the system dialog, or Open Settings once they've been blocked), then one White card per reminder with a switch row; the daily card adds a Time row ("Auto · 6:30 am") that opens the time sheet. A Caption under the cards says reminders are set on the phone, so they arrive without data. Settings save as they change.
  - Time sheet: Auto ("Your usual walking time, now 6:30 am", or "6:30 am for now. It learns your time after a few walks.") or Set a time, with the stepper in 15-minute steps from 5:00 am to 9:00 pm. Save Time and Cancel.
  - How they're scheduled: local notifications (expo-notifications), planned on the phone and rebuilt whenever the app opens or returns, a walk is saved, or reminder settings, name or language change. Daily: the next 7 days at the set time, or at their usual time (the median start time of the last 14 walks, to the nearest 15 minutes, once there are 3; otherwise 6:30 am); today's is skipped if they've already walked. Streak: today at 7:00 pm only, when a streak is running and today hasn't reached 1 km; never scheduled ahead, because tomorrow's depends on today. Weekly: the next Sunday at 6:00 pm. Android channel "Reminders" at default importance; the small icon is the path mark in white (assets/notification-icon.png), tinted Forest. Builds without the notifications module show "Reminders need a newer build of the app." and schedule nothing.
  - Not yet built: the first-walk ask on Journey Complete (1.1 step 10). Until then, permission is asked from this screen.
- **Privacy.** Hide the start and end of shared routes (on, 200 m). Share anonymised walks to improve safety ratings (on). Download My Data (JSON and GPX). Delete Account in Error text, confirmed by dialog and a code.
- **Settings.** Language (English, Pidgin). Voice (opens 2.18). Walking: Auto-pause (off; why: standing at a junction is part of a city walk, and GPS drift makes auto-pause flicker), Keep Screen On (off), Show Calories (on), Hydration Reminders (on). Data: Download Map for My Area (on, Wi-Fi only), Use Mobile Data for Downloads (off), Clear Map Cache. About: version, licences, Mapbox and OpenStreetMap credits, pattern credits.

**Keepsake sheet** (opens from the shelf and from Journey Complete; modal, Sand)
- Badge at 200 × 250 dp, centred.
- 20 dp. Title in Section Ink, milestone in Body Stone, earned date in Caption Stone.
- 24 dp. Share Image (Primary), then Download Certificate (Secondary). Why share is primary: it's the common action; the certificate is for the few who print.
- Locked: the outline badge, title, what earns it, and a progress bar with the value.

**Components and states**
- New user: stats at 0, every keepsake locked, backup card shown.
- Avatar: photo, initials.
- Sync line: synced, waiting (count with CloudOff).
- Certificate: generating (spinner on the button), failed (inline message).
- Sign Out with unsynced journeys: blocked by a dialog until they sync. Why: signing out would delete walks that exist only on this phone.

**Offline**
- Shows: everything stored on the phone, including keepsakes, certificates and share images (made on the phone).
- Disabled: Back Up My Journeys, Sign Out, Connect, Download My Data, Delete Account, each with a Caption.
- Syncs later: profile edits, goals, settings.

**Copy**

| Element | English | Pidgin |
|---|---|---|
| Daily reminder | Good morning, Tolu. It's a good hour for a walk. (Good afternoon / Good evening by the reminder's time) | Morning o, Tolu. Time don reach to waka small. (Afternoon o / Evening o) |
| Streak reminder | A short walk keeps your 6-day streak going. | Small waka go keep your 6-day streak alive. |
| Weekly summary | Your week in walks is ready. See how far you went. | Your waka for this week don ready. Come see how far you go. |
| Reminders screen | Notifications are off · Turn them on so Irin Ajo can nudge you at your walking time. · Turn On · Open Settings · Daily reminder · A nudge at your walking time · Time · Auto · 6:30 am · Streak reminder · 7:00 pm, only if you haven't walked 1 km yet · Weekly summary · Sundays at 6:00 pm · Reminders are set on your phone, so they arrive even without data. | Notifications no dey on · On am make Irin Ajo fit remind you when e reach your waka time. · On Am · Open Settings · Daily reminder · Small reminder when e reach your waka time · Time · Auto · 6:30 am · Streak reminder · 7:00 pm, only if you never waka 1 km yet · Weekly summary · Every Sunday by 6:00 pm · Na your phone dey keep the reminders, so dem go still come even without data. |
| Since | Walking since Oct 2026 | Dey waka since Oct 2026 |
| Backup card | Back up your journeys · Sign in so your walks and keepsakes are safe if you change phones. | Back up your journeys · Sign in make your waka and keepsakes dey safe if you change phone. |
| Sync line | Synced 2 min ago · 3 journeys waiting to sync | Synced 2 min ago · 3 journeys dey wait to sync |
| Stats | 312.6 · km walked · 54 · journeys · 14 days · best streak | 312.6 · km you don waka · 54 · journeys · 14 days · best streak |
| Keepsakes | Keepsakes · 5 of 9 | Keepsakes · 5 out of 9 |
| Rows | Goals · Walk Safe · Connected Devices · Notifications · Privacy · Settings | Goals · Walk Safe · Connected Devices · Notifications · Privacy · Settings |
| Weight cap | We cap this at 0.5 kg a week. Slow is what lasts. | We no dey pass 0.5 kg every week. Na slow slow dey last. |
| Goal sheet | Daily goal · How far you'd like to walk each day. The ring on Home fills as you go. · About 12,300 steps, around 1 hour 50 minutes at your usual pace. · 15 km is the highest goal. · Save Goal · Cancel | Daily goal · How far you wan waka every day. The ring for Home go dey fill as you waka. · Like 12,300 steps, about 1 hour 50 minutes the way you dey waka. · 15 km na the highest goal. · Save Goal · Cancel |
| Goal saved | Daily goal set to 5.5 km. | Your daily goal na 5.5 km now. |
| Keepsake earned | First 10 km · 10 km walked · Earned 12 Oct 2026 | First 10 km · 10 km don waka · You get am 12 Oct 2026 |
| Keepsake locked | First 50 km · Walk 50 km in total to earn this. · 32.4 of 50 km | First 50 km · Waka 50 km total to get this one. · 32.4 out of 50 km |
| Certificate error | Couldn't make the certificate. Try again. | Certificate no fit make. Try again. |
| Sign out blocked | Sync your 3 journeys before signing out, or they'll be lost. | Sync your 3 journeys before you sign out, if not dem go lost. |
| Offline | Connect to back up. | You need network to back up. |
| Buttons | Back Up My Journeys · Not Now · Sign Out · Share Image · Download Certificate · Remove Weight Goal · Delete Account | Back Up My Journeys · Later · Sign Out · Share Picture · Download Certificate · Remove Weight Goal · Delete Account |

**Motion:** the Keepsake sheet uses the standard sheet slide. The keepsake reveal runs only on Journey Complete.

## 3. Style guide

Personality: grounded, exploratory, warm, premium, human. The one bold element on any screen is distance, set large in Manrope, with Papaya marking progress around it. Everything else stays quiet.

### 3.1 Colour

| Token | Hex | Use | Rules |
|---|---|---|---|
| forest | #0F4A3C | Primary buttons, tab bar, active states, icons on light surfaces, planned routes, route casing | Text on Forest is White or Sand. |
| papaya | #FF9A1A | Start Walk, centre Walk tab, progress (ring, bars, today's bar), walked route, streak icon and calendar days, keepsake keylines, active tab indicator | Never text. Text on Papaya is Ink or Forest, never White. One Papaya-filled button per screen at most, not counting the centre tab. |
| sunflower | #FFC83D | Celebration moments only: the goal-reached check on Home, the New Keepsake tag on Journey Complete, the keepsake reveal | Never text, never navigation, buttons or progress. Text on Sunflower is Ink. Used sparingly, so a celebration still feels like one. |
| sand | #F8F3EB | Screen backgrounds, sheets, text and icons on Forest | Screen backgrounds are always Sand, never White. |
| sand-deep | #EEE5D6 | Ring and bar tracks, skeletons, icon circles, chips and tags on White, map placeholders | Derived from Sand because Sand is too faint for a track on White. Text on it is Ink or Forest only. |
| white | #FFFFFF | Cards, inputs, dialogs, floating map buttons | Never a screen background. |
| ink | #17201D | Primary text, Start Walk label, snackbar fill | |
| stone | #5B6B63 | Secondary text, captions, placeholders, map labels | Only on Sand, White or the map's land colour. |
| sage | #A8B8A5 | Inactive tab icons, dividers, missed days, goal lines, unselected suggestion routes, pattern colour | Never text. |
| indigo | #2B3A67 | Patterns and keepsakes only | Never in UI chrome or text. |
| error | #C94C4C | Destructive text buttons, error icons, Take Care safety icon | As text, only on White. |
| success | #2E7D5B | Good safety icon, success icons | As text, only on White. |

Overlays: Forest at 8% for pressed states on light surfaces. Ink at 16% for pressed states on filled buttons (12% on Papaya). Ink at 40% for the scrim behind dialogs and modal sheets.

**Palette brightened (November 2026):** Papaya became Golden papaya (#FF9A1A, from #F28C5B), sunny rather than sporty and well apart from Strava's orange; Forest lifted slightly (#0F4A3C, from #123B32); Sand and Sand Deep lightened (#F8F3EB and #EEE5D6). Sunflower (#FFC83D) was added for celebration moments only. Layout, type and the quiet feel are unchanged. The pattern tokens were recomputed at the same opacities. src/lib/__tests__/contrast.test.ts checks every pairing below against colors.json, so a palette change can't quietly break readability.

**Contrast, checked pairs**

| Pair | Ratio | Result |
|---|---|---|
| Ink on Sand | 15.1:1 | Pass |
| Ink on White | 16.7:1 | Pass |
| Forest on Sand, Sand on Forest | 9.2:1 | Pass |
| White on Forest | 10.2:1 | Pass |
| Stone on Sand | 5.1:1 | Pass |
| Stone on White | 5.6:1 | Pass |
| Ink on Papaya | 7.8:1 | Pass |
| Forest on Papaya | 4.8:1 | Pass |
| Ink on Sunflower | 10.8:1 | Pass |
| Sand on Indigo | 10.0:1 | Pass |
| Success on White | 5.0:1 | Pass |
| Error on White | 4.5:1 | Pass, just |
| Stone on Sand Deep | 4.5:1 | Pass, just |
| Error on Sand | 4.1:1 | Fails AA, not allowed |
| Success on Sand | 4.5:1 | Pass, but kept to White for consistency |
| White on Papaya | 2.1:1 | Fails AA, not allowed |

Because Error fails on Sand, inline error messages are set in Ink with a CircleAlert icon in Error. Papaya graphics (ring, route) never carry meaning alone: the ring has its number, and the route has a Forest casing.

### 3.2 Typography

**Fonts:** Manrope Bold and ExtraBold; Plus Jakarta Sans Regular, Medium, SemiBold and Bold. Static TTFs named by their PostScript names, embedded with the expo-font config plugin. Why: one fontFamily string works on both platforms, and Android never fakes a weight. Subset to Latin, Latin Extended and Latin Extended Additional. Tested: Manrope has no ṣ and no combining tone marks, so any Yoruba with tone marks (pattern names, place names) is set in Plus Jakarta Sans, which covers all of them. Both families have tabular figures.

| Token | Font | Size / line | Tracking | Use |
|---|---|---|---|---|
| display | Manrope 800 | 64 / 68 | -1.3 | Live distance on Walk only |
| hero | Manrope 700 | 44 / 50 | -0.9 | Home ring distance, Journey Detail distance |
| metric | Manrope 800 | 40 / 46 | -0.8 | Journey Complete distance, monthly total |
| title | Manrope 700 | 30 / 36 | -0.3 | Screen titles, greeting name, journey names |
| stat | Manrope 700 | 24 / 30 | -0.2 | Second-tier numbers: steps and timer on Walk, stat tiles, stepper value |
| section | Manrope 700 | 18 / 24 | 0 | Section headings, card titles, units beside Hero |
| body | Plus Jakarta Sans 400 | 16 / 24 | 0 | Body text |
| button | Plus Jakarta Sans 600 | 16 / 20 | 0 | Button labels |
| label | Plus Jakarta Sans 600 | 14 / 20 | 0 | Field labels, row titles, key meta |
| caption | Plus Jakarta Sans 500 | 12 / 16 | 0 | Captions, chart labels, tab labels |
| status | Plus Jakarta Sans 700 | 12 / 16 | +1.2, uppercase | WALKING, PAUSED, SHARING WITH MUM, JOURNEY COMPLETE, NEW KEEPSAKE |

Three tokens are added to the brief's scale. Stat fills the gap between 40 and 18 for numbers that matter but aren't the headline. Button, because 14 dp labels look lost on a 54 dp button. Status, so uppercase labels have their own tracked style.

**Rules**
- Tabular figures (fontVariant tabular-nums) on every number that updates or counts: display, hero, metric, stat, timer, calendar dates, progress values.
- Units sit one step down and in Stone: "4.8" in Display with "km" in Stat.
- Font scaling: body, label, caption and button scale up to 1.5× (maxFontSizeMultiplier). Display, hero, metric and stat cap at 1.15×. Why: the big numbers are already large, and scaling them further would push the Walk controls off screen.
- Names truncate to one line with an ellipsis. Tips never truncate except on Home (4 lines).
- Never Inter, never a system font fallback in production builds.

### 3.3 Spacing and layout

4 dp grid.

| Token | dp | Typical use |
|---|---|---|
| 1 | 4 | Icon to text in tight rows, number to unit |
| 2 | 8 | Chip gaps, label to input |
| 3 | 12 | Card gaps in grids, heading to content |
| 4 | 16 | Gaps between cards, compact card padding |
| 5 | 20 | Screen padding, card padding |
| 6 | 24 | Sheet and dialog padding |
| 8 | 32 | Gaps between sections |
| 12 | 48 | Minimum touch target |
| 16 | 64 | Start Walk and Walk control height, tab bar height |

- Screen padding 20 dp on every screen. Maps, pattern bands and the walk strip run edge to edge.
- Touch targets 48 dp minimum on both platforms (above iOS's 44 pt).
- Content on tab screens ends with bottom padding of tab bar height plus 40 dp, which clears the raised Walk button.

**Radii**

| Token | dp | Use |
|---|---|---|
| sm | 8 | Tags, album artwork, small chips inside cards |
| md | 12 | Chips, route thumbnails, snackbars |
| lg | 16 | Buttons, inputs, Walk row cards |
| xl | 20 | Cards, dialogs, pattern tiles in empty states |
| 2xl | 28 | Top corners of sheets |
| full | circle | Avatars, centre Walk tab, map buttons, markers |

### 3.4 Components

**Buttons**

| Button | Size | Fill | Label | Border | Pressed |
|---|---|---|---|---|---|
| Primary | 54 dp high, 16 radius, full width or 24 dp side padding | Forest | White, button type | None | Ink 16% overlay |
| Start Walk | 64 dp high, 16 radius, full width | Papaya | Ink, Footprints icon | None | Ink 12% overlay |
| Pause / Resume | 64 dp high, 16 radius | Forest | White, Pause or Play icon | None | Ink 16% overlay |
| Hold to End | 64 dp high, 16 radius | White | Forest | 1.5 dp Forest | Forest fills over 1.2 s (2.9) |
| Secondary | 54 dp high, 16 radius | White on Sand, Sand on White | Forest | 1.5 dp Forest | Forest 8% overlay |
| Text | 48 dp hit area | None | Forest, label or button type | None | Forest 8%, 8 radius |
| Destructive | 48 dp hit area, text only | None | Error, button type | None | Error 8%, 8 radius |
| Icon | 48 × 48, 24 dp icon | None | Forest icon | None | Forest 8% circle |
| Map | 48 dp circle | White | Forest icon | None | Forest 8% |

- Destructive buttons appear only on White surfaces and always open a confirm dialog.
- Disabled: 40% opacity, used only for actions that can't run offline or before a prerequisite, always with a Caption saying why.
- Loading: the label is replaced by a 20 dp spinner in the label colour; width stays fixed; taps are ignored.
- Focus (keyboard, switch access): 2 dp Forest outline 2 dp outside the shape; Sand outline on Forest fills.
- No Android ripple. Why: pressed states look the same on both platforms.
- Never pills, gradients or shadows on any button.

**Inputs:** 54 dp high, 16 radius, White, 1 dp Sage border, 16 dp padding, Body in Ink, placeholder in Stone, Label above with an 8 dp gap. Focus: 2 dp Forest border. Error: 2 dp Error border and the message below in Caption Ink with a 16 dp CircleAlert in Error.

**Chips:** 40 dp high, 12 radius, 16 dp side padding, Label type. Default: White fill, Forest label (Sand Deep fill when on a White card). Selected: Forest fill, White label. Why 12 radius: it separates chips from 16 dp buttons and keeps them clear of pill shapes.

**Option cards:** White, 20 radius, 16 dp padding. Selected: 2 dp Forest border and a 24 dp Forest circle with a 16 dp White Check at the top right.

**Radio:** 24 dp circle with a 2 dp Stone ring. Selected: Forest ring with a 12 dp Forest centre.

**Switch:** custom so it looks the same on both platforms. Track 52 × 32 dp: Sage off, Forest on. Thumb: 24 dp White circle inset 4 dp. Slides in 200 ms. Row height 56 dp, label on the left.

**Cards:** White on Sand, 20 radius, 20 dp padding, no shadow, no border. Surfaces nested inside a White card use Sand or Sand Deep. Pressable cards take the Forest 8% overlay.

**List rows:** inside a White card, 56 dp minimum, 16 dp padding, 24 dp Forest icon, title in Label Ink, value in Caption Stone, 20 dp ChevronRight in Sage, 1 dp Sage divider starting at the text.

**Bottom sheets:** Sand, 28 dp top radius, 32 × 4 dp Sage handle 8 dp from the top, 24 dp padding, bottom inset respected. Modal sheets sit on an Ink 40% scrim. Non-modal sheets (Explore, Walk Ready, Walk Paused) have no scrim.

**Dialogs:** White, 20 radius, 24 dp padding, screen width minus 48 dp (400 dp maximum). Title in Section Ink, body in Body Stone. Buttons stacked full width. In destructive dialogs, Cancel is the Secondary button on top and the destructive action is Error text below it. Why: the safe choice is the bigger target.

**Snackbar:** Ink fill, 12 radius, 48 dp minimum height, 16 dp padding, Label in Sand, optional action in Sand bold. 12 dp above the tab bar or bottom inset. 4 s. One at a time.

**Tab bar:** Forest, 64 dp plus the bottom inset, no top border, no shadow.
- Side tabs: 24 dp icon with a Caption label 4 dp below. Inactive: Sage icon, Sand label. Active: Sand icon, Sand label in Plus Jakarta Sans Bold, and a 3 × 24 dp Papaya bar (2 dp radius) on the bar's top edge above the icon.
- Centre Walk: a 64 dp Papaya circle with a 28 dp Footprints icon in Ink, ringed by 6 dp of Sand, its centre on the bar's top edge so half of it rises above the bar. No text label; accessibility label "Walk". Pressed: Ink 12% overlay. The Sand ring separates it from the bar without a shadow.

**Walk strip:** 40 dp, Forest, full width under the status bar. Status-style text in Sand and a 20 dp ChevronUp.

**Progress ring:** react-native-svg circle with strokeDasharray. 200 dp with a 14 dp stroke (Home), 40 dp with a 4 dp stroke (inline). Sand Deep track, Papaya progress, round caps, 12 o'clock start, clockwise. Static.

**Progress bar:** 8 dp, 4 radius, Sand Deep track, Papaya fill. Value in Label, tabular.

**Weekly bars and calendar:** specified in 2.7 and 2.15.

**Safety tag:** 28 dp, 8 radius, Sand Deep fill on White, 8 dp side padding, 16 dp icon and Caption Ink text. Good: ShieldCheck in Success. Fair: Shield in Stone. Take Care: ShieldAlert in Error. The text always names the level. Why: colour is never the only signal.

**Position marker:** concentric circles that echo the Oòrùn pattern. 30 dp Sand circle, 22 dp Forest circle, 10 dp Sand circle, 6 dp Papaya centre. Heading: a 60° Forest wedge at 20% with a 48 dp radius, behind the marker, only while moving or when the compass is reliable. Accuracy: Forest 8% circle when accuracy is worse than 20 m. No fix for over 10 s: the Forest circle turns Sage. No pulse.

**Route thumbnail:** 56 or 72 dp square, 12 radius, Sand Deep. The stored route simplified to 60 points or fewer, drawn as a 2.5 dp Papaya line with round joins, a 6 dp Forest start dot and a 6 dp Papaya end dot. Generated as SVG from the local polyline, no map tiles. Why: zero data and fast in long lists.

**Skeletons:** static Sand Deep blocks shaped like the content they replace. No shimmer. Why: the brief limits custom motion, and shimmer costs frames on 2 GB phones.

**Empty states:** centred in their container. Where patterns are allowed, a 120 dp pattern tile with a 20 dp radius; elsewhere, a 64 dp Sand Deep circle with a 32 dp Forest icon. Then 16 dp, title in Section Ink, 8 dp, one line of Body Stone, 20 dp, an optional button.

**Avatar:** circle, 40 or 72 dp. Photo, or initials in Manrope Bold, Sand on Forest (16 dp at 40, 28 dp at 72).

**Charts:** Forest 2 dp line, Sage 1 dp dashed reference line, Caption Stone labels, no gridlines, no fills.

### 3.5 Map style

Use Mapbox (@rnmapbox/maps) on both platforms with one custom Studio style. Why: it offers offline tile packs for the user's area and one style that renders the same on Android and iOS.

**Rules**
- 2D only. No pitch, rotation or 3D buildings on Walk.
- Warm and clear (November 2026): white streets with a soft edge, a gentle yellow on main roads so they can be followed, green parks, blue water, a faint warm tint on campuses and pink on hospital grounds. Buildings from zoom 15.5.
- Labels: neighbourhood names in bold from zoom 11; every street named from zoom 14.
- Landmarks, because people in Lagos find their way by them: Mapbox Streets icons with names, using Mapbox's own density rule (filter rank up to 3, then 4 at zoom 16 and 5 at 17, with label collision). From zoom 12.5: colleges and schools, hospitals, parks, sport grounds, monuments and attractions. From 14.5: named places, markets and fuel stations. From 15.5: churches, mosques and police posts. Label colours: education brown, medical red, parks and sport green, the rest Stone; all at least 5.6:1 on the land colour.
- Hidden: admin boundaries, transit, road shields, ferry lines, hillshade.
- Fonts: Mapbox's DIN Pro until Plus Jakarta Sans is uploaded to Studio. Icons: the Mapbox Streets sprite.
- Mapbox logo and attribution stay visible; on Walk they sit at the top left of the map.

**Base style:** `src/map/irin-ajo-style.json` is the source (Mapbox Streets v8 data). Key values:

| Layer | Colour |
|---|---|
| Land | #F7F2E9 |
| Parks, pitches, grass, woods | #CFE6C2 |
| Campuses / hospital grounds | #F2E6D3 / #F6E3DF |
| Water and waterways | #A9D9E2 |
| Buildings (fill / outline) | #EDE5D8 / #E0D6C6 |
| Streets (fill / edge) | #FFFFFF / #E6DCCB |
| Main roads (fill / edge) | #FFF3DA / #E3D2B0 |
| Footpaths (dashed) | #C9BEA9 |
| Rail | #CFC5B4 |
| Labels: places / roads | #2F3B35 / #4F5E57, Land halo |
| Labels: education / medical / parks | #87531A / #A83A3A / #2E6B45 |

The walked route (Golden papaya over its Forest casing) was checked against the yellow main roads and stays clearly visible.

**App layers** (@rnmapbox/maps LineLayer and CircleLayer styles)

```js
export const mapLayers = {
  routeCasing: {
    lineColor: '#0F4A3C',
    lineWidth: ['interpolate', ['linear'], ['zoom'], 12, 5, 16, 9, 18, 11],
    lineCap: 'round',
    lineJoin: 'round',
  },
  routeWalked: {
    lineColor: '#FF9A1A',
    lineWidth: ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 6, 18, 8],
    lineCap: 'round',
    lineJoin: 'round',
  },
  routePlanned: {
    lineColor: '#0F4A3C',
    lineOpacity: 0.6,
    lineWidth: 4,
    lineDasharray: [1.5, 1.5],
  },
  routeSuggestion: {
    lineColor: '#A8B8A5',
    lineWidth: 3,
    lineDasharray: [1.5, 1.5],
  },
  kmMarker: {
    circleRadius: 9,
    circleColor: '#FFFFFF',
    circleStrokeColor: '#0F4A3C',
    circleStrokeWidth: 1.5,
  },
  startPoint: {
    circleRadius: 6,
    circleColor: '#F8F3EB',
    circleStrokeColor: '#0F4A3C',
    circleStrokeWidth: 2.5,
  },
  endPoint: {
    circleRadius: 6,
    circleColor: '#FF9A1A',
    circleStrokeColor: '#0F4A3C',
    circleStrokeWidth: 1.5,
  },
};
```

Draw order, bottom to top: suggestion, planned, casing, walked, markers, position marker.

**Offline tiles:** one Mapbox offline pack covering 5 km around their most common start point, zoom 12 to 16, about 15 MB, Wi-Fi only by default, refreshed every 30 days. Ambient tile cache capped at 50 MB.

### 3.6 Icons

- Lucide only (lucide-react-native). Outline, never filled.
- 24 dp default with strokeWidth 1.75 and absoluteStrokeWidth on, so the line stays 1.75 dp at every size. Why: icons sit beside text and should keep one weight.
- Sizes: 16 (with captions), 20 (with labels, chevrons), 24 (default), 28 (option cards, centre tab), 32 (empty states).
- Colours: Forest on light surfaces, Sand on Forest, Sage when inactive, Stone for meta, Ink on Papaya. Papaya only for the streak Sunrise. Success and Error only in safety tags and alerts.
- No emoji anywhere, including the streak. No Font Awesome, no Material icons, no mixed sets. The only custom drawing is the path mark. Partner marks (Google, Apple, Spotify, Apple Music) follow their owners' rules and are not icons.
- Every icon-only button has an accessibility label.

| Concept | Lucide icon |
|---|---|
| Tabs | house, compass, footprints (Walk), route (Journey), circle-user |
| Start Walk, First Walk | footprints |
| Pause, Resume | pause, play |
| Minimise, Back, More | chevron-down, chevron-left, ellipsis-vertical |
| Voice | volume-2 |
| Walk Safe, safety Good | shield-check |
| Safety Fair, Take Care | shield, shield-alert |
| Hydration | droplet |
| Music, next track | music, skip-forward |
| Recentre | locate-fixed |
| Streak | sunrise |
| Early Bird, Walk [City] | bird, map-pinned |
| Locked keepsake | lock |
| Heat | thermometer |
| Offline, backup | cloud-off, cloud-upload |
| Location, no location | map-pin, map-pin-off |
| Search, save, rename | search, bookmark, pencil |
| Error, selected | circle-alert, check |
| Tip categories | chart-pie, utensils, cup-soda, arrow-left-right, repeat |
| Highlights | map (new streets), gauge (fastest km), landmark |
| Profile rows | target, shield-check, link, bell, eye-off, settings |
| Share, download | share-2, download |
| Battery guide | battery-full |

### 3.7 Motion

**Tokens:** fast 200 ms, base 250 ms, slow 300 ms. Standard easing cubic-bezier(0.2, 0, 0, 1) for entering and moving; exit easing cubic-bezier(0.3, 0, 1, 1). All animation runs on the UI thread with Reanimated. No Lottie, no JS-driven animation.

**Standard transitions** (platform conventions, not custom animation): native stack push and pop with each platform's back gesture; sheets slide in 250 ms; overlays and dialogs fade in 200 ms; switches slide in 200 ms. Why native stack: back gestures depend on the platform's own transition.

**Custom animations, these three only**
1. **Start Walk.** On tap: light haptic, tracking starts. The button's shape grows to fill the screen over 300 ms (standard easing, radius 16 to 0), shifting from Papaya to Sand over the last 150 ms. Walk content fades in over 200 ms starting at 150 ms. The map fades in over 250 ms once it has mounted, no earlier than 300 ms. The timer counts from the tap, so the animation costs no seconds.
2. **Journey Complete.** 0 ms: screen fades in (200 ms). 200 ms: the route draws from start to end (1,200 ms, strokeDashoffset, standard easing). 1,400 ms: distance, steps, time and kcal count up together (800 ms, ease-out; distance in 0.1 km steps, steps in whole numbers, all tabular so nothing jitters). 2,200 ms: the dynamic line fades in (200 ms). 2,400 ms: keepsake reveal, if any. Tapping anywhere jumps to the end. The route draw and count-up run longer than the 200 to 300 ms transition range on purpose; they are a sequence, not a transition.
3. **Keepsake reveal.** The badge fades from 0 to 1 and scales from 0.94 to 1.0 over 300 ms, with a success haptic. Then its title and milestone fade in over 200 ms. No shine, glow, spin or confetti.

**Reduce Motion** (useReducedMotion): Start Walk becomes a 150 ms cross-fade. The route appears complete. Numbers appear at their final values. The keepsake fades in over 150 ms. Sheets and overlays fade instead of sliding. Map camera moves jump instead of flying.

**Never:** springs with overshoot, bounce, confetti, looping or pulsing (the position marker included), parallax, shimmer, animated footprints, count-ups anywhere except Journey Complete.

### 3.8 Patterns

**Rules**
- Original SVG tiles drawn on a 4 dp grid. Flat fills and strokes only: no gradients, no opacity ramps.
- Colours from Forest, Papaya, Sand, Sage and Indigo; three at most in one use; Papaya under 15% of a tile's area. Never Indigo and Sand on their own, which is the traditional Adire colourway; a third brand colour is always present.
- Pattern-to-ground contrast stays between 1.5:1 and 3:1 so it reads as texture, not image. Tested values: Sage at 35% on Forest; Forest at 25% on Sand; Sand at 25% on Indigo.
- Allowed on: Splash, onboarding backgrounds (including the Sign In header), empty states (except on Home and Explore; Profile's cover before a photo is added counts), Journey Complete, keepsakes, share images and certificates.
- Never on Home, Walk or Explore. Never behind text, numbers, charts, maps or buttons. Keep 24 dp clear of any text.
- Use as bands or panels along an edge, never more than 30% of a screen, one pattern per screen. Never rotated, rescaled per instance, or animated.
- Drawn fresh from the techniques (starch-resist lines, tied circles, stencilled checks, bold Ankara repeats), not traced from named Adire designs such as Olokun or Ibadadun, and not taken from any existing Ankara print.
- Before launch, an Adire maker from Abeokuta and a Nigerian textile designer review the set, and are paid and credited in About.

**The set**

| Pattern | File | Tile | Construction | Colourways | Used on |
|---|---|---|---|---|---|
| Ọ̀nà (road) | pattern-ona.svg | 48 × 48 dp | Diagonal lines of 4 dp dots, 8 dp apart, with every third dot replaced by a 12 × 4 dp dash, like a footpath traced across open ground. Rows offset by half a tile. From starch-resist dotted lines. | Sage 35% on Forest; Forest 25% on Sand | Splash, Welcome, Walk Safe empty state |
| Odò (river) | pattern-odo.svg | 64 × 32 dp | Three parallel waves, 2.5 dp stroke, 32 dp wavelength, 6 dp amplitude; each row shifted half a wavelength. From resist-drawn wave lines. | Sage on Sand; Sand 25% on Indigo with a Sage wave | Onboarding top bands, distance keepsakes |
| Oòrùn (sun) | pattern-oorun.svg | 56 × 56 dp (28 dp cells) | A two-cell check: three concentric rings (radii 10, 6.5 and 3 dp, 2 dp stroke) alternating with a 16 dp square that has an 8 dp square knocked out. From tied circles and stencilled checks. | Forest and Papaya on Sand; Sand 25% on Indigo for keepsakes (Papaya squares were too loud on Indigo; the keyline carries Papaya) | Journey Complete band, journey share images, special keepsakes |
| Ilé (home) | pattern-ile.svg | 72 × 72 dp | Nested arches at Ankara scale: a 64 dp arch with two more inset 8 dp each, alternately filled and outlined. Every other row is flipped, so arches meet as doorways and domes. | Forest, Sage and Sand | Empty states (Journey, Saved tips), certificate corners |
| Aṣọ (cloth) | pattern-aso.svg | 32 × 32 dp | A woven check: two 8 dp bands each way with 4 dp gaps, passing over and under; the under segments are the lighter colour so the weave reads. | Indigo, Sand and Sage | Streak keepsakes, certificate border |

Files use ASCII names; display names keep their tone marks.

### 3.9 Keepsake badges

**Earning rules:** distance keepsakes count lifetime totals. Streak keepsakes use the 1 km streak day (2.15). Early Bird: a walk of at least 1 km started before 7:00 am. Walk [City]: 50 km walked inside the city boundary, one per city.

| Keepsake | Shape | Emblem | Pattern | Earned when |
|---|---|---|---|---|
| First Walk | Arched plaque | footprints | Odò | First saved walk |
| First 5 km | Arched plaque | "5 km" | Odò | 5 km in total |
| First 10 km | Arched plaque | "10 km" | Odò | 10 km in total |
| First 50 km | Arched plaque | "50 km" | Odò | 50 km in total |
| First 100 km | Arched plaque | "100 km" | Odò | 100 km in total |
| 7-Day Streak | Woven tag | "7 days" | Aṣọ | 7 streak days in a row |
| 30-Day Streak | Woven tag | "30 days" | Aṣọ | 30 streak days in a row |
| Early Bird | Rounded plaque | bird | Oòrùn | 1 km walk started before 7:00 am |
| Walk Lagos | Rounded plaque | map-pinned | Oòrùn | 50 km inside the city |

**Shapes** (master 96 × 120 dp, scaled proportionally)
- Arched plaque: a full semicircular top (radius half the width), straight sides, 12 dp bottom corners.
- Woven tag: top corners cut at 45° by 16 dp, a 10 dp hole centred 14 dp from the top, 8 dp bottom corners.
- Rounded plaque: 28 dp corners all round.

**Sizes:** shelf 96 × 120 dp; Journey Complete card 120 × 150 dp; Keepsake sheet 200 × 250 dp; share image 540 × 675 px; certificate 180 × 225 pt.

**Earned layout**
- Indigo ground.
- Pattern fills the top 55% of the shape, clipped to it.
- Emblem: a Sand disc (half the badge width) centred on the line where the pattern meets plain Indigo. Inside, an Indigo numeral in Manrope ExtraBold with its unit in Plus Jakarta Sans Bold below, or a Lucide icon in Indigo at a quarter of the badge width.
- Keyline: a 1.5 dp Papaya line 5 dp inside the edge, following the shape.
- At 200 dp wide and up, the title (Manrope Bold) and date (Plus Jakarta Sans Medium) sit in Sand in the lower plain area. At shelf size, text goes under the badge in Caption, two lines at most. Why: text inside a 96 dp badge is too small to read.

**Locked layout:** no fill, no pattern, no keyline. A 1.5 dp Sage outline of the shape, a 20 dp Lock in Sage where the emblem sits, the title below in Caption Stone. Accessibility label, for example: "First 50 km, locked. Walk 50 km in total to earn it. 32.4 km so far."

**Share image:** 1080 × 1350 px PNG under 300 KB, made on the phone. Sand background. The keepsake's pattern as a 96 px band at the top. Badge at 540 × 675 px, centred, its top 200 px from the top. Title in Manrope ExtraBold 64 px Ink; milestone in Plus Jakarta Sans SemiBold 36 px Stone; date in Plus Jakarta Sans Medium 32 px Stone. Wordmark 40 px Forest and tagline 28 px Stone, 80 px from the bottom. Their name appears only if they switch on Add My Name in the share sheet. Why 4:5: it fits WhatsApp chats and the Instagram feed, and sits whole on a Status without cropping.

**Certificate:** A4 portrait PDF (595 × 842 pt), vector, under 200 KB, made on the phone with expo-print from an HTML template with inline SVG, so it works offline. Sand page. Aṣọ border 16 pt wide, inset 24 pt. Wordmark 24 pt Forest at the top centre. "This keepsake is awarded to" in Plus Jakarta Sans 12 pt Stone. Name in Manrope ExtraBold 36 pt Ink. Badge at 180 × 225 pt. Title in Manrope Bold 24 pt. Milestone in Plus Jakarta Sans 14 pt Stone. "Earned on 12 Oct 2026" in 12 pt. A line with city and total ("Walking in Lagos since Oct 2026 · 312.6 km so far"). Footer "Irin Ajo · Every Step, a Journey." in 10 pt. Android saves to Downloads through MediaStore; iOS opens the share sheet with Save to Files.

### 3.10 Assets and performance

- SVG for icons, patterns, the path mark and the battery-guide illustrations, rendered with react-native-svg. Patterns fill one Rect through an SVG Pattern element, so a band costs one draw.
- App icon: the Ọ̀nà footpath mark in Sand and Papaya on Forest, no text. Ìrìn is the steps and àjò the line from start to arrival. Files in assets/, all rendered from assets/brand/app-icon.svg: icon.png (1024, iOS and default); android-icon-foreground.png, -background.png and -monochrome.png (1024, adaptive icon with the mark inside the 66 dp safe circle; the monochrome layer drives Android 13 themed icons); splash-icon.png (384, the mark alone); notification-icon.png (96, white silhouette, also used by the walk notification); favicon.png (48); brand/play-store-icon.png (512, for the Play Console listing).
- Rasters are limited to the app icon and store screenshots. Any future raster ships as WebP at 1x, 2x and 3x, under 40 KB at 3x. Profile photos are resized on the phone to 216 px square, WebP at 80%.
- Budgets on a 2 GB Android phone: cold start to Home under 2.5 s (Hermes, inline requires); Home scrolls at 60 fps; Walk updates its numbers once a second, batched; app download under 25 MB including fonts and both English voice packs; data per walk under 50 KB, map tiles aside.
- Long lists use FlashList. Maps mount lazily after first paint. No autoplay video anywhere.

## 4. NativeWind theme

The same file ships alongside this spec as `tailwind.config.js`.

```js
/** @type {import('tailwindcss').Config} */
// Irin Ajo theme for NativeWind v4.
// Colours replace Tailwind's palette instead of extending it, so no off-palette greys creep in.
// Sizes are in px, which NativeWind reads as dp, so its 14 px rem default never applies.
// Font family names must match the PostScript names of the TTFs embedded with expo-font.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      forest: '#0F4A3C',
      papaya: '#FF9A1A',
      sunflower: '#FFC83D',
      sand: {
        DEFAULT: '#F8F3EB',
        deep: '#EEE5D6',
      },
      white: '#FFFFFF',
      ink: '#17201D',
      stone: '#5B6B63',
      sage: '#A8B8A5',
      indigo: '#2B3A67',
      error: '#C94C4C',
      success: '#2E7D5B',
    },
    fontFamily: {
      'manrope-bold': ['Manrope-Bold'],
      'manrope-extrabold': ['Manrope-ExtraBold'],
      jakarta: ['PlusJakartaSans-Regular'],
      'jakarta-medium': ['PlusJakartaSans-Medium'],
      'jakarta-semibold': ['PlusJakartaSans-SemiBold'],
      'jakarta-bold': ['PlusJakartaSans-Bold'],
    },
    fontSize: {
      display: ['64px', { lineHeight: '68px', letterSpacing: '-1.3px' }],
      hero: ['44px', { lineHeight: '50px', letterSpacing: '-0.9px' }],
      metric: ['40px', { lineHeight: '46px', letterSpacing: '-0.8px' }],
      title: ['30px', { lineHeight: '36px', letterSpacing: '-0.3px' }],
      stat: ['24px', { lineHeight: '30px', letterSpacing: '-0.2px' }],
      section: ['18px', { lineHeight: '24px' }],
      body: ['16px', { lineHeight: '24px' }],
      button: ['16px', { lineHeight: '20px' }],
      label: ['14px', { lineHeight: '20px' }],
      caption: ['12px', { lineHeight: '16px' }],
      status: ['12px', { lineHeight: '16px', letterSpacing: '1.2px' }],
    },
    spacing: {
      0: '0px',
      px: '1px',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      10: '40px',
      12: '48px',
      13: '52px',
      14: '56px',
      16: '64px',
      18: '72px',
      20: '80px',
      24: '96px',
      30: '120px',
      50: '200px',
    },
    borderRadius: {
      none: '0px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '28px',
      full: '9999px',
    },
    borderWidth: {
      DEFAULT: '1px',
      0: '0px',
      1.5: '1.5px',
      2: '2px',
    },
    extend: {
      height: {
        input: '54px',
        button: '54px',
        control: '64px',
        tab: '64px',
        chip: '40px',
      },
      minHeight: {
        target: '48px',
        row: '56px',
      },
      minWidth: {
        target: '48px',
      },
    },
  },
  plugins: [],
};
```

**Fonts.** Embed the six TTFs with the expo-font config plugin so they're available at first frame.

```json
{
  "expo": {
    "plugins": [
      ["expo-font", {
        "fonts": [
          "./assets/fonts/Manrope-Bold.ttf",
          "./assets/fonts/Manrope-ExtraBold.ttf",
          "./assets/fonts/PlusJakartaSans-Regular.ttf",
          "./assets/fonts/PlusJakartaSans-Medium.ttf",
          "./assets/fonts/PlusJakartaSans-SemiBold.ttf",
          "./assets/fonts/PlusJakartaSans-Bold.ttf"
        ]
      }]
    ]
  }
}
```

**Type variants.** Tailwind can't bind a font family to a size, so every text style goes through one map. Use it through a single `Text` component; never set font classes by hand on screens.

```ts
export const type = {
  display: 'font-manrope-extrabold text-display text-ink tabular-nums',
  hero: 'font-manrope-bold text-hero text-ink tabular-nums',
  metric: 'font-manrope-extrabold text-metric text-ink tabular-nums',
  title: 'font-manrope-bold text-title text-ink',
  stat: 'font-manrope-bold text-stat text-ink tabular-nums',
  section: 'font-manrope-bold text-section text-ink',
  body: 'font-jakarta text-body text-ink',
  button: 'font-jakarta-semibold text-button',
  label: 'font-jakarta-semibold text-label text-ink',
  caption: 'font-jakarta-medium text-caption text-stone',
  status: 'font-jakarta-bold text-status uppercase text-forest',
} as const;

export const maxScale = {
  display: 1.15, hero: 1.15, metric: 1.15, stat: 1.15,
  title: 1.3, section: 1.3,
  body: 1.5, button: 1.5, label: 1.5, caption: 1.5, status: 1.3,
} as const;
```

If your NativeWind version doesn't map `tabular-nums`, pass `style={{ fontVariant: ['tabular-nums'] }}` in the same `Text` component.

**Usage examples**

```tsx
<Pressable className="h-control rounded-lg bg-papaya flex-row items-center justify-center">
  <Footprints size={24} strokeWidth={1.75} absoluteStrokeWidth color="#17201D" />
  <Text className={`${type.button} text-ink ml-2`}>Start Walk</Text>
</Pressable>

<View className="bg-white rounded-xl p-5">
  <Text className={type.section}>Today's journey</Text>
</View>

<Pressable className="h-button rounded-lg border-1.5 border-forest bg-white items-center justify-center active:bg-forest/[0.08]">
  <Text className={`${type.button} text-forest`}>Share Journey</Text>
</Pressable>
```

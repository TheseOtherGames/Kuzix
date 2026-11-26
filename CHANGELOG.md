# Changelog

## 0.7.6 - 2026-11-26
- [fix] Admin tables no longer scroll sideways
- [style] Same action buttons in every admin table

## 0.7.5 - 2026-11-26
- [feat] Roles: badges with custom limits, given by admins
- [feat] Role badge on public profiles and library cards
- [feat] Roles can open chosen admin panel sections

## 0.7.4 - 2026-11-26
- [fix] Popups no longer scroll sideways
- [style] Redesigned quiz preview with colourful question cards

## 0.7.3 - 2026-11-26
- [feat] Add button explains itself in a tooltip
- [fix] A library quiz can only be added to your quizzes once
- [style] Tooltips stay readable on disabled buttons

## 0.7.2 - 2026-11-26
- [feat] Public creator cards with stats, search and sort
- [feat] Library authors link to their creator card
- [feat] First publish warns that your creator card goes public
- [feat] Back button on creator cards
- [style] Clearer author button with tooltip on library cards
- [style] Creator card quizzes no longer repeat the author

## 0.7.1 - 2026-11-26
- [feat] Waiting room shows seats left and game settings
- [feat] Library cards count how many times a quiz was added
- [style] Redesigned host waiting room with join steps
- [style] New waiting room screenshot on the home page

## 0.7.0 - 2026-11-24
- [feat] Optional email confirmation for password sign-ups
- [feat] Games are capped at 30 players on the free plan
- [fix] Missing French translations for game join errors
- [fix] Deleted quizzes no longer count toward the quiz limit
- [fix] Background glows no longer blow up on phones
- [security] Stronger password rules on sign-up
- [security] Usernames need at least 3 characters
- [security] Google/GitHub login secures accounts registered with that email
- [security] Game codes can no longer be guessed in bulk
- [security] One player per connection when joining a game
- [security] Login links from someone else are refused
- [style] New "check your inbox" screen after sign-up
- [style] Confirmation email in Kuzix colours

## 0.6.4 - 2026-11-24
- [feat] Language button in the desktop header

## 0.6.3 - 2026-11-22
- [feat] New home page: screenshots, how it works, features, plans, FAQ
- [feat] Click a home page screenshot to see it full size
- [feat] Upcoming paid plans teased on the pricing section
- [feat] Home page sections can be linked directly
- [feat] Terms and legal pages listed for search engines
- [feat] Main pages described for Google sitelinks
- [fix] Server no longer crashes on a fresh database
- [style] Section dividers on the home page

## 0.6.2 - 2026-11-21
- [feat] QR code to join the game in the host lobby
- [feat] Quiz codes now use only numbers
- [fix] Mobile header no longer overflows with the admin tab

## 0.6.1 - 2026-11-17
- [feat] New avatars: wolf, sushi, bat, turtle, eagle, crow, phoenix, seal, clownfish, seahorse, starfish, French tacos, pineapple, noodles, kebab, pea pod, oak tree and armadillo
- [feat] New Plants avatar category with cactus and 10 new plants
- [feat] 45 new hats, face accessories and items
- [style] Avatar picker sorted into sections (one character family at a time, hats, face accessories and items too) with shorter, catchier family names
- [style] Redrawn octopus avatar

## 0.6.0 - 2026-11-15
- [feat] Public quiz library: browse, preview and copy quizzes shared by the community
- [feat] Publish your quizzes to the library, with a confirmation to publish or unpublish
- [feat] Copies show when they are out of date: see what the new version contains, then get the update
- [feat] Report a library quiz to the moderators; your report stays visible until it is reviewed
- [feat] Admin Reports section: review, dismiss, warn or ban reported quizzes
- [feat] Admins can warn or ban a quiz, with the history kept on the owner's account
- [feat] Admins can preview any quiz by clicking its title
- [feat] Data export includes the reports you sent
- [style] Colourful library cards with shape stickers and the author's avatar and name tag
- [refactor] Quizzes are referenced by a short random id

## 0.5.2 - 2026-11-14
- [feat] Download all your data from profile settings
- [feat] Legal notice explains how to download or delete your data

## 0.5.1 - 2026-11-13
- [feat] New pages open scrolled to the top
- [feat] Delete your account from profile settings
- [feat] Terms of use and legal notice pages, linked in the footer
- [style] Footer redesigned into brand, links and settings groups
- [refactor] Front code reorganised into a clearer folder layout
- [refactor] Pages split into smaller components
- [refactor] Similar components merged into shared ones

## 0.5.0 - 2026-11-13
- [feat] Results page shows full quiz, question and player stats
- [feat] Results open on the latest session, with a session picker
- [feat] Stats export adds correct answers and average time
- [feat] Export each session's player answers as CSV
- [feat] Exports no longer show whether a player has an account
- [feat] Results stats explain themselves with info bubbles
- [feat] Brand kit page: logos, colours and style
- [style] Results page session panel and stat tiles redesigned

## 0.4.3 - 2026-11-13
- [feat] Final podium always shows all three places
- [feat] Final ranking can be shown as a full list

## 0.4.2 - 2026-11-13
- [feat] Admin overview shows 30-day activity charts
- [feat] New dog avatar
- [feat] Logging out asks for confirmation
- [style] Game code boxes show random placeholder characters
- [style] Results page back button matches the app style
- [style] Modal close button matches the app style

## 0.4.1 - 2026-11-13
- [feat] Play button explains why it is disabled
- [feat] Every button shows its name on hover
- [feat] Each profile tab has its own link
- [feat] Profile shows your email and login methods
- [feat] What's new groups changes by type, with issue links
- [style] Game code entered in six separate boxes
- [style] Modal title stays visible while scrolling
- [style] Admin name tag fits the name

## 0.4.0 - 2026-11-13
- [feat] Your chosen answer stays hidden until the reveal
- [feat] Confirmation shown once your answer is received
- [feat] Every button shows a tooltip title on hover
- [feat] Copy button on the game code
- [feat] Tooltips on navigation bar buttons
- [fix] Repeated clicks no longer resend the same request
- [fix] Unknown game codes show an error on the home page
- [fix] Quiz codes only exist while the quiz is open
- [fix] Back to the home page after logging in
- [security] Requests are rate limited to prevent spam
- [style] Game bar buttons use the navigation tooltip
- [style] Quiz card details lined up at the bottom
- [style] Admin button moved to the end of the navigation bar

## 0.3.3 - 2026-11-13
- [feat] Link previews and better search engine listing
- [style] Fullscreen windows on mobile
- [style] New logo and browser tab icon

## 0.3.2 - 2026-11-12
- [feat] Character counter on nickname fields
- [feat] What's new: a changelog window, opened from the version button in the footer
- [style] "Beta" badge on the logo

## 0.3.1 - 2026-11-12
- [feat] Admin area: users, quizzes, live games, bans and admin roles
- [feat] Quiz editor warns before leaving with unsaved changes
- [feat] Game stats can be removed
- [feat] Usage tracking
- [security] Usage limits on quizzes and games
- [style] Link icon refreshed
- [style] New default character style in game

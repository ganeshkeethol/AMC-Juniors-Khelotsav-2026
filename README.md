# AMC Juniors Khelotsav 2026 — GitHub Pages Website

A child-friendly sports event website for Ambience Courtyard.

## Event pages

Every sport card on the home page is clickable and opens `event.html?game=...` with:
- Game/Sport name
- SPOC / volunteer details
- Game rules
- Enrolled kids for that event
- Day-wise schedule for that event
- Live results link

## Live data

The site publishes event information from Google Sheets through Google Apps Script to GitHub Pages. The public Kids Enrollment registration section has been removed.

Google Sheets tabs:

### Schedule
`day | date | reporting | time | event | ageGroup | venue | status`

### Volunteers
`Name | Block | Flat No | Mobile Number | Event / Sport | SPOC For`


### Enrollments
`Child Name | Age Group | Event | Block | Flat No | Mobile Number | Enrollment Status | Event Status | Team ID | Team Name | Team Role`

### Results
`event | ageGroup | position | child | score | medal`

Keep private phone numbers, apartment numbers, medical information and other sensitive information out of the public API unless the organisers have approved its publication.

## Excel schedule option

`config.js` includes `scheduleExcelUrl` so an Excel-based schedule can be added later. For a truly live schedule, the easiest and most reliable option is to maintain the schedule in a Google Sheet and expose it through the included Apps Script API. If the organisers provide an `.xlsx` file, it can also be integrated into the site.

## GitHub Pages

Upload the contents of this folder to the repository root. Enable Settings → Pages → Deploy from a branch → `main` → `/ (root)`.


## Apps Script

1. Create the four Google Sheet tabs above.
2. Put your spreadsheet ID into `google-apps-script/Code.gs`.
3. Deploy as a Web app.
4. Set `apiUrl` in `config.js` to the deployed Web App URL.
5. Commit the changed `config.js` to GitHub.

The site refreshes live data every 30 seconds.


## Google Drive rules document management

Use Google Drive to manage official game rules without changing GitHub files. Create a Google Drive folder such as `Khelotsav Rules`, upload each sport's PDF or DOCX, and set the file's sharing/access appropriately. Copy the file link into the `RulesDocs` Google Sheet tab.

### RulesDocs sheet columns
`event | title | type | url`

Example:
`Badminton | Badminton Rules | PDF | https://drive.google.com/...`

The event page automatically filters this sheet by event name and shows an **Open** button for the published document. For best phone compatibility, publish rules as PDF. Google Docs/Word files can also be linked. Do not put private organiser files or personal information in a public link.

### Google Sheet tabs
- Schedule: `day | date | reporting | time | event | ageGroup | venue | status`
- Results: `event | ageGroup | position | child | score | medal`
- Volunteers: `Name | Block | Flat No | Mobile Number | Event / Sport | SPOC For`
- Enrollments: `Child Name | Age Group | Event | Block | Flat No | Mobile Number | Enrollment Status | Event Status | Team ID | Team Name | Team Role`
- RulesDocs: `event | title | type | url`

The website reads all five tabs through the Google Apps Script API.


### Sport-specific live results
Each event page now includes a Results & Winners section. It filters the `Results` sheet by the selected Event/Sport and displays Age Group, Position, Participant, Score/Time, and Medal.

Recommended Results sheet columns: `event | ageGroup | position | child | score | medal`


## Separate result sheet for each sport
Create one Google Sheet tab for each sport, using the exact tab names below:
- Badminton
- Box Cricket
- Basketball
- Carroms
- Chess
- Swimming
- Table Tennis
- Drawing
- Musical Chairs
- Quiz
- Slow Cycling
- Fancy Dress

Each sport result tab should use these headers:
`ageGroup | position | child | score | medal`

The Apps Script returns these as `resultsBySport`, and each event page automatically reads only its own sport's result tab. This keeps results separated and easy for organisers to manage.

## Header logos
The main header now displays both the AMC Juniors Khelotsav event logo and the Ambience Courtyard apartment logo beside the event title.


## Central References sheet
Create a `References` tab with columns:
`event | category | title | type | url | active`

Use `event` as a sport name for sport-specific links, or `All Events` for a common link. Suggested categories: Schedule, Result, Rules, Document, Other. The home page shows active reference links, and each sport page filters references for that sport.

Example:
`Badminton | Rules | Badminton Rules | PDF | https://drive.google.com/... | Yes`
`Badminton | Result | Badminton Results | Google Sheet | https://docs.google.com/... | Yes`

For the complete Google Drive/Sheets/Forms connection instructions, see `../SETUP_GUIDE.md`.


Volunteer registration is configured in `config.js` using `volunteerFormUrl` and linked from the home and event pages.

## 2025 Highlights

Open `highlights-2025.html` for a dedicated look-back page covering the 2025 sports event, including a photo carousel and the supplied participation statistics.

Add authentic 2025 event photos under `assets/2025-highlights/` when available. The current carousel uses clearly labelled placeholders rather than presenting 2026 images as 2025 memories.

## Important Notifications Carousel (Text Only)

The homepage now includes an **Important Notifications** carousel. Notification records are read from the Google Sheet configured in `config.js`:

- Spreadsheet ID: `1mc9F8cVnOTO7-4fW4CX6_I2Ido-4rKiV`
- Tab name: `Notifications`

Recommended columns:

`Title | Message | Date | Link | Image URL | Button Text | Active | Priority`

`Active` can be `Yes`/`No`. Only active rows are displayed. Lower `Priority` numbers appear first.

The page first tries the existing Apps Script endpoint using `action=notifications`. If that action is not available, it falls back to the Google Sheets Visualization endpoint, so the **Notifications** tab must be published to the web / accessible to the public website.

The carousel automatically advances every 7 seconds, has previous/next controls and dots, and adapts to mobile screens.

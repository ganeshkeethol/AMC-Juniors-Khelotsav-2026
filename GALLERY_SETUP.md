AMC JUNIORS KHELOTSAV 2026 — HOMEPAGE INFORMATION BANNERS SETUP

WHAT CHANGED
- Removed the homepage “GET READY” / coming-soon video section.
- Added a responsive information-banner carousel with previous/next arrows, dots, optional captions, and automatic slide rotation. It is intended for event schedules, important announcements, guidelines, sponsor banners, and any other useful information supplied as an image—not just event photos.
- The carousel reads its content from the existing Google Apps Script API, so organisers can change images without editing the website files.

SET UP THE IMAGE LIST (ONE TIME)
1. Open the Google spreadsheet used by the homepage high-level schedule:
   https://docs.google.com/spreadsheets/d/1lgxqiyJtbYeVRdVcSxIXkRcR5Sk7ng4aw2RpR95AYKM/edit
2. Add a new sheet/tab named exactly: Gallery
3. Put these column headings in row 1 (spelling matters):
   Image URL | Caption | Active | Display Order
4. Add one image per row. Example:
   https://example.com/event-schedule.jpg | Event Schedule — Day 1 | Yes | 1
   https://example.com/important-update.jpg | Important Update | Yes | 2
   https://example.com/guidelines-banner.jpg | Event Guidelines | No | 3
5. Use a publicly accessible direct image URL (https://...). For Google Drive, make sure the image is publicly viewable and use a direct image-serving URL; a normal private Drive link will not display.
6. Set Active to Yes to show an image, or No to hide it. Display Order controls the carousel order. Caption is optional.
7. Save the spreadsheet. No website code change is needed for future image/caption/order updates.

ONE-TIME API DEPLOYMENT
The website calls the existing Apps Script endpoint with ?action=gallery. To enable this endpoint:
1. Open the Apps Script project associated with the API URL in config.js.
2. Replace/update its Code.gs with the updated Code.gs included in this package (or add the gallery action and getGallery_ function from it).
3. Deploy > Manage deployments > Edit the existing web app deployment, select a new version, and Deploy. Keep the same deployment URL and access settings as the existing public website API.
4. Wait briefly, then open the website and refresh. If the API was not redeployed, the gallery will show its empty-state message.

IMAGE RECOMMENDATIONS
- Use clear landscape banners; 1600 × 900 or larger is recommended. Tall or wide banner images can also be used.
- Use direct HTTPS image URLs that anyone can access without signing in.
- The carousel uses contain-fit so the full banner, including schedule text and important details, stays visible instead of being cropped. For best readability, use high-resolution images with text large enough to read on mobile.

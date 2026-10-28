/*******************************************************
 * AMC JUNIORS KHELOTSAV 2026 - GOOGLE APPS SCRIPT API
 * Supports multiple volunteers per sport.
 *******************************************************/

const REFERENCES_SHEET_ID = "1bQjGKySBioV1lrgqcoyGy8Ju1hBnPHadfpn1FIis1ck";
const VOLUNTEERS_SHEET_ID = "1nIzZkI3JAKXm2DPYf1OegRqz5R5LkaKAJTcRKr7eVXA";
const ENROLLMENTS_SHEET_ID = "1jNGv0dkXPlYtscD2c9JY0QUbYf2iKDJxDUfMrkPsuIs";

// Create a separate Google Sheet for the homepage high-level schedule and paste its Spreadsheet ID here.
const HIGH_LEVEL_SCHEDULE_SHEET_ID = "1lgxqiyJtbYeVRdVcSxIXkRcR5Sk7ng4aw2RpR95AYKM";
const HIGH_LEVEL_SCHEDULE_TAB = "Schedule";
const NOTIFICATIONS_TAB = "Notifications";
const QA_TAB = "Q&A";
const RULES_TAB = "Rules";

// Create a separate Google Sheet for the public site visitor counter.
const VISITOR_STATS_SHEET_ID = "1S0atryLkUYAQFYihyDqu8zi024dcgsV5Tzcs4g3gDoc";
const VISITOR_STATS_TAB = "Visitor Stats";
const VISITOR_HEADER_ROW = 4;
const VISITOR_DATA_START_ROW = 5;

// Separate Google Sheet for public Sponsors & Event Partners page.
const EVENT_PARTNERS_SHEET_ID = "1D-NhId9r6pNk1bjf67w3uWHH583Ejus8sF-WPHg_NmQ";
const EVENT_PARTNERS_TAB = "Partners";

const REFERENCES_TAB = "References";
const VOLUNTEERS_TAB = "Volunteers";
const ENROLLMENTS_TAB = "Enrollments";

const PUBLIC_FIELDS = [
  "Child Name","Age Group","Event","Block","Flat Number",
  "Mobile Number","Enrollment Status","Event Status",
  "Team ID","Team Name","Team Role"
];

function doGet(e) {
  try {
    e = e || {parameter:{}};
    const action = String(e.parameter.action || "references").trim();

    if (action === "references") {
      return jsonOutput({success:true, references:getReferences_()});
    }

    if (action === "volunteers") {
      return jsonOutput({success:true, volunteers:getVolunteers_()});
    }

    if (action === "enrollments") {
      return jsonOutput({success:true, enrollments:getEnrollments_()});
    }

    if (action === "sportVolunteers") {
      const sport = String(e.parameter.sport || e.parameter.event || "").trim();
      return jsonOutput({success:true, sport:sport, volunteers:getVolunteersForSport_(sport)});
    }

    if (action === "highLevelSchedule") {
      return jsonOutput({success:true, schedule:getHighLevelSchedule_()});
    }

    if (action === "notifications") {
      return jsonOutput({success:true, notifications:getNotifications_()});
    }

    if (action === "gallery") {
      return jsonOutput({success:true, gallery:getGallery_()});
    }

    if (action === "qna" || action === "qa") {
      return jsonOutput({success:true, questions:getQandA_()});
    }

    if (action === "rules") {
      return jsonOutput({success:true, rules:getRules_()});
    }

    if (action === "partners" || action === "eventPartners") {
      return jsonOutput({success:true, partners:getEventPartners_()});
    }

    if (action === "visit") {
      const increment = String(e.parameter.increment || "1").trim() !== "0";
      return jsonOutput({success:true, totalVisits:recordVisitorVisit_(increment), counted:increment});
    }

    if (action === "sport") {
      const sport = String(e.parameter.sport || e.parameter.event || "").trim();
      return jsonOutput({success:true, sport:sport, data:getSportData_(sport)});
    }

    /* Homepage endpoint: return all live data in the shape app.js expects. */
    if (action === "all") {
      const references = getReferences_();
      const volunteers = getVolunteers_();
      const enrollments = getEnrollments_();
      const schedulesBySport = {};
      const resultsBySport = {};
      const sportInfoBySport = {};

      references.forEach(function(ref) {
        if (!ref.sport || !ref.spreadsheetId) return;
        const data = getSportData_(ref.sport);
        schedulesBySport[ref.sport] = data.schedule || [];
        resultsBySport[ref.sport] = (data.results || []).map(function(row) {
          const copy = {};
          Object.keys(row).forEach(function(k){ copy[k] = row[k]; });
          if (!copy.Event) copy.Event = ref.sport;
          return copy;
        });
        sportInfoBySport[ref.sport] = data.sportInfo || [];
      });

      return jsonOutput({
        success:true,
        references:references,
        volunteers:volunteers,
        enrollments:enrollments,
        schedulesBySport:schedulesBySport,
        resultsBySport:resultsBySport,
        sportInfoBySport:sportInfoBySport,
        notifications:getNotifications_()
      });
    }

    return jsonOutput({success:false,error:"Unknown action: " + action});
  } catch (error) {
    return jsonOutput({success:false,error:String(error.message || error)});
  }
}



function getVisitorStatsSheet_() {
  if (!VISITOR_STATS_SHEET_ID || VISITOR_STATS_SHEET_ID.indexOf("PASTE_") === 0) return null;
  try {
    const ss = SpreadsheetApp.openById(VISITOR_STATS_SHEET_ID);
    return ss.getSheetByName(VISITOR_STATS_TAB) || ss.getSheets()[0] || null;
  } catch (error) {
    return null;
  }
}

function recordVisitorVisit_(increment) {
  const sheet = getVisitorStatsSheet_();
  if (!sheet) return 0;

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    // Ensure the template headers exist even when a fresh Google Sheet is used.
    sheet.getRange(VISITOR_HEADER_ROW, 1, 1, 2).setValues([["Date", "Visits"]]);

    const lastRow = Math.max(sheet.getLastRow(), VISITOR_DATA_START_ROW - 1);
    let rows = [];
    if (lastRow >= VISITOR_DATA_START_ROW) {
      rows = sheet.getRange(VISITOR_DATA_START_ROW, 1, lastRow - VISITOR_DATA_START_ROW + 1, 2).getValues();
    }

    const today = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
    let foundRow = -1;
    let total = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowDate = rows[i][0] instanceof Date
        ? Utilities.formatDate(rows[i][0], "Asia/Kolkata", "yyyy-MM-dd")
        : String(rows[i][0] || "").trim();
      const count = Number(rows[i][1]) || 0;
      total += count;
      if (rowDate === today) foundRow = VISITOR_DATA_START_ROW + i;
    }

    if (increment) {
      if (foundRow === -1) {
        sheet.getRange(Math.max(sheet.getLastRow() + 1, VISITOR_DATA_START_ROW), 1, 1, 2).setValues([[today, 1]]);
        total += 1;
      } else {
        const cell = sheet.getRange(foundRow, 2);
        const newCount = (Number(cell.getValue()) || 0) + 1;
        cell.setValue(newCount);
        total += 1;
      }
    }

    // Keep the template's Total Visits cell current for organiser visibility.
    sheet.getRange(2, 1, 1, 2).setValues([["Total Visits", total]]);
    return total;
  } finally {
    lock.releaseLock();
  }
}


function getEventPartners_() {
  if (!EVENT_PARTNERS_SHEET_ID || EVENT_PARTNERS_SHEET_ID.indexOf("PASTE_") === 0) {
    return {residents:[], businesses:[]};
  }
  try {
    const ss = SpreadsheetApp.openById(EVENT_PARTNERS_SHEET_ID);
    const sheet = ss.getSheetByName(EVENT_PARTNERS_TAB) || ss.getSheets()[0];
    if (!sheet) return {residents:[], businesses:[]};
    const rows = sheetToObjects_(sheet).map(function(r, idx){
      const type = String(r.Type || r.type || "").trim();
      const name = String(r["Name / Business"] || r.Name || r["Business / Service Name"] || r["Business Name"] || "").trim();
      const active = String(r.Active || r.active || r.Show || r["Show on Website"] || "Yes").trim();
      return {
        type:type,
        name:name,
        contributionType:String(r["Contribution Type"] || r["Contribution"] || "").trim(),
        amount:String(r.Amount || r.amount || "").trim(),
        event:String(r["Event / Sport"] || r.Event || r.Sport || "").trim(),
        itemService:String(r["Item / Service Sponsored"] || r["Item / Service"] || r.Item || r.Service || "").trim(),
        displayOrder:Number(r["Display Order"] || r.Order || idx + 1) || (idx + 1),
        active:active
      };
    }).filter(function(x){
      return x.name !== "" && /^(yes|true|1)$/i.test(x.active);
    }).sort(function(a,b){ return a.displayOrder - b.displayOrder; });

    const residents = rows.filter(function(x){ return normalizePartnerType_(x.type) === "resident"; });
    const businesses = rows.filter(function(x){ return normalizePartnerType_(x.type) === "business"; });
    return {residents:residents, businesses:businesses};
  } catch (error) {
    return {residents:[], businesses:[], error:String(error.message || error)};
  }
}

function normalizePartnerType_(value) {
  const t = String(value || "").trim().toLowerCase();
  if (t.indexOf("resident") !== -1) return "resident";
  if (t.indexOf("business") !== -1 || t.indexOf("service") !== -1 || t.indexOf("sponsor") !== -1) return "business";
  return "other";
}

function getHighLevelSchedule_() {
  if (!HIGH_LEVEL_SCHEDULE_SHEET_ID || HIGH_LEVEL_SCHEDULE_SHEET_ID.indexOf("PASTE_") === 0) return [];
  try {
    const ss = SpreadsheetApp.openById(HIGH_LEVEL_SCHEDULE_SHEET_ID);
    const sheet = ss.getSheetByName(HIGH_LEVEL_SCHEDULE_TAB) || ss.getSheets()[0];
    return sheet ? sheetToObjects_(sheet) : [];
  } catch (error) {
    return [];
  }
}

/** Public homepage image carousel. Manage images in the Gallery tab of the high-level schedule spreadsheet. */
function getGallery_() {
  if (!HIGH_LEVEL_SCHEDULE_SHEET_ID || HIGH_LEVEL_SCHEDULE_SHEET_ID.indexOf("PASTE_") === 0) return [];
  try {
    const ss = SpreadsheetApp.openById(HIGH_LEVEL_SCHEDULE_SHEET_ID);
    const sheet = ss.getSheetByName("Gallery");
    if (!sheet) return [];
    return sheetToObjects_(sheet).map(function(r, idx) {
      const imageUrl = String(r["Image URL"] || r.ImageURL || r.URL || r.Image || "").trim();
      const active = String(r.Active || r.Publish || r.Status || "yes").trim();
      const caption = String(r.Caption || r.Title || r.Description || "").trim();
      const order = Number(r["Display Order"] || r.Order || idx + 1) || idx + 1;
      return {imageUrl:imageUrl, caption:caption, active:active, order:order};
    }).filter(function(item) {
      return item.imageUrl && /^(yes|true|1|active|published|show)$/i.test(item.active);
    }).sort(function(a,b) { return a.order - b.order; });
  } catch (err) {
    return [];
  }
}

function getNotifications_() {
  if (!HIGH_LEVEL_SCHEDULE_SHEET_ID || HIGH_LEVEL_SCHEDULE_SHEET_ID.indexOf("PASTE_") === 0) return [];

  try {
    const ss = SpreadsheetApp.openById(HIGH_LEVEL_SCHEDULE_SHEET_ID);
    const sheet = ss.getSheetByName(NOTIFICATIONS_TAB);
    if (!sheet) return [];

    const rows = sheetToObjects_(sheet);

    return rows.map(function(r, idx) {
      const title = String(r.Title || r.title || r["Notification Title"] || "").trim();
      const message = String(r.Message || r.message || r.Description || r.description || "").trim();
      const date = String(r.Date || r.date || "").trim();
      const link = String(r.Link || r.link || r.URL || r.Url || r.url || "").trim();
      const active = String(r.Active || r.active || r.Show || r["Show on Website"] || "Yes").trim();
      const displayOrder = Number(r["Display Order"] || r.Order || idx + 1) || (idx + 1);

      return {
        title: title,
        message: message,
        date: date,
        link: link,
        active: active,
        displayOrder: displayOrder
      };
    }).filter(function(item) {
      return item.title !== "" && /^(yes|true|1)$/i.test(item.active);
    }).sort(function(a, b) {
      return a.displayOrder - b.displayOrder;
    });
  } catch (error) {
    return [];
  }
}

function getQandA_() {
  if (!HIGH_LEVEL_SCHEDULE_SHEET_ID || HIGH_LEVEL_SCHEDULE_SHEET_ID.indexOf("PASTE_") === 0) return [];
  try {
    const ss = SpreadsheetApp.openById(HIGH_LEVEL_SCHEDULE_SHEET_ID);
    const sheet = ss.getSheetByName(QA_TAB);
    if (!sheet) return [];
    return sheetToObjects_(sheet).map(function(r, idx) {
      const question = String(r.Question || r.question || r.Q || "").trim();
      const answer = String(r.Answer || r.answer || r.A || "").trim();
      const category = String(r.Category || r.category || "General").trim() || "General";
      const active = String(r.Active || r.active || "Yes").trim();
      const displayOrder = Number(r["Display Order"] || r.Order || idx + 1) || (idx + 1);
      return {question:question, answer:answer, category:category, active:active, displayOrder:displayOrder};
    }).filter(function(item) {
      return item.question !== "" && item.answer !== "" && /^(yes|true|1)$/i.test(item.active);
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  } catch (error) {
    return [];
  }
}

function getReferences_() {
  return readAdminSheet_(REFERENCES_TAB).map(function(r){
    return {
      sport:String(r.sport || r.Sport || r.Name || r["Event / Sport"] || r["Sport / Area"] || r.Event || "").trim(),
      spreadsheetId:String(r.spreadsheetId || r["Spreadsheet ID"] || r["SpreadsheetID"] || "").trim(),
      rulesUrl:String(r.rulesUrl || r["Rules URL"] || r["Rules Link"] || "").trim(),
      active:String(r.active || r.Active || "Yes").trim()
    };
  }).filter(function(r){return r.sport !== "";});
}

function getVolunteers_() {
  return readAdminSheet_(VOLUNTEERS_TAB).map(normalizeVolunteer_).filter(function(v){return v.name !== "" || v.sport !== "";});
}

function normalizeVolunteer_(r) {
  // Read the current Volunteers sheet format as well as legacy header names.
  // Header matching is case/space tolerant so a sheet using "Contact" or
  // "Mobile Number", and "Flat Number" or "Flat No", continues to work.
  const pick = function(obj, keys){
    const normalized = {};
    Object.keys(obj || {}).forEach(function(k){
      normalized[String(k).trim().toLowerCase().replace(/\s+/g,' ')] = obj[k];
    });
    for (let i=0;i<keys.length;i++) {
      const key = String(keys[i]).trim().toLowerCase().replace(/\s+/g,' ');
      if (Object.prototype.hasOwnProperty.call(normalized,key) && String(normalized[key] ?? '').trim() !== '') return normalized[key];
    }
    return '';
  };
  return {
    name:String(pick(r,["Name","Volunteer Name","Volunteer name"]) || '').trim(),
    sport:String(pick(r,["Event / Sport","Event/Sport","Sport / Area","Sport/Area","Event","Sport"]) || '').trim(),
    block:String(pick(r,["Block"]) || '').trim(),
    flatNumber:String(pick(r,["Flat No","Flat No.","Flat Number","Flat"]) || '').trim(),
    mobileNumber:String(pick(r,["Mobile Number","Contact","Mobile","Phone Number","Contact Number","Phone"]) || '').trim(),
    spocFor:String(pick(r,["SPOC For","SPOC","Event SPOC","Event Spoc"]) || '').trim()
  };
}

function getVolunteersForSport_(sport) {
  const target = normalizeSportName_(sport);
  if (!target) return [];
  return getVolunteers_().filter(function(v){
    return volunteerAssignedToSport_(v.sport, target);
  });
}


function volunteerAssignedToSport_(sportsValue, targetNormalized) {
  const target = normalizeSportName_(targetNormalized);
  if (!target) return false;
  return String(sportsValue || "").split(/[,;\n]+/).map(function(part){
    return normalizeSportName_(part);
  }).filter(Boolean).indexOf(target) !== -1;
}

function normalizeSportName_(value) {
  var normalized = String(value || "").trim().toLowerCase().replace(/&/g,"and").replace(/\s+/g," ");
  // Treat the Enrollments sheet label "Basket Ball" and the website label
  // "Basketball" as the same event when matching registrations, volunteers,
  // and the sport reference sheet.
  if (normalized.replace(/\s+/g, "") === "basketball") return "basketball";
  return normalized;
}

function getEnrollments_() {
  return readAdminSheet_(ENROLLMENTS_TAB).map(function(r){
    const obj={};
    Object.keys(r).forEach(function(key){
      if(PUBLIC_FIELDS.indexOf(key)!==-1)obj[key]=r[key];
    });
    return obj;
  });
}

function getEnrollmentsForSport_(sport) {
  const target = normalizeSportName_(sport);
  if (!target) return [];
  return getEnrollments_().filter(function(r){
    return normalizeSportName_(r["Event"] || r.event || "") === target;
  });
}

function getSportData_(sport) {
  const references=getReferences_();
  const target=normalizeSportName_(sport);
  const ref=references.find(function(r){return normalizeSportName_(r.sport)===target;});
  const volunteers=getVolunteersForSport_(sport);
  const enrollments=getEnrollmentsForSport_(sport);
  if (!ref || !ref.spreadsheetId) return {schedule:[],results:[],sportInfo:[],teams:[],rulesUrl:ref?ref.rulesUrl:"",volunteers:volunteers,enrollments:enrollments};
  try {
    const ss=SpreadsheetApp.openById(ref.spreadsheetId);
    const scheduleSheet=ss.getSheetByName("Schedule");
    const resultsSheet=ss.getSheetByName("Results");
    const infoSheet=ss.getSheetByName("Sport Info");
    const teamsSheet=ss.getSheetByName("Teams");
    const sportInfo=infoSheet?sheetToObjects_(infoSheet):[];
    const teams=teamsSheet?sheetToObjects_(teamsSheet):[];
    return {
      schedule:scheduleSheet?sheetToObjects_(scheduleSheet):[],
      results:resultsSheet?sheetToObjects_(resultsSheet):[],
      sportInfo:sportInfo,
      teams:teams,
      teamBased:isTeamBased_(sportInfo, sport),
      rulesUrl:ref.rulesUrl || "",
      volunteers:volunteers,
      enrollments:enrollments
    };
  } catch(error) {
    return {schedule:[],results:[],sportInfo:[],teams:[],teamBased:false,rulesUrl:ref.rulesUrl||"",volunteers:volunteers,enrollments:enrollments,error:"Unable to open sport spreadsheet."};
  }
}

function isTeamBased_(sportInfo, sport) {
  // Only these events are team/group games in AMC Juniors Khelotsav 2026.
  // Fun Games (4-6) is an individual event.
  var normalizedSport = normalizeSportName_(sport);
  if (normalizedSport === "box cricket" || normalizedSport === "basketball") return true;

  for (var i=0; i<sportInfo.length; i++) {
    var row=sportInfo[i] || {};
    var field=String(row.Field || row.field || row.Name || "").trim().toLowerCase();
    var value=String(row.Value || row.value || row.Details || row.details || "").trim().toLowerCase();
    if ((field === "team based" || field === "team-based" || field === "category") &&
        (value === "yes" || value === "true" || value === "group" || value === "team" || value === "group game")) return true;
  }
  return false;
}

function readAdminSheet_(name) {
  let id = REFERENCES_SHEET_ID;
  if (name === VOLUNTEERS_TAB) id = VOLUNTEERS_SHEET_ID;
  if (name === ENROLLMENTS_TAB) id = ENROLLMENTS_SHEET_ID;

  const ss = SpreadsheetApp.openById(id);

  /*
   * References, Volunteers and Enrollments are separate
   * Google Spreadsheet FILES. The tab name is not required.
   * Use the named tab when it exists; otherwise use the
   * first tab in that spreadsheet.
   */
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    const sheets = ss.getSheets();
    sheet = sheets.length ? sheets[0] : null;
  }

  return sheet ? sheetToObjects_(sheet) : [];
}

function sheetToObjects_(sheet) {
  const values=sheet.getDataRange().getDisplayValues();
  if(!values || values.length<2)return [];
  const headers=values.shift().map(function(h){return String(h).trim();});
  return values.filter(function(row){return row.some(function(cell){return String(cell).trim()!=="";});}).map(function(row){
    const obj={};
    headers.forEach(function(header,i){obj[header]=row[i] || "";});
    return obj;
  });
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}


/** Public Rules & Regulations data from the Rules tab in the high-level schedule spreadsheet.
 * Columns: Audience, Category, Rule, Active, Display Order.
 */
function getRules_() {
  if (!HIGH_LEVEL_SCHEDULE_SHEET_ID || HIGH_LEVEL_SCHEDULE_SHEET_ID.indexOf("PASTE_") === 0) return [];
  try {
    const ss = SpreadsheetApp.openById(HIGH_LEVEL_SCHEDULE_SHEET_ID);
    const sheet = ss.getSheetByName(RULES_TAB);
    if (!sheet) return [];
    return sheetToObjects_(sheet).map(function(r, idx) {
      const audience = String(r.Audience || r.audience || "General").trim() || "General";
      const category = String(r.Category || r.category || "General").trim() || "General";
      const rule = String(r.Rule || r.rule || r.Guideline || r.Guidelines || "").trim();
      const active = String(r.Active || r.active || "Yes").trim();
      const displayOrder = Number(r["Display Order"] || r.Order || idx + 1) || (idx + 1);
      return {audience:audience, category:category, rule:rule, active:active, displayOrder:displayOrder};
    }).filter(function(item) {
      return item.rule !== "" && /^(yes|true|1)$/i.test(item.active);
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  } catch (error) {
    return [];
  }
}

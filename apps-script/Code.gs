/**
 * GetFitWithAmariah — Reviews API
 * ---------------------------------------------------------------
 * Google Apps Script Web App that turns a Google Sheet into a tiny
 * public read/write API for the site's Reviews section.
 *
 * SHEET SETUP
 * Row 1 of the target tab must have these exact headers (any order,
 * case-insensitive):
 *   ID | Name | Social | Message | Stars | Helpful | Timestamp
 *
 * DEPLOYMENT (see the chat message for the full walkthrough)
 *   Extensions > Apps Script > paste this file as Code.gs > Deploy >
 *   New deployment > type "Web app" > Execute as "Me" > Who has
 *   access "Anyone" > Deploy > copy the /exec URL into script.js's
 *   REVIEWS_API_URL.
 *
 * Remember: editing this file alone does NOT update the live /exec
 * URL. After any change here, go to Deploy > Manage deployments >
 * (pencil/edit icon) > Version: New version > Deploy.
 *
 * TRANSPORT — everything (list / add / helpful) goes through doGet
 * as plain query-string requests, with an optional ?callback=NAME
 * for JSONP (the site's frontend always sends one). This is
 * deliberate: a real browser's fetch() has to follow a cross-origin
 * redirect (script.google.com -> script.googleusercontent.com) to
 * read an Apps Script response, and that hop's CORS headers are
 * notoriously inconsistent — the classic cause of Apps Script Web
 * Apps "working sometimes, failing most of the time" from fetch().
 * A <script>-tag JSONP request sidesteps CORS entirely, which is why
 * writes happen over GET here instead of doPost. doPost is kept
 * below anyway as a plain-JSON fallback for any other client.
 * ---------------------------------------------------------------
 */

// Name of the sheet/tab holding reviews. If a tab with this exact
// name isn't found, the script falls back to the first tab in the
// spreadsheet — so this only needs updating if you use both a
// differently-named tab AND have more than one tab.
var SHEET_NAME = "Reviews";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function headerIndex_(headers) {
  var map = {};
  headers.forEach(function (h, i) { map[String(h).trim().toLowerCase()] = i; });
  return {
    id: map["id"],
    name: map["name"],
    social: map["social"],
    message: map["message"],
    stars: map["stars"],
    helpful: map["helpful"],
    timestamp: map["timestamp"]
  };
}

/**
 * GET — handles every action: ?action=list | add | helpful
 * Add a &callback=NAME param for a JSONP response; otherwise plain JSON.
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || "list";
  var result;

  if (action === "list") {
    result = listReviews_();
  } else if (action === "add") {
    result = addReview_(params);
  } else if (action === "helpful") {
    result = markHelpful_(params.id);
  } else {
    result = { success: false, error: "Unknown action: " + action };
  }

  return respond_(result, params.callback);
}

/**
 * POST fallback — plain JSON body, same actions as doGet:
 *   { "action": "add", "name": "...", "social": "...", "message": "...", "stars": 5, "date": "ISO string" }
 *   { "action": "helpful", "id": "..." }
 * Not used by the site's own frontend (which uses JSONP via doGet for
 * CORS reliability), but kept available for any other client.
 */
function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return respond_({ success: false, error: "Missing request body." });
  }

  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return respond_({ success: false, error: "Malformed request body." });
  }

  var action = body.action || "add";
  var result;
  if (action === "add") result = addReview_(body);
  else if (action === "helpful") result = markHelpful_(body.id);
  else result = { success: false, error: "Unknown action: " + action };

  return respond_(result);
}

function respond_(obj, callbackName) {
  var json = JSON.stringify(obj);
  if (callbackName) {
    // JSONP: a <script>-tag response, exempt from CORS.
    return ContentService
      .createTextOutput(callbackName + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function listReviews_() {
  try {
    var sheet = getSheet_();
    var range = sheet.getDataRange().getValues();
    if (range.length < 2) return { success: true, reviews: [] };

    var headers = range[0];
    var idx = headerIndex_(headers);
    if (idx.id === undefined) {
      return { success: false, error: "Sheet is missing an 'ID' header in row 1." };
    }
    var rows = range.slice(1);

    var reviews = rows
      .filter(function (row) { return row[idx.id] !== "" && row[idx.id] != null; })
      .map(function (row) {
        var ts = row[idx.timestamp];
        var iso = "";
        if (ts instanceof Date) iso = ts.toISOString();
        else if (ts) { var d = new Date(ts); if (!isNaN(d.getTime())) iso = d.toISOString(); }

        return {
          id: String(row[idx.id]),
          name: String(row[idx.name] || ""),
          social: String(row[idx.social] || ""),
          message: String(row[idx.message] || ""),
          stars: Number(row[idx.stars]) || 5,
          helpful: Number(row[idx.helpful]) || 0,
          date: iso
        };
      });

    return { success: true, reviews: reviews };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function addReview_(params) {
  // A script lock keeps two near-simultaneous submissions (e.g. a new
  // review and a "Helpful" click landing in the same second) from
  // reading/writing the sheet at the same time and clobbering each other.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return { success: false, error: "Server is busy, please try again." };
  }

  try {
    var name = String(params.name || "").trim();
    var message = String(params.message || "").trim();
    if (!name || !message) {
      return { success: false, error: "Name and review message are required." };
    }

    var sheet = getSheet_();
    var range = sheet.getDataRange().getValues();
    var headers = range[0] || [];
    var idx = headerIndex_(headers);
    if (idx.id === undefined) {
      return { success: false, error: "Sheet is missing an 'ID' header in row 1." };
    }

    var social = String(params.social || "").trim();
    var stars = Number(params.stars) || 5;
    // Use the visitor's device date/time if provided, else fall back to server time.
    var timestamp = params.date ? new Date(params.date) : new Date();
    if (isNaN(timestamp.getTime())) timestamp = new Date();
    var id = Utilities.getUuid();

    // Build the new row by header position (not a hardcoded column order)
    // so it lands correctly even if the sheet's columns aren't laid out
    // in exactly A–G ID/Name/Social/Message/Stars/Helpful/Timestamp order.
    var newRow = new Array(headers.length).fill("");
    newRow[idx.id] = id;
    newRow[idx.name] = name;
    newRow[idx.social] = social;
    newRow[idx.message] = message;
    newRow[idx.stars] = stars;
    newRow[idx.helpful] = 0;
    newRow[idx.timestamp] = timestamp;

    sheet.appendRow(newRow);
    return { success: true, id: id };
  } catch (err) {
    return { success: false, error: String(err) };
  } finally {
    lock.releaseLock();
  }
}

function markHelpful_(targetId) {
  if (!targetId) return { success: false, error: "Missing review id." };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return { success: false, error: "Server is busy, please try again." };
  }

  try {
    var sheet = getSheet_();
    var range = sheet.getDataRange().getValues();
    var headers = range[0] || [];
    var idx = headerIndex_(headers);
    if (idx.id === undefined) {
      return { success: false, error: "Sheet is missing an 'ID' header in row 1." };
    }

    for (var i = 1; i < range.length; i++) {
      if (String(range[i][idx.id]) === String(targetId)) {
        var newCount = (Number(range[i][idx.helpful]) || 0) + 1;
        sheet.getRange(i + 1, idx.helpful + 1).setValue(newCount);
        return { success: true, helpful: newCount };
      }
    }
    return { success: false, error: "Review not found." };
  } catch (err) {
    return { success: false, error: String(err) };
  } finally {
    lock.releaseLock();
  }
}

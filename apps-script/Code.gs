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

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET — list all reviews.
 * https://YOUR_DEPLOYMENT_URL/exec?action=list
 */
function doGet(e) {
  try {
    var sheet = getSheet_();
    var range = sheet.getDataRange().getValues();
    if (range.length < 2) return jsonOutput_({ success: true, reviews: [] });

    var headers = range[0];
    var idx = headerIndex_(headers);
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

    return jsonOutput_({ success: true, reviews: reviews });
  } catch (err) {
    return jsonOutput_({ success: false, error: String(err) });
  }
}

/**
 * POST — add a review, or mark one helpful.
 * Body is JSON:
 *   { "action": "add", "name": "...", "social": "...", "message": "...", "stars": 5, "date": "ISO string" }
 *   { "action": "helpful", "id": "..." }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput_({ success: false, error: "Missing request body." });
    }
    var body = JSON.parse(e.postData.contents);
    var action = body.action || "add";
    var sheet = getSheet_();

    if (action === "add") {
      var name = String(body.name || "").trim();
      var message = String(body.message || "").trim();
      if (!name || !message) {
        return jsonOutput_({ success: false, error: "Name and review message are required." });
      }

      var social = String(body.social || "").trim();
      var stars = Number(body.stars) || 5;
      // Use the visitor's device date/time if provided, else fall back to server time.
      var timestamp = body.date ? new Date(body.date) : new Date();
      if (isNaN(timestamp.getTime())) timestamp = new Date();
      var id = Utilities.getUuid();

      sheet.appendRow([id, name, social, message, stars, 0, timestamp]);
      return jsonOutput_({ success: true, id: id });
    }

    if (action === "helpful") {
      var targetId = body.id;
      if (!targetId) return jsonOutput_({ success: false, error: "Missing review id." });

      var range = sheet.getDataRange().getValues();
      var headers = range[0];
      var idx = headerIndex_(headers);

      for (var i = 1; i < range.length; i++) {
        if (String(range[i][idx.id]) === String(targetId)) {
          var newCount = (Number(range[i][idx.helpful]) || 0) + 1;
          sheet.getRange(i + 1, idx.helpful + 1).setValue(newCount);
          return jsonOutput_({ success: true, helpful: newCount });
        }
      }
      return jsonOutput_({ success: false, error: "Review not found." });
    }

    return jsonOutput_({ success: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonOutput_({ success: false, error: String(err) });
  }
}

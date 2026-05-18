// =================================================================
// 📋 GOOGLE APPS SCRIPT — Paste this into Google Apps Script Editor
// =================================================================
//
// SETUP STEPS (if not done already):
// 1. Go to https://sheets.google.com → Create a new blank spreadsheet
// 2. Rename "Sheet1" tab to "Data" (right-click the tab → Rename)
// 3. Go to Extensions → Apps Script
// 4. Delete any code in Code.gs and paste ALL of this code
// 5. Click "Deploy" → "New Deployment"
// 6. Click the gear icon → select "Web app"
// 7. Set "Execute as" → "Me"
// 8. Set "Who has access" → "Anyone"
// 9. Click "Deploy" → Authorize when prompted
// 10. Copy the Web App URL and paste it in app.js (SCRIPT_URL)
//
// ⚠️ IMPORTANT: After updating this code, you MUST redeploy:
//    Deploy → Manage Deployments → Edit (pencil icon) → 
//    Version: "New Version" → Deploy
//
// =================================================================

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data');
  var data = sheet.getRange('A1').getValue();
  var output = ContentService.createTextOutput(data || '[]');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data');
    var data = '';

    // Handle form submission (from hidden iframe)
    if (e.parameter && e.parameter.data) {
      data = e.parameter.data;
    }
    // Handle raw POST body
    else if (e.postData && e.postData.contents) {
      data = e.postData.contents;
    }

    if (data) {
      sheet.getRange('A1').setValue(data);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'No data received' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

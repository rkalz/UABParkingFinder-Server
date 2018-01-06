// Required to get Firebase working in Heroku
const express = require("express");
let app = express();
app.set('port', (process.env.PORT || 5000));

// Get Firebase credentials and initialize admin access
let admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
console.log("Initializing Firebase SDK...");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uab-parking-buddy.firebaseio.com"
});

// Get access to the database
console.log("Initializing database access...");
let db = admin.database();
let ref = db.ref("reports");

// Looks at the ten most recent reports and determine the
// overall lot status based on this
function updateOverall(changedChild,lotName)
{
  ref = db.ref("overall");
  let total = 0;
  let reportCount = 0;
  let reversedReportList = new Array();

  // Dictionary is sorted oldest to newest, need reverse order
  for (let key in changedChild) {
    reversedReportList.unshift(key);
  }

  for (let index in reversedReportList) {
    if (changedChild.hasOwnProperty(reversedReportList[index]) && reportCount != 10){
      total += changedChild[reversedReportList[index]].status;
      reportCount++;
    }
  }

  total = Math.ceil(total / reportCount);

  ref.update({
    [lotName]: total
  });

  // Change reference back to reports so we can listen for changes
  ref = db.ref("reports");
}

console.log("Listening to changes in database...");
// Get the lot that has changed and perform updateOverall
app.listen(app.get('port'), () => {
  ref.on("child_changed", snapshot => {
    let changedChild = snapshot.val();
    let newest = changedChild[ Object.keys(changedChild).pop() ];
    console.log("Time: " + newest.reportTime + " Lot: " + newest.lot + " Status: " + newest.status);
    updateOverall(changedChild,newest.lot);
  }, errorObject => {
    console.log("The read failed: " + errorObject.code);
  });
});

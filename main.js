var express = require("express");
var app = express();

app.set('port', (process.env.PORT || 5000));

var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

console.log("Initializing Firebase SDK...");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uab-parking-buddy.firebaseio.com"
});

console.log("Initializing database access...");
var db = admin.database();
var ref = db.ref("reports");

console.log("Listening to changes in database...");
app.listen(app.get('port'), function() {
  ref.on("child_changed", function(snapshot) {
    var changedChild = snapshot.val();
    var newest = changedChild[ Object.keys(changedChild).pop() ];
    console.log("Time: " + newest.reportTime + " Lot: " + newest.lot + " Status: " + newest.status);
    updateOverall(changedChild,newest.lot);
  }, function(errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
});

function updateOverall(changedChild,lotName)
{
  ref = db.ref("overall");
  var total = 0;
  var reportCount = 0;

  for (var key in changedChild) {
    if (changedChild.hasOwnProperty(key)){
      total = total + changedChild[key].status;
      reportCount++;
    }
  }

  total = Math.ceil(total / reportCount);

  ref.set({
    [lotName]: total
  });

  ref = db.ref("reports");
}

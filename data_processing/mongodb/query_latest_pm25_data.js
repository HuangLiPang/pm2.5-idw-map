"use strict";
const fs = require("fs");
const MongoClient = require("mongodb").MongoClient;

// Connection URL
const dbUrl = "mongodb://iisnrl:iisnrl619@140.109.20.206:27017";

// Database Name
const dbName = "lassdb";

// Query time
const now = new Date(),
  // nowUTCDate = [year, month, date]
  // all items are string.
  nowUTCDate = [
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
  ].map(date => {
    date = date.toString();
    if (date.length !== 4) {
      if (date < 10) {
        date = '0' + date;
      }
    }
    return date;
  }),
  // In mongodb, the date and time is in UTC
  nowUTCDateString = `${nowUTCDate[0]}-${nowUTCDate[1]}-${nowUTCDate[2]}`;

const filePath = "/Users/iisnrl/Documents/test_HuangLiPang/mongodb/";

let pm25json = {
  "latest-updated-time": now,
  "points": []
};

let logMessage = "", errorMessage = "";

MongoClient.connect(dbUrl)
  .then(client => {
    let db = client.db(dbName);
    let counter = 0; // used for counting how many queried items.
    db.collection("latest")
      .find({
        "device_id": { $exists: true },
        "s_d0": { $exists: true },
        "date": nowUTCDateString
      }, {
        loc: 1,   // location
        s_d0: 1,  // pm2.5
        _id: 0 
      }).toArray()
      .then(collections => {
        collections.forEach(collection => {
          pm25json.points.push([collection.loc.coordinates[0], 
                                collection.loc.coordinates[1], 
                                collection.s_d0]);
          counter++;
        })
      })
      .then(() => {
        client.close();
        fs.writeFile(`${filePath}test_data/pm25.json`, JSON.stringify(pm25json), function(err) {
          if (err) {
            errorMessage = "[Write File Error]:";
            throw err;
          }
          logMessage = `${counter} points was saved in pm25.json at ${now}.\r\n`;
          fs.appendFile(`${filePath}log`, logMessage, function (err) {
            if (err) throw err;
            console.log('Saved!');
          });
        });
      })
      .catch(error => {
        console.log("[Collection Error]: ");
        console.log(error);
      });
  })
  .catch(error => {
    console.log("[MongoClient Error]: ");
    console.log(error);
  });
"use strict";
const fs = require("fs");
const MongoClient = require("mongodb").MongoClient;
// loading config variable from .env
// executed by crontab, we need to add .env path
const dotenvPath = "";
const dotenv = require('dotenv').config({path: dotenvPath});

// Connection URL
const dbUrl = process.env.DB_URL;

// Database Name
const dbName = "lassdb";

// Query time
const now = new Date(),
  nowlocaleDate = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  ].map(date => {
    date = date.toString();
    if (date.length !== 4) {
      if (date < 10) {
        date = '0' + date;
      }
    }
    return date;
  }),
  // nowUTCDate = [year, month, date]
  // all items are string.
  nowUTCDate = [
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate()
  ].map(date => {
    date = date.toString();
    if (date.length !== 4) {
      if (date < 10) {
        date = '0' + date;
      }
    }
    return date;
  }),
  yesterday = (function(now) {
    let yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return yesterday;
  })(now),
  yesterdayUTCDate = [
    yesterday.getUTCFullYear(),
    yesterday.getUTCMonth() + 1,
    yesterday.getUTCDate()
  ].map(date => {
    date = date.toString();
    if (date.length !== 4) {
      if (date < 10) {
        date = '0' + date;
      }
    }
    return date;
  }),
  nowlocaleDateString = `${nowlocaleDate[0]}-${nowlocaleDate[1]}-${nowlocaleDate[2]}`,
  // In mongodb, the date and time is in UTC
  nowUTCDateString = `${nowUTCDate[0]}-${nowUTCDate[1]}-${nowUTCDate[2]}`,
  yesterdayUTCDateString = `${yesterdayUTCDate[0]}-${yesterdayUTCDate[1]}-${yesterdayUTCDate[2]}`;

const filePath = process.env.DIRECTORY;
let pm25json = {
  "latest-updated-time": now,
  "points": []
};
let logMessage = "";

MongoClient.connect(dbUrl)
  .then(client => {
    let db = client.db(dbName);
    // used for counting how many queried items.
    let counter = 0;

    db.collection("latest")
      .find({
        "device_id": { $exists: true },
        "s_d0": { $exists: true },
        $or: [{"date": nowUTCDateString}, {"date": yesterdayUTCDateString}]
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
        // Output data.json
        fs.writeFile(`${filePath}data/data.json`, JSON.stringify(pm25json), function(err) {
          if (err) {
            console.log("[Write file Error]: data.json not saved at ${now}");
            console.log(err.message);
            logMessage = err.message;
          } else {
            logMessage = `${counter} points was saved in pm25.json at ${now}.\r\n`;
          }
          // Write log file
          fs.appendFile(`${filePath}data_processing/mongodb/log/${nowlocaleDateString}.log`, logMessage, function (err) {
            if (err) {
              console.log(`[Append file Error]: ${nowlocaleDateString}.log not saved at ${now}`)
              console.log(err.message);
            } else {
              console.log(`${nowlocaleDateString}.log saved at ${now}`);
            }
          });
        });
      })
      .catch(error => {
        console.log(`[Collection Error]: at ${now}`);
        console.log(error.message);
      });
  })
  .catch(error => {
    console.log(`[MongoClient Error]: at ${now}`);
    console.log(error.message);
  });
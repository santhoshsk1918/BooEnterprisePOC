var express = require('express');
const { routes } = require('../app');
var router = express.Router();
const { getRollingMatches, bulkLoadMatches, bulkMatch, fillUpForCriteria, getUserMatches, getMatches, popItem } = require("../services/Api/indexApiService");


router.get('/api/bulkload/', async function(req, res, next) {
  let id = req.query.id;
  let list = id === undefined ? await bulkMatch() : await bulkLoadMatches(id);
  res.send(list);
  res.end()  
});

router.post("/getMatch", async function(req, res, next) {
  let {maxAge, minAge, global, local, personality, birthdayGte, birthdayLte, lastId, currentUserId} = req.body;
  let items = await getMatches(maxAge, minAge, global, local, personality, birthdayLte, birthdayGte, lastId, currentUserId)
  res.send(items);
})

router.post("/getRollingMatches", async function(req, res, next) {
  let {maxAge, minAge, global, local, personality, birthdayGte, birthdayLte, lastId, currentUserId} = req.body;
  let items = await getRollingMatches(maxAge, minAge, global, local, personality, birthdayLte, birthdayGte, lastId, currentUserId)
  res.send(items);
})

router.post("/getUserMatches", async function(req, res, next) {
  let {currentUserId} = req.body;
  let items = await getUserMatches(currentUserId)
  res.send(items);
})

router.post("/updateView", async function(req, res, next) {
  let {currentUserId, viewId} = req.body;
  let pop = await popItem(currentUserId, viewId);
  res.send("done")
})

router.post("/fillUpMatches", async function(req, res, next) {
  let {maxAge, minAge, global, local, personality, birthdayGte, birthdayLte, lastId, currentUserId} = req.body;
  let items = await fillUpForCriteria(maxAge, minAge, global, local, personality, birthdayLte, birthdayGte, lastId, currentUserId)
  res.send(items);
})


module.exports = router;

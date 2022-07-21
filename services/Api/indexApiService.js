const { getCollection } = require("../connectionService/mongodbConnection");
const {
  DATABASE_NAME,
  USERS_COLLECTION,
  EXCLUTION_LIST,
  MATCH_DISPLAY
} = require("../../bin/constants/mogodbConstants");

module.exports.getMatches = async (
  maxAge,
  minAge,
  global,
  local,
  personality,
  birthdayLte,
  birthdayGte,
  lastId,
  currentUserId,
  setlimit
) => {
  let match1 = {
    $match: {
      "preferences.maxAge": {
        $lte: maxAge,
      },
      "preferences.minAge": {
        $gte: minAge,
      },
      "preferences.global": global,
      "preferences.local": local,
      "preferences.personality": {
        $elemMatch: {
          $in: personality,
        },
      },
      birthday: {
        $gte: new Date(birthdayGte),
        $lte: new Date(birthdayLte),
      },
      ...(lastId && { _id: { $gte: lastId } }),
    },
  };

  let sort = {
    $sort: { createdAt: 1 },
  };

  // Most Important
  let limit = { $limit: setlimit ? setlimit : 15 };

  let addField = {
    $addFields: {
      newField: {
        $concat: [currentUserId, "-", "$_id"],
      },
    },
  };

  let lookUp = {
    $lookup: {
      from: "exclution",
      localField: "newField",
      foreignField: "exclutionCombination",
      as: "result",
    },
  };

  let match2 = {
    $match: {
      result: {
        $size: 0,
      },
    },
  };

  let UserCollection = await getCollection(DATABASE_NAME, USERS_COLLECTION);
  let list = await UserCollection.aggregate([
    match1,
    sort,
    limit,
    addField,
    lookUp,
    match2,
  ]).toArray();
  return list;
};

module.exports.getUserMatches = async (currentUserId) => {
    let list = MatchCollection.find({_id: currentUserId},{}).toArray();
    if(list.matches.length() < 4) {
        // await this.getRollingMatches()
    }
    return list;
}

module.exports.getRollingMatches = async (
  maxAge,
  minAge,
  global,
  local,
  personality,
  birthdayLte,
  birthdayGte,
  lastId,
  currentUserId,
  recounter = 1,
  limit = 15
) => {
  let matches = await this.getMatches(
    maxAge,
    minAge,
    global,
    local,
    personality,
    birthdayLte,
    birthdayGte,
    lastId,
    currentUserId,
    limit
  );

  let currentLastId = matches.slice(-1).pop() ? matches.slice(-1).pop() : -1;
  let MatchCollection = await getCollection(DATABASE_NAME, MATCH_DISPLAY);

  let userMatch = {
    _id: currentUserId,
    criteria: {
      maxAge,
      minAge,
      global,
      local,
      personality,
      birthdayLte,
      birthdayGte,
    },
    lastId: currentLastId,
  };

  await MatchCollection.updateOne(
    { _id: currentUserId },
    { $set: userMatch, $push: { matches: {$each: matches } }},
    { upsert: true }
  );
  
  if (matches.length < 5) {
    recounter++;
    if (recounter <= 3) {
      return this.getRollingMatches(
        maxAge,
        minAge,
        global,
        local,
        personality,
        birthdayLte,
        birthdayGte,
        lastId,
        currentUserId,
        recounter,
        limit * recounter
      ); // 1*15, 2*15, 3*15
    } else if (recounter <= 6) {
      return this.getRollingMatches(
        maxAge,
        minAge,
        global,
        local,
        personality,
        birthdayLte,
        birthdayGte,
        lastId,
        currentUserId,
        recounter,
        limit * recounter * 10
      ); // 4*15, 5*15, 6*15
    } else {
      return this.getRollingMatches(
        maxAge,
        minAge,
        global,
        local,
        personality,
        birthdayLte,
        birthdayGte,
        lastId,
        currentUserId,
        recounter,
        1000
      );
    }
  }

  return MatchCollection.find({_id: currentUserId}).toArray();
};

module.exports.fillUpForCriteria = async (
  maxAge,
  minAge,
  global,
  local,
  personality,
  birthdayLte,
  birthdayGte,
  lastId,
  currentUserId
) => {
  let matches = await this.getMatches(
    maxAge,
    minAge,
    global,
    local,
    personality,
    birthdayLte,
    birthdayGte,
    lastId,
    currentUserId
  );
  let ExclutionListCollection = await getCollection(
    DATABASE_NAME,
    EXCLUTION_LIST
  );
  let exclutionList = [];
  await matches.map((itm) => {
    let x = Math.ceil(Math.random() * 100);
    if (x % 3 !== 0) {
      exclutionList.push({
        userId: currentUserId,
        exclution: itm._id,
        exclutionCombination: `${currentUserId}-${itm._id}`,
      });
    }
  });
  await ExclutionListCollection.insertMany(exclutionList, { ordered: false });
};

module.exports.bulkMatch = async () => {
  let UserCollection = await getCollection(DATABASE_NAME, USERS_COLLECTION);
  const sample = {
    $sample: {
      size: 150,
    },
  };

  const projection = {
    $project: { _id: 1 },
  };

  let sampleList = await UserCollection.aggregate([
    sample,
    projection,
  ]).toArray();
  await sampleList.map(async (item) => {
    await bulkLoadMatchesForUser(item._id);
  });

  return "done";
};

module.exports.popItem = async (currentUserId, popId) => {
    let MatchCollection = await getCollection(DATABASE_NAME, MATCH_DISPLAY);
    // $pull
}

async function bulkLoadMatchesForUser(id) {
  let UserCollection = await getCollection(DATABASE_NAME, USERS_COLLECTION);
  let ExclutionListCollection = await getCollection(
    DATABASE_NAME,
    EXCLUTION_LIST
  );
  const sample = {
    $sample: {
      size: 150,
    },
  };
  const match = {
    $match: {
      _id: { $ne: id },
    },
  };
  const projection = {
    $project: { _id: 1 },
  };
  let exclutionList = [];
  for (var i = 0; i < 10; i++) {
    let list = await UserCollection.aggregate([sample, projection]).toArray();
    list.map((itm) => {
      exclutionList.push({
        userId: id,
        exclution: itm._id,
        exclutionCombination: `${id}-${itm._id}`,
      });
    });
  }
  try {
    await ExclutionListCollection.insertMany(exclutionList, { ordered: false });
    return null;
  } catch (err) {
    return null;
  }
}

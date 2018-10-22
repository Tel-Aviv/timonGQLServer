import client from '../elasticsearch/connection';
import esb from 'elastic-builder';
import sql from 'mssql';
import mysql from 'promise-mysql';
import casual from 'casual';
import moment from 'moment';
import momentRandom from 'moment-random';
var myArgs = require('optimist').argv,
    help1 = 'No target-load is specified. Add -t [ES|mySQL] to CLI',
    help2 = 'No load size is specified. Add -s <number> to CLI';

import regionData from '../data/regions.json';
import clustersData from '../data/clusters.json';

if( !myArgs.t ) {
  console.log(help1);
  process.exit(0);
}
if( !myArgs.s ) {
  console.log(help2);
  process.exit(0);
}

let clean = myArgs.c ? true : false;
console.log(clean);

const tokens = myArgs.t.split(',');
//console.log(tokens);

let loadToES = false;
let res =tokens.find( token => {
  return token == 'ES'
});
if( res );
  loadToES = true;
//console.log(loadToES);

let loadSize = myArgs.s;
console.log(loadSize);

const mySqlConfig = {
  host: 'localhost',
  user: 'gql',
  password: 'dfnc94^*'
};


const vehicleTypes = ['car', 'truck', 'motorbike', 'bus'];
const directions = ['in', 'out'];

const startDate = moment('01/09/2018T00:00:00', 'DD/MM/YYYY');

const endDate = moment();

// Populate array of place licences
const vehicles = [];
for(let i=0; i<50000; i++) {
  const a1 = ("00" + casual.integer(0, 99)).slice(-2);
  const a2 = ("000" + casual.integer(0, 999)).slice(-3);
  const a3 = ("00" + casual.integer(0, 99)).slice(-2);
  const lpr = a1.concat('-', a2).concat('-', a3)
  vehicles.push({
    type: casual.random_element(vehicleTypes),
    lpr: lpr
  });
};

const cameraIds = [];
regionData.regions.map( region => {
    region.cameras.map( camera => {
      cameraIds.push(camera.id);
    })
});

const externalCameraIds = [];
clustersData.clusters.map( cluster => {
   cluster.cameras.map(camera => {
      externalCameraIds.push(camera.id);
   })
});

let iterations = [];
while (loadSize > 200000) {
  iterations.push(200000);
  loadSize -= 200000;
}
iterations.push(loadSize);


(async () => {

  try {

    if( clean ) {

      const conn = await mysql.createConnection(mySqlConfig);
      //let _sqlQuery = `delete from snaps.snaps where id > 0`;
      let _sqlQuery = "TRUNCATE `snaps`.`snaps`;";

      let result = await conn.query(_sqlQuery);
      console.log(`mySQL Deleted: ${JSON.stringify(result)} rows`);

      await conn.end();

      let requestBody = esb.requestBodySearch()
                        .query(
                            esb.matchAllQuery()
                        );


      let response = await client.deleteByQuery({
        index: "snaps",
        scrollSize: 200,
        body: requestBody.toJSON()
      });
      clean = false;
    }
  } catch( err ) {
    console.error(err);
    process.exit(1);
  }

  let bulk = [];
  for (let j = 0; j < iterations.length; j++) {
    const iteration = iterations[j];
    bulk = [];
    let sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
            values `;
    let firstQuery = true;

    let sql_result = {};
    let response = {};
    console.log('start loop');

    for(let i = 0; i < iteration; i++) {

      // Insert two records with same lpr
      let lpr = casual.random_element(vehicles).lpr;
      let vehicleType = casual.random_element(vehicles).type;
      let direction = casual.random_element(directions);
      let cameraId = casual.random_element(externalCameraIds);

      let dt = momentRandom(endDate ,startDate);
      if (!firstQuery) {
        sqlQuery += `,`;
      } else {
        firstQuery = false;
      }

      sqlQuery += `('${cameraId}',
      '${lpr}',
      '${direction}',
      '${vehicleType}',
      '${dt.format('YYYY-MM-DDTHH:mm:ss')}')`;

      let record = {
        cameraId: cameraId,
        lpr: lpr,
        direction: direction,
        vehicleType: vehicleType,
        dateTime: dt.clone().utc().format('YYYY-MM-DDTHH:mm:ssZ')
      };
      bulk.push(
          { index: {_index: 'snaps', _type: 'doc' } },
          record);

      // same lpr, but different time within same date
      cameraId = casual.random_element(cameraIds);
      dt = momentRandom(dt.clone().endOf('day'), dt);


      sqlQuery += `,('${cameraId}',
      '${lpr}',
      '${direction}',
      '${vehicleType}',
      '${dt.format('YYYY-MM-DDTHH:mm:ss')}')`;


      let record2 = {
        cameraId: cameraId,
        lpr: lpr,
        direction: direction,
        vehicleType: vehicleType,
        dateTime: dt.clone().utc().format('YYYY-MM-DDTHH:mm:ssZ')
      };
      bulk.push(
          { index: {_index: 'snaps', _type: 'doc' } },
          record2);

    }
    console.log('send bulk to elastic');
    response = await client.bulk({
      index: 'snaps',
      type: 'doc',
      timeout: '10m',
      body: bulk
    });
    if( response.errors ) {
      response.items.map( item => {
        if( item.index.status != 201 ) {
          console.log(item.index.error);
        }
      });
    } else {
      console.log("took: ", response.took);
    }

    let conn = await mysql.createConnection(mySqlConfig);
    console.log('send query to mysql');
    sql_result = await conn.query(sqlQuery);
    console.log('insert: ', sql_result.affectedRows);


    sql_result = await conn.end();
  }

})();

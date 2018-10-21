import client from '../elasticsearch/connection';
import esb from 'elastic-builder';
import sql from 'mssql';
import mysql from 'mysql';
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

const clean = myArgs.c ? true : false;
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

const loadSize = myArgs.s;
console.log(loadSize);

const mySqlConfig = {
  host: 'localhost',
  user: 'gql',
  password: 'dfnc94^*'
};

//const cameraIds = ['10', '11', '21', '22'];
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
//console.log(cameraIds);

const externalCameraIds = [];
clustersData.clusters.map( cluster => {
   cluster.cameras.map(camera => {
      externalCameraIds.push(camera.id);
   })
});
//console.log(externalCameraIds);

let bulk = [];

( async() => {
    const conn = mysql.createConnection(mySqlConfig);
    conn.connect( async(err) => {
      if( err ) {
          console.log(`mySQL Connection error: ${err}`);
      } else {

           let sqlQuery = `delete from snaps.snaps where id > 0`;
           if( clean ) {
             conn.query(sqlQuery, (err, result) => {
               if( err ) {
                 console.log(err);
                 process.exit(-1);
               } else {
                 console.log(`mySQL Deleted: ${JSON.stringify(result.affectedRows)} rows`);
               }

             });
          }

           let requestBody = esb.requestBodySearch()
                              .query(
                                  esb.matchAllQuery()
                              );
           let response = {};
           if( clean ) {
            response = await client.deleteByQuery({
               index: "snaps",
               scrollSize: 200,
               body: requestBody.toJSON()
             });
           };

           for(let i = 0; i < loadSize; i++) {

               // Insert two records with same lpr
               const lpr = casual.random_element(vehicles).lpr;
               const vehicleType = casual.random_element(vehicles).type;
               const direction = casual.random_element(directions);
               let cameraId = casual.random_element(externalCameraIds);

               let dt = momentRandom(endDate ,startDate);
               sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
                                       values('${cameraId}',
                                              '${lpr}',
                                              '${direction}',
                                              '${vehicleType}',
                                              '${dt.format('YYYY-MM-DDTHH:mm:ss')}')`;
               // MySQL stores TIMEDATE values without timezone.
               // Client timezone is indicated per connection basis
               // e.g. SET time_zone = '+00:00';
                conn.query(sqlQuery, (err, result) => {
                  if( err ) { console.error(err) }
                  //console.log(`Result: ${JSON.stringify(result.affectedRows)}`);
                });

                let record = {
                  cameraId: cameraId,
                  lpr: lpr,
                  direction: direction,
                  vehicleType: vehicleType,
                  dateTime: dt.format('YYYY-MM-DDTHH:mm:ssZ')
                };
                bulk.push(
                   { index: {_index: 'snaps', _type: 'doc' } },
                    record);

                // same lpr, but different time within same date
                cameraId = casual.random_element(cameraIds);
                dt = momentRandom(dt.clone().endOf('day'), dt);
                sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
                                       values('${cameraId}',
                                              '${lpr}',
                                              '${direction}',
                                              '${vehicleType}',
                                              '${dt.format('YYYY-MM-DDTHH:mm:ss')}')`;
                conn.query(sqlQuery, (err, result) => {
                  if( err ) { console.error(err) }
                  //console.log(`Result: ${JSON.stringify(result.affectedRows)}`);
                });

                let record2 = {
                  cameraId: cameraId,
                  lpr: lpr,
                  direction: direction,
                  vehicleType: vehicleType,
                  dateTime: dt.format('YYYY-MM-DDTHH:mm:ssZ')
                };
                bulk.push(
                   { index: {_index: 'snaps', _type: 'doc' } },
                   record2);

           }

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
           }

          sqlQuery = `select count(*) as count from snaps.snaps`;
          conn.query(sqlQuery, (err, result) => {
              if( err ) throw err;
              console.log(`mySQL Inserted: ${JSON.stringify(result[0].count)}`);
          });

          conn.end( err => {
            if( err ) throw err;
          });
      }

    })
})();


// ( async() => {
//     try {
//       let pool = await sql.connect(config);
//       let result =  await pool.request()
//                       .query(`delete from snaps`);
//       console.dir(`Deleted: ${result.rowsAffected}`);
//
//       const request = pool.request();
//       for(let i = 0; i < 500000; i++) {
//
//         const cameraId = casual.random_element(cameraIds);
//         const dt = momentRandom(endDate ,startDate).format('YYYY-MM-DDTHH:mm:ss');
//         result = await request.query(`insert into snaps (cameraId, lpr, direction, vehicleType, [dateTime])
//                       values('${cameraId}',
//                              '${casual.random_element(vehicles).lpr}',
//                              '${casual.random_element(directions)}',
//                              '${casual.random_element(vehicles).type}',
//                              '${dt}')`
//                      );
//       }
//
//       result = await pool.request()
//                 .query(`select count(*) as count from snaps`);
//       console.dir(`Inserted: ${JSON.stringify(result.recordsets[0][0].count)}`);
//
//     } catch( err ) {
//       console.log(`Execution error: ${err}`);
//     }
//
//     process.exit(0);
//
// })();

// sql.on('error', err => {
//     console.error(`Error: ${err}`);
// })

// const pool = new sql.ConnectionPool(config);
// console.log(`Pool is created`);
// pool.connect(config, err => {
//   console.log(`Trying to connect`);
//   if( err ) {
//     console.log(err);
//     return;
//   }
//
//   console.log(`Connected`);
//
// })

import sql from 'mssql';
import mysql from 'mysql';
import casual from 'casual';
import moment from 'moment';
import momentRandom from 'moment-random';

import regionData from '../data/regions.json';
import clustersData from '../data/clusters.json';

const config = {
  user: 'gql',
  password: 'Dfnc94^*8',
  server: 'localhost',
  database: 'snaps',
  options: {
    encrypt: false
  }
};

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

// for(let i = 0; i < 1; i++) {
//
//   let cameraId = casual.random_element(externalCameraIds);
//   let dt = momentRandom(endDate ,startDate);
// //   console.log(`${dt.format('YYYY-MM-DDTHH:mm:ss')}
// // ${dt.eod.format('YYYY-MM-DDTHH:mm:ss')}`);
//
//   let snap = {
//     cameraId: cameraId,
//     dateTime: dt.format('YYYY-MM-DDTHH:mm:ss')
//   };
//   console.log(snap);
//
//   dt = momentRandom(dt.clone().endOf('day'), dt);
//
//   cameraId = casual.random_element(cameraIds);
//   snap = {
//     cameraId: cameraId,
//     dateTime: dt.format('YYYY-MM-DDTHH:mm:ss')
//   };
//   console.log( snap );
//
// }

( async() => {
    const conn = mysql.createConnection(mySqlConfig);
    conn.connect( err => {
      if( err ) {
          console.log(`Connection error: ${err}`);
      } else {

           let sqlQuery = `delete from snaps.snaps where id > 0`;
           conn.query(sqlQuery, (err, result) => {
             if( err ) {
               console.log(err);
               process.exit(-1);
             } else {
               console.log(`Deleted: ${JSON.stringify(result.affectedRows)} rows`);
             }

           });

           for(let i = 0; i < 250000; i++) {

             // Insert two records with same lpr
             const lpr = casual.random_element(vehicles).lpr;
             const vehicleType = casual.random_element(vehicles).type;
             const direction = casual.random_element(directions);

             let dt = momentRandom(endDate ,startDate);
             sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
                                     values('${casual.random_element(externalCameraIds)}',
                                            '${lpr}',
                                            '${direction}',
                                            '${vehicleType}',
                                            '${dt.format('YYYY-MM-DDTHH:mm:ss')}')`;
              conn.query(sqlQuery, (err, result) => {
                if( err ) { console.error(err) }
                //console.log(`Result: ${JSON.stringify(result.affectedRows)}`);
              });

              // same lpr, but different time within same date
              dt = momentRandom(dt.clone().endOf('day'), dt);
              sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
                                     values('${casual.random_element(cameraIds)}',
                                            '${lpr}',
                                            '${direction}',
                                            '${vehicleType}',
                                            '${dt.format('YYYY-MM-DDTHH:mm:ss')}')`;
              conn.query(sqlQuery, (err, result) => {
                if( err ) { console.error(err) }
                //console.log(`Result: ${JSON.stringify(result.affectedRows)}`);
              });

          }

          sqlQuery = `select count(*) as count from snaps.snaps`;
          conn.query(sqlQuery, (err, result) => {
              if( err ) throw err;
              console.log(`Inserted: ${JSON.stringify(result[0].count)}`);
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

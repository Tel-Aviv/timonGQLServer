import mysql from 'promise-mysql';

const mySqlConfig = {
  host: 'localhost',
  user: 'gql',
  password: 'dfnc94^*'
};

const mySQLSubscriber = async(snap) => {
  try {
    const conn = await mysql.createConnection(mySqlConfig);
    //console.log(snap);
    const dt = snap.dateTime.format('YYYY-MM-DDTHH:mm:ss')
    const sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
                      values(${snap.cameraId}, '${snap.lpr}', '${snap.direction}', '${snap.vehicleType}', '${dt}')`;
    const result = await conn.query(sqlQuery);
    console.log(`MySQL response: ${result.affectedRows}`);

    await conn.end();
  } catch( err ) {
    console.error(`MySQL Error: ${err}`);
  }
};

export default mySQLSubscriber;

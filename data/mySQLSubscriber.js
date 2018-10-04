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
    const sqlQuery = `insert into snaps.snaps (cameraId, lpr, direction, vehicleType, dateTime)
                      values(${snap.cameraId}, '${snap.lpr}', '${snap.direction}', '${snap.vehicleType}', '${snap.dateTime}')`;
    const result = await conn.query(sqlQuery);
<<<<<<< HEAD
    //console.log(`MySQL response: ${result.affectedRows}`);
=======
    console.log(`MySQL response: ${result.affectedRows}`);
>>>>>>> 7741a64a767533fa3184a87416c6ce0e59fcd827

    await conn.end();
  } catch( err ) {
    console.error(`MySQL Error: ${err}`);
  }
};

export default mySQLSubscriber;

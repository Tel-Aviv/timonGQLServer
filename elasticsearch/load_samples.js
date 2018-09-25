// @flow
import client from './connection';

async function load() {
  // Snap from 'external' camera
  let response = await client.index({
    "index": "snaps",
    "type": "snap",
    "body": {
      lpr: "11-111-11",
      cameraId: "111",
      direction: "in",
      vehicleType: "car",
      "dateTime": "2018-09-25T03:18:00.000Z"
    }
  });
  console.log(response);

  // Snap from 'internal' camera
  response = await client.index({
    "index": "snaps",
    "type": "snap",
    "body": {
      lpr: "11-111-11",
      cameraId: "11",
      direction: "in",
      vehicleType: "car",
      "dateTime": "2018-09-25T03:18:02.300Z"
    }
  });
  console.log(response);
}

load();

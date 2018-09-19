import casual from 'casual';
import moment from 'moment';
import momentRandom from 'moment-random';
import client from './connection';

const vehicleTypes = ['car', 'truck', 'motorbike', 'bus'];

// Populate array of place licences
const vehicles = [];
for(let i=0; i<100; i++) {
  const a1 = ("00" + casual.integer(0, 99)).slice(-2);
  const a2 = ("000" + casual.integer(0, 999)).slice(-3);
  const a3 = ("00" + casual.integer(0, 99)).slice(-2);
  const lpr = a1.concat('-', a2).concat('-', a3)
  vehicles.push({
    type: casual.random_element(vehicleTypes),
    lpr: lpr
  });
};

const cameraIds = ['10', '11', '21', '22'];

let bulk = [];

const startDate = moment('01/09/2018T00:00:00', 'DD/MM/YYYY');
const endDate = moment();

const directions = ['in', 'out'];

let record = {
  cameraId: casual.random_element(cameraIds),
  lpr: casual.random_element(vehicles).lpr,
  direction: casual.random_element(directions),
  vehicleType: casual.random_element(vehicles).type,
  dateTime: momentRandom(endDate ,startDate)
//   dayOfWeek: dayOfweek
}

 console.log(record);

 bulk.push(
   { index: {_index: 'snaps', _type: 'snap' } },
   record);

 client.bulk({
   index: 'snaps',
   type: 'snap',
   timeout: '10m',
   body: bulk
 }, (err, resp, status) => {

       if( err ) {
         console.error('Error: ' + err);
       } else {

         console.log('Indexed: ' + resp.items.length);
         console.log('Status: ' + status);

       }

 });

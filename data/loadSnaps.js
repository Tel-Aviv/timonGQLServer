import casual from 'casual';
import { Subject } from "rxjs";
import moment from 'moment';
import momentRandom from 'moment-random';

import mySQLSubscriber from './mySQLSubscriber';
import esSubscriber from './esSubscriber';

import regionData from '../data/regions.json';
import clustersData from '../data/clusters.json';

const startDate = moment('01/10/2018T00:00:00', 'DD/MM/YYYY');
const endDate = moment();

const vehicleTypes = ['car', 'truck', 'motorbike', 'bus'];
const directions = ['in', 'out'];

const externalCameraIds = [];
clustersData.clusters.map( cluster => {
   cluster.cameras.map(camera => {
      externalCameraIds.push(camera.id);
   })
});

const cameraIds = [];
regionData.regions.map( region => {
    region.cameras.map( camera => {
      cameraIds.push(camera.id);
    })
});

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

const subject = new Subject();

subject.subscribe(mySQLSubscriber);
subject.subscribe(esSubscriber);

setInterval(() => {

  // console.log(moment());

  const lpr = casual.random_element(vehicles).lpr;
  const vehicleType = casual.random_element(vehicles).type;
  const direction = casual.random_element(directions);
  let cameraId = casual.random_element(externalCameraIds);
  let dt = momentRandom(endDate ,startDate);

  let record = {
    cameraId: cameraId,
    lpr: lpr,
    direction: direction,
    vehicleType: vehicleType,
    dateTime: dt.format('YYYY-MM-DDTHH:mm:ss')
  };

  subject.next(record);

  // same lpr, but different time within same date
  cameraId = casual.random_element(cameraIds);
  dt = momentRandom(dt.clone().endOf('day'), dt);
  let record2 = {
    cameraId: cameraId,
    lpr: lpr,
    direction: direction,
    vehicleType: vehicleType,
    dateTime: dt.format('YYYY-MM-DDTHH:mm:ss')
  };
  subject.next(record2);

}, 50);

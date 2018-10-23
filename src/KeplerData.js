// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import _ from 'lodash';
import fs from 'fs';
import streamToPromise from 'stream-to-promise';
import csv from 'fast-csv';
import ip from 'ip';
// var os = require("os");
// var dns = require("dns");
// const util = require('util');
import regionsData from '../data/regions.json';
import clustersData from '../data/clusters.json';

const externalCameras = _.flatten(clustersData.clusters.map( cluster =>
      cluster.cameras
));

const internalCameras = _.flatten(regionsData.regions.map( region => {
  return region.cameras
}));

class KeplerData {

  from: Date
  till: Date

  constructor(from: Date, till: Date) {
    this.from = from;
    this.till = till;
  }

  async getSnaps() {

    const requestBody = ::this.requestBodySearch();

    try {

      let snaps = [];

      let response = await client.search({
          index: 'snaps',
          size: 2000,
          scroll: '10s',
          body: requestBody.toJSON()
      })

      while( response.hits.total !== snaps.length ) {
        snaps = [...snaps, ...response.hits.hits];

        response = await client.scroll({
            scrollId: response._scroll_id,
            scroll: '10s'
        });

      }

      return snaps;

    } catch( err ) {
        console.error(err);
        throw err;
    }

  }

  requestBodySearch() {

    const _from = moment(this.from, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _till = moment(this.till, 'DD/MM/YYYY').format('YYYY-MM-DD');

    return esb.requestBodySearch()
          .query(
              esb.rangeQuery('dateTime')
                  .gte(_from)
                  .lte(_till)
          )
          .sort(esb.sort('lpr', 'asc'))
          .sort(esb.sort('dateTime', 'asc'));

  }

  // Create csv file in 'data' directory.
  // That file will be accessed by HTTP GET
  async processSnaps(snaps) {

    const _from = moment(this.from, 'DD/MM/YYYY').format('DD_MM_YYYY');
    const _till = moment(this.till, 'DD/MM/YYYY').format('DD_MM_YYYY');

    const fileName = `/data/snaps_${_from}_${_till}.csv`;

    var csvStream = csv.createWriteStream({headers: true}),
        writableStream = fs.createWriteStream('.' + fileName);

    streamToPromise(writableStream).then( () => {
      console.log('Kepler file is written');
    })

    // writableStream.on("finish", function(){
    //   console.log("DONE!");
    // });

    csvStream.pipe(writableStream);

    while( snaps.length  > 1 )  {
      const snap  = snaps.shift()._source;
      const exCamera = externalCameras.find( camera => {
        return camera.id === snap.cameraId
      });

      const snap2 = snaps.shift()._source;
      if( snap.lpr === snap2.lpr ) {

        const inCamera = internalCameras.find( camera => {
          return camera.id === snap2.cameraId
        });

        if( exCamera && inCamera ) {

          csvStream.write({
                            first_camera_id: snap.cameraId,
                            snap_datetime: snap.dateTime,
                            first_camera_lat: exCamera.location.lat,
                            first_camera_lon: exCamera.location.lon,
                            second_camera_id: snap2.cameraId,
                            snap2_datetime: snap2.dateTime,
                            second_camera_lat: inCamera.location.lat,
                            second_camera_lon: inCamera.location.lon,
                            vehicle_type: snap.vehicleType,
                            lpr: snap.lpr
                          });
        }

      }
    }

    csvStream.end();

    const hostname = ip.address();

    // const hostname = os.hostname();
    //
    // try {
    //   const dnsResolve = util.promisify(dns.resolveAny);
    //   const records = await dnsResolve(hostname);
    //   console.log(records);
    // } catch( err ) {
    //   console.error(err);
    //   var ifaces = os.networkInterfaces();
    //
    //   for (var devName in ifaces) {
    //     var iface = ifaces[devName];
    //     if( iface.family === 'IPv4' ) {
    //       hostname = iface.address;
    //     }
    //     console.log(iface);
    //   }
    // }

    // return `http://${records[0]}:4000${fileName}`;
    return `http://${hostname}:4000${fileName}`;
  }

  async getUrl() {

    try {

      const snaps = await ::this.getSnaps();
      return ::this.processSnaps(snaps);

    } catch( err ) {
      return Promise.reject(err);
    }

  }

};

export default KeplerData;

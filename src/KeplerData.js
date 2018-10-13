// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import fs from 'fs';
import csv from 'fast-csv';
var os = require("os");
var dns = require("dns");
const util = require('util');

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

    const fileName = `./data/snaps_${_from}_${_till}.csv`;

    var csvStream = csv.createWriteStream({headers: true}),
        writableStream = fs.createWriteStream(fileName);

    writableStream.on("finish", function(){
      console.log("DONE!");
    });

    csvStream.pipe(writableStream);

    while( snaps.length - 2 )  {
      const snap  = snaps.shift()._source;
      const snap2 = snaps.shift()._source;

      if( snap.lpr === snap2.lpr ) {
        csvStream.write({
                          first_camera_id: snap.cameraId,
                          snap_datetime: snap.dateTime,
                          second_camera_id: snap2.cameraId,
                          snap2_datetime: snap2.dateTime,
                          vehicle_type: snap.vehicleType,
                          lpr: snap.lpr
                        });
      }
    }

    csvStream.end();

    const hostname = os.hostname();
    const dnsResolve = util.promisify(dns.resolve);
    const records = await dnsResolve(hostname, 'A');
    //console.log(records);

    return `http://${records[0]}:4000/data/tlv-trips.csv`;
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

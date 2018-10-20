// @flow
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
import esb from 'elastic-builder';
import _ from 'lodash';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Intersection from './Intersection.js';
import regionsData from '../data/regions.json';
import clustersData from '../data/clusters.json';

function getCluster(cameraId: number){

  return clustersData.clusters.find( cluster => (
    cluster.cameras.find( camera => ( camera.id === cameraId ) )
  ));

};

const externalCameraIds = _.flatten(clustersData.clusters.map( cluster =>
      cluster.cameras.map( camera => camera.id )
));

class IntersectionDistribution {

    regionId: number
    direction: string
    from: Date
    till: Date

    constructor(regionId: number,
                direction: string,
                from: Date,
                till: Date) {
      this.regionId = regionId;
      this.direction = direction;
      this.from = from;
      this.till = till;
    }

    async getSnaps(camerasIds: [number]) {

      const requestBody = ::this.requestBodySearch(camerasIds);

      try {

        let snaps = [];

        let response = await client.search({
          index: 'snaps',
          type: 'doc',
          _source: ["dateTime", "lpr", "cameraId"],
          scroll: '60s',
          size: 2000,
          body: requestBody.toJSON()
        });

        while( response.hits.total !== snaps.length ) {

          snaps = [...snaps, ...response.hits.hits];

          response = await client.scroll({
              scrollId: response._scroll_id,
              scroll: '60s'
          });

        };

        return snaps;

      } catch( err ) {
        console.error(err);
        throw err;
      }
    }

    requestBodySearch(cameraIds: [number]) {

      const _from = moment(this.from, 'DD/MM/YYYY').format('YYYY-MM-DD');
      const _till = moment(this.till, 'DD/MM/YYYY').format('YYYY-MM-DD');
      const _direction = this.direction;

      return esb.requestBodySearch()
      .query(
        esb.boolQuery()
        .must([
          esb.termQuery('direction', _direction),
        ])
        .filter([
            esb.termsQuery('cameraId', cameraIds),
            esb.rangeQuery('dateTime')
                  .gte(_from)
                  .lt(_till)

        ])
      )
      .sort(esb.sort('lpr', 'asc'))
      .sort(esb.sort('dateTime', 'asc'));

    }

    calcOutDistribution(snaps, cameraId) {

      const clusters = [0, // totals
                       0,0,0,0]; // other clusters

      while( snaps.length - 1 )  { // neglect last snap in favor of non-checking length

        let snap = snaps.shift();
        if( snap._source.cameraId == cameraId ) {
          let snap2 = snaps.shift();
          const cluster = getCluster(snap2._source.cameraId);
          if( cluster ) {
            clusters[0]++; // totals
            clusters[cluster.id]++;
          } else {
            snaps.unshift(snap2);
          }
        }

      }

      return clusters;

    }

    _calcOutDistribution(snaps, cameraId) {

        const clusters = [0, // totals
                         0,0,0,0]; // other clusters

        for(let i = 0; i < snaps.length - 1; // neglect last snap in favor of non-checking length
            i++) {

          if( snaps[i]._source.cameraId == cameraId ) {
            const cluster = getCluster(snaps[i+1]._source.cameraId);
            if( cluster ) {
                clusters[0]++; // totals
                clusters[cluster.id]++;
            }
          } else {
            continue;
          }

        }

        return clusters;

    }

    calcInDistribution(snaps, cameraId) {

      const clusters = [0, // totals
                       0,0,0,0]; // other clusters

      while( snaps.length - 1 )  { // neglect last snap in favor of non-checking length

        let snap = snaps.shift();
        const cluster = getCluster(snap._source.cameraId);
        if( cluster ) {
          let snap2 = snaps.shift();
          if( snap2._source.cameraId == cameraId ) {
            clusters[0]++; // totals
            clusters[cluster.id]++;
          } else {
            snaps.unshift(snap2);
          }
        }

      }

      return clusters;

    }

    _calcInDistribution(snaps, cameraId) {

      const clusters = [0, // totals
                       0,0,0,0]; // other clusters

      for(let i = 0; i < snaps.length - 1; // neglect last snap in favor of non-checking length
          i++) {
        const cluster = getCluster(snaps[i]._source.cameraId);
        if( cluster ) {

          if( snaps[i+1]._source.cameraId == cameraId ) {
            clusters[0]++; // totals
            clusters[cluster.id]++;
          }

        } else {
          continue; // no pair for this external camera
        }

      }

      return clusters;

    }

    async execute() {

      let region = regionsData.regions.find( _region => {
        return _region.id == this.regionId
      });

      const promises = region.cameras.map( async(camera) => {

          try {
            const cameraId = parseInt(camera.id, 10);
            const camerasIds = [...externalCameraIds, cameraId];

            const snaps = await ::this.getSnaps(camerasIds);
            const clusters = ( this.direction === 'IN' ) ?
                            ::this._calcInDistribution(snaps, cameraId) :
                            ::this._calcOutDistribution(snaps, cameraId);

            let [total, southCluster, northCluster, eastCluster, westCluster] = clusters;

            return new Intersection(camera.name, total, northCluster, southCluster,
                            eastCluster, westCluster);

          } catch( err ) {
            return Promise.reject(err);
          }

      });

      return await Promise.all(promises);
    }
};

export default IntersectionDistribution;

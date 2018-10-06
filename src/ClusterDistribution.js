// @flow
import esb from 'elastic-builder';
import _ from 'lodash';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Gate from './Gate.js';
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

class ClusterDistribution {

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
          scroll: '10s',
          size: 2000,
          body: requestBody.toJSON()
        });

        while( response.hits.total !== snaps.length ) {

          snaps = [...snaps, ...response.hits.hits];

          response = await client.scroll({
              scrollId: response._scroll_id,
              scroll: '10s'
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
      .sort(esb.sort('dateTime', 'asc'));;


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

            let [total, southCluster, northCluster, eastCluster, westCluster] = clusters;

            return new Gate(camera.name, total, northCluster, southCluster,
                            eastCluster, westCluster);

          } catch( err ) {
            return Promise.reject(err);
          }

      });

      return await Promise.all(promises);
    }
};

export default ClusterDistribution;

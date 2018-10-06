// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Gate from './Gate.js';
import regionsData from '../data/regions.json';
import clustersData from '../data/clusters.json';
import casual from 'casual';

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

        const snaps = [];

        let response = await client.search({
          index: 'snaps',
          type: 'doc',
          scroll: '10s',
          size: 2000,
          body: requestBody.toJSON()
        });

        while( response.hits.total !== snaps.length ) {

          snaps.push(...response.hits.hits);

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
      );


    }

    async execute() {

      let region = regionsData.regions.find( _region => {
        return _region.id == this.regionId
      });

      let externalCameraIds = [99010, 99011, 99020, 99021, 99022, 99030]; // TBD
      const promises = region.cameras.map( async(camera) => {

          try {
            const cameraId = parseInt(camera.id, 10);
            const camerasIds = [...externalCameraIds, cameraId];

            const snaps = await ::this.getSnaps(camerasIds);

            const total = snaps.length;
            const northCluster = casual.integer(50000, 70000);
            const southCluster = casual.integer(50000, 70000);
            const eastCluster = casual.integer(50000, 70000);
            const westCluster = 0;

            return new Gate(camera.name, total, northCluster, southCluster,
                            eastCluster, westCluster);

          } catch( err ) {
            return Promise.reject(err);
          }

      });
      return await Promise.all(promises);
      //console.log(gates);

      // let gates = [];
      // const promises = cameras.map( async(camera) => {
      //
      //   const cameraId = parseInt(camera.id, 10);
      //   let totalExternalCameras = [];
      //
      //   // North cluster ( index 1 in clusterData array)
      //   let externalCameras = clustersData.clusters[1].cameras.map( c => parseInt(c.id, 10) );
      //   let cameraIds = [...externalCameras, cameraId];
      //   totalExternalCameras = [...totalExternalCameras, ...externalCameras, cameraId];
      //
      //
      //   const northCluster = await ::this.getHits(cameraIds);
      //
      //   // South cluster ( index 0 in clusterData array)
      //   externalCameras = clustersData.clusters[0].cameras.map( c => parseInt(c.id, 10) );
      //   cameraIds = [...externalCameras, cameraId];
      //   totalExternalCameras = [...totalExternalCameras, ...externalCameras];
      //   const southCluster = await ::this.getHits(cameraIds);
      //
      //   // East cluster ( index 2 in clusterData array)
      //   externalCameras = clustersData.clusters[2].cameras.map( c => parseInt(c.id, 10) );
      //   cameraIds = [...externalCameras, cameraId];
      //   totalExternalCameras = [...totalExternalCameras, ...externalCameras];
      //   const eastCluster = await ::this.getHits(cameraIds);
      //
      //   const total = await ::this.getHits(totalExternalCameras);
      //
      //   // West cluster
      //   let westCluster = 0;
      //
      //   const gate = new Gate(camera.name, total, northCluster, southCluster,
      //                         eastCluster, westCluster);
      //   gates = [...gates, gate];
      //
      //
      // });
      //
      // await Promise.all(promises);

      //return gates;
    }
};
export default ClusterDistribution;

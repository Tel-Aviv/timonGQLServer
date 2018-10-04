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

    async getHits(cameraIds: [number]) {

      const requestBody = ::this.requestBodySearch(cameraIds);

      const response = await client.search({
        index: 'snaps',
        type: 'snap',
        "size": 0, // omit hits from output
        body: requestBody.toJSON()
      });
      //console.log(response);
      return response.hits.total;
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

      const cameras = [];
      region.cameras.map( camera => {
        cameras.push(camera);
      });

      let gates = [];

      const promises = cameras.map( async(camera) => {

        const cameraId = parseInt(camera.id, 10);
        let totalExternalCameras = [];

        // North cluster ( index 1 in clusterData array)
        let externalCameras = clustersData.clusters[1].cameras.map( c => parseInt(c.id, 10) );
        let cameraIds = [...externalCameras, cameraId];
        totalExternalCameras = [...totalExternalCameras, ...externalCameras, cameraId];
        const northCluster = await ::this.getHits(cameraIds);

        // South cluster ( index 0 in clusterData array)
        externalCameras = clustersData.clusters[0].cameras.map( c => parseInt(c.id, 10) );
        cameraIds = [...externalCameras, cameraId];
        totalExternalCameras = [...totalExternalCameras, ...externalCameras];
        const southCluster = await ::this.getHits(cameraIds);

        // East cluster ( index 2 in clusterData array)
        externalCameras = clustersData.clusters[2].cameras.map( c => parseInt(c.id, 10) );
        cameraIds = [...externalCameras, cameraId];
        totalExternalCameras = [...totalExternalCameras, ...externalCameras];
        const eastCluster = await ::this.getHits(cameraIds);

        const total = await ::this.getHits(totalExternalCameras);

        // West cluster
        let westCluster = 0;

        const gate = new Gate(camera.name, total, northCluster, southCluster,
                              eastCluster, westCluster);
        gates = [...gates, gate];


      });

      await Promise.all(promises);

      return gates;
    }
};
export default ClusterDistribution;

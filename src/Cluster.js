// @flow
import casual from 'casual';
import moment from 'moment';
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';


class Cluster {

  id: string
  clusterId: number
  name: string
  cameras: [any]

  constructor( clusterId: number,
               name: string,
               cameras: [any]) {

    this.id = casual.uuid;
    this.clusterId = clusterId;
    this.name = name;
    this.cameras = cameras;
  }

  execute(from: Date, till: Date, direction: String, all: boolean) {

    const _from = moment(from, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _till = moment(till, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _cameraIds = this.cameras.map(c => c.cameraId )

    const requestBody = esb.requestBodySearch()
    .query(
      esb.boolQuery()
        .must(
                esb.matchQuery("direction", direction),
              )
        .filter([
                  esb.termsQuery("cameraId", _cameraIds),
                  esb.rangeQuery('dateTime')
                    .gte(_from)
                    .lt(_till)
              ])
    );

    let query = requestBody.toJSON();
    return client.search({
      index: 'snaps',
      size: 0,
      body: query
    }).then( response => {
      return response.hits.total;
    });
  };
};

export default Cluster;

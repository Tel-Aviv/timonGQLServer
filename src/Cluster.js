// @flow
import casual from 'casual';
import moment from 'moment';
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';

import Gate from './Gate';

class Cluster {

  id: String
  clusterId: number
  name: string
  cameras: [number]

  constructor( clusterId: number,
               name: string,
               cameras: [number]) {

    this.id = casual.uuid;
    this.clusterId = clusterId;
    this.name = name;
    this.cameras = cameras;
  }

  execute(from: Date, till: Date) {

    const _from = moment(from, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _till = moment(till, 'DD/MM/YYYY').format('YYYY-MM-DD');

    const requestBody = esb.requestBodySearch()
    .query(
      esb.boolQuery()
        .must(
                esb.matchQuery("direction", "IN"),
              )
        .filter([
                  esb.termsQuery("cameraId", this.cameras),
                  esb.rangeQuery('dateTime')
                    .gte(_from)
                    .lt(_till)
              ])
    );

  //console.log(JSON.stringify(query));

  // return client.search({
  //   index: 'snaps',
  //   size: 0, // omit hits from output
  //   body: query
  // }).then( response => {
  //
  //   //console.log(response.aggregations.myAgg.buckets);
  //
  //   const labels = [];
  //   const values = [];
  //   const serie = [];
  //
  //   response.aggregations.myAgg.buckets.map( doc => {
  //     labels.push(doc.key);
  //     serie.push(doc.doc_count);
  //   });
  //
  //   values.push(serie);

    return casual.integer(20000, 70000);
  };
};

export default Cluster;

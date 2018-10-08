// @flow
import casual from 'casual';
import moment from 'moment';
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';

class Gate {

  id: string

  cameraId: number
  name: string

  constructor({cameraId, name}) {

      this.id = casual.uuid;
      this.name = name;
      this.cameraId = cameraId;
  }

  execute(from: Date, till: Date, direction: String) {

    const _from = moment(from, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _till = moment(till, 'DD/MM/YYYY').format('YYYY-MM-DD');


    const requestBody = esb.requestBodySearch()
    .query(
      esb.boolQuery()
        .must(
                esb.matchQuery("direction", direction),
              )
        .filter([
                  esb.termsQuery("cameraId", this.cameraId),
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
  
    // response.aggregations.cameras.buckets.map( doc => {

    // });
  

  };
};

export default Gate;

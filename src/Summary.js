// @flow
import esb from 'elastic-builder';
import moment from 'moment';
import casual from 'casual';
import client from '../elasticsearch/connection.js';
import regionsData from '../data/regions.json';

class Summary {

  id: string
  regionId: number
  from: Date
  till: Date
  kind: string

  constructor(regionId: number,
              from: Date,
              till: Date,
              kind: string) {
    this.id = casual.uuid;
    this.regionId = regionId;
    this.from = from;
    this.till = till;
    this.kind = kind;
  }

  value() {

    const regionId = this.regionId;
    let region = regionsData.regions.find( _region => {
      return _region.id == regionId
    });

    const cameraIds = [];
    region.cameras.map( camera => {
      cameraIds.push(camera.id);
    });

    const _from = moment(this.from, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _till = moment(this.till, 'DD/MM/YYYY').format('YYYY-MM-DD');

    const requestBody = esb.requestBodySearch()
      .query(
        esb.boolQuery()
          .must(
                  esb.matchQuery("direction", this.kind),
                )
          .filter([
                    esb.termsQuery("cameraId", cameraIds),
                    esb.rangeQuery('dateTime')
                      .gte(_from)
                      .lt(_till)
                ])
      );


    return client.search({
      index: 'snaps',
      type: 'snap',
      body: requestBody.toJSON()
    }).then( response => {
      return response.hits.total;
    });
  }

};

export default Summary;

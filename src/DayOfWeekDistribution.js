// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Serie from './Serie.js';
import regionsData from '../data/regions.json';

class DayOfWeekDistribution {

  regionId: number
  from: Date
  till: Date

  constructor(regionId: number,
                from: Date,
                till: Date) {
    this.regionId = regionId;
    this.from = from;
    this.till = till;
  }

  async execute() {

    let region = regionsData.regions.find( _region => {
      return _region.id == this.regionId
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
          .filter([
                    esb.termsQuery("cameraId", cameraIds),
                    esb.rangeQuery('dateTime')
                      .gte(_from)
                      .lt(_till)
                ])
      );
      // Add aggregation clause 'manually'
      // because it seems the elastic-builder barely supports
      // scripts within aggregations
      let query = requestBody.toJSON();
      query.aggs = JSON.parse(`{
        "myAgg": {
          "terms": {
            "script": {
              "lang": "painless",
              "source": "doc['dateTime'].value.toString('E')"
            }
          },
          "aggs": {
            "directions": {
              "terms": {
                "field": "direction"
                }
            }
          }
        }
      }`);

    // console.log(JSON.stringify(query));

    try {

    const response = await client.search({
      index: 'snaps',
      size: 0, // omit hits from output
      body: query
    });

      //console.log(response.aggregations.myAgg.buckets);

      const labels = [];
      const values = [];
      const ins = [];
      const outs = [];
      const orderDocs = [];
      let docsByDay = {};
      let dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      response.aggregations.myAgg.buckets.map( (doc,  index)=> {
        docsByDay[doc.key] = doc;
      });

      dayOfWeek.forEach(day => {
        orderDocs.push(docsByDay[day]);
      });

      orderDocs.forEach( (doc, index) => {

        if( doc && doc.directions ) {
          labels.push(dayOfWeek[index]);
          doc.directions.buckets.map((_doc) => {
            if (_doc.key === 'in')
              ins.push(_doc.doc_count);
            if (_doc.key === 'out')
              outs.push(_doc.doc_count)
          })
        }
      });

      values.push(ins);
      values.push(outs);
      return new Serie(labels, values);

    } catch ( err ) {
      console.error(err);
      throw err;
    }

  }

};

export default DayOfWeekDistribution;

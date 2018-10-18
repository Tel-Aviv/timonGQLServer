// @flow
import esb from 'elastic-builder';
import moment from 'moment';
import client from '../elasticsearch/connection.js';
import regionsData from '../data/regions.json';
import Serie from './Serie.js';

class HourlyDistribution {

  regionId: number
  date: moment

  constructor(regionId: number,
              date: moment) {
    this.regionId = regionId;
    this.date = date;
  }

  execute() {

    const regionId = this.regionId;
    let region = regionsData.regions.find( _region => {
      return _region.id == regionId
    });

    const cameraIds = [];
    region.cameras.map( camera => {
      cameraIds.push(camera.id);
    });

    const _from = this.date.format('YYYY-MM-DD');
    const _till = this.date.clone().add(1, 'day').format('YYYY-MM-DD');

    const series = [];

    const requestBody = esb.requestBodySearch()
    .query(
      esb.boolQuery()
        .must(
                esb.matchQuery("direction", 'IN'),
              )
        .filter([
                    esb.termsQuery("cameraId", cameraIds),
                    esb.rangeQuery('dateTime')
                      .gte(_from)
                      .lt(_till)
                ])

    )
    .agg(
      esb.dateHistogramAggregation(
                  'histo',
                  'dateTime',
                  '1h'
              ).timeZone('+03:00')
    )

    return client.search({
      size: 0,
      index: 'snaps',
      body: requestBody.toJSON()
    }).then( response => {

      const labels = [];
      const serieValues = [];

      response.aggregations.histo.buckets.map( bucket => {
          const label = moment(bucket.key_as_string).format('hh:mm');
          labels.push(label);
          serieValues.push(bucket.doc_count);
      });

      const values = [];
      values.push(serieValues);

      series.push(new Serie(labels,values));
      return series;
    });

  }

};

export default HourlyDistribution;

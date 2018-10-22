// @flow
import esb from 'elastic-builder';
import moment from 'moment';
import numeral from 'numeral';
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

  async execute() {

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

    var offset = (moment().utcOffset())/60;
    var _offset = numeral(offset).format('+00');

    const requestBody = esb.requestBodySearch()
    .query(
      esb.boolQuery()
        .filter([
                    esb.termsQuery("cameraId", cameraIds),
                    esb.rangeQuery('dateTime')
                      .gte(_from)
                      .lt(_till)
                      .timeZone(`${_offset}:00`)
                ])

    )
    .agg(
        esb.dateHistogramAggregation('histo', 'dateTime', '1H')
        .agg(
            esb.termsAggregation('directions', 'direction')
        )
    )

    const response = await client.search({
      size: 0,
      index: 'snaps',
      body: requestBody.toJSON()
    });

    const labels = [];
    const ins = [];
    const outs = [];

    response.aggregations.histo.buckets.map( bucket => {
        const label = moment(bucket.key_as_string).format('HH:mm');
        labels.push(label);
        bucket.directions.buckets.map((_doc) => {
          if (_doc.key === 'in')
            ins.push(_doc.doc_count);
          else if (_doc.key === 'out')
            outs.push(_doc.doc_count)
        })
    });

    const values = [];
    values.push(ins);
    values.push(outs);

    series.push(new Serie(labels,values));
    return series;

  }

};

export default HourlyDistribution;

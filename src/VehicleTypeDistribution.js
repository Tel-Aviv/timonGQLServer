// @flow
import 'babel-polyfill';
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import SingleSerie from './SingleSerie';

class VehicleTypeDistribution {

  regionId: number
  date: moment

  constructor(regionId: number,
              date: moment) {
    this.regionId = regionId;
    this.date = date;
  }

  async execute() {

    try {

      if( !this.date.isValid() ) {
        throw Error(`Invalid date`);
      }

      const _from = this.date.format('YYYY-MM-DD');
      const _till = this.date.clone().add(1, 'day').format('YYYY-MM-DD');
      // console.log(`From ${_from} till ${_till}`);

      const requestBody = esb.requestBodySearch()
        .query(
            esb.rangeQuery('dateTime')
                .gte(_from)
                .lt(_till)
        )
        .agg(
          esb.termsAggregation('types', 'vehicleType')
        );


      const response = await client.search({
        index: 'snaps',
        size: 0,
        body: requestBody.toJSON()
      });

      const labels = [];
      const values = [];
      response.aggregations.types.buckets.map( bucket => {
        labels.push(bucket.key);
        values.push(bucket.doc_count);
      });

      return new SingleSerie(labels,values);

    } catch( err ) {
      console.log(err);
    }

  }

};

export default VehicleTypeDistribution;

// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Serie from './Serie';

class VehicleTypeDistribution {

  regionId: number
  date: Date

  constructor(regionId: number,
              date: Date) {
    this.regionId = regionId;
    this.date = date;
  }

  execute() {

    const labels = ['cars', 'tracks', 'buses'];
    const values = [[34, 209, 33]];
    return new Serie(labels,values);
  }

};

export default VehicleTypeDistribution;

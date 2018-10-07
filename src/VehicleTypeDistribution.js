// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import SingleSerie from './SingleSerie';

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
    const values = [34, 209, 33];
    return new SingleSerie(labels,values);
  }

};

export default VehicleTypeDistribution;

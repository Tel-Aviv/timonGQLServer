// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Serie from './Serie.js';

class HourlyDistribution {

  regionId: number
  date: Date

  constructor(regionId: number,
              date: Date) {
    this.regionId = regionId;
    this.date = date;
  }

  execute() {

    const series = [];

    const labels = ['01:00', '02:00'];
    const values = [[34, 209]];
    series.push(new Serie(labels,values));

    return series;
  }

};

export default HourlyDistribution;

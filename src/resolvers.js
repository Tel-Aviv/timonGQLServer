// @flow
import { ApolloError } from 'apollo-server';
import assign from 'lodash.assign';
import moment from 'moment';
import esb from 'elastic-builder';
import casual from 'casual';
import client from '../elasticsearch/connection.js';

import VehicleTypeDistribution from  './VehicleTypeDistribution';
import HourlyDistribution from './HourlyDistribution';
import DayOfWeekDistribution from './DayOfWeekDistribution';
import FrequencyDistribution from './FrequencyDistribution';
import IntersectionDistribution from './IntersectionDistribution';
import LagsDistribution from './LagsDistribution';
import Summary from '../src/Summary';
import Serie from '../src/Serie';

import regionsData from '../data/regions.json';

export let resolvers = {
  Query: {
    region: (_: any, {regionId}: {regionId: number}) => {

      let region = regionsData.regions.find( _region => {
        return _region.id == regionId
      });
      if( region === undefined) {
        throw new ApolloError(`No region with id ${regionId}`, 1001);
      }

      // Without assign, we'll deal with real object found in data array
      let _region = assign({}, region); // lodash implied

      const cameras = region.cameras.map( (camera) => {
        return {
          id: casual.uuid,
          name: camera.name,
          cameraId: camera.id,
          location:  {
            lat: camera.lat,
            lon: camera.lon
          }
        }
      });
      _region.regionId = region.id;
      _region.cameras = cameras;
      _region.id = casual.uuid;

      return _region;
    },
    regions: () => {
      const _regions = [];
      regionsData.regions.map( (region,index) => {
        _regions.push({
          id: region.id,
          name: region.name,
          center: region.center
        });
      });
      return _regions;
    }
  },
  Region: {
    summary(region, {from, till, kind} : {from: Date, till: Date, kind: string} ) {
      return new Summary(region.regionId, from, till, kind);
    },
    summaries(region, {from, till} : {from: Date, till: Date} ): Summary[] {

      const regionId = region.regionId;
      let _summaries: Summary[] = [];
      _summaries.push(new Summary(regionId, from, till, "IN"));
      _summaries.push(new Summary(regionId, from, till, "OUT"));
      _summaries.push(new Summary(regionId, from, till, "CROSS"));
      _summaries.push(new Summary(regionId, from, till, "PASSENGERS"));
      return _summaries;

    },
    hourlyDistribution(region, date: Date): Serie[] {
      return new HourlyDistribution(region.regionId, date)
                .execute();
    },
    vehicleTypeDistribution(region, date: Date): Serie {
      return new VehicleTypeDistribution(region.regionId, date)
                .execute();
    },
    dayOfWeekDisrtibution(region, {from, till} : {from: Date, till: Date} ) : Serie {

      return new DayOfWeekDistribution(region.regionId, from, till)
                 .execute();
    },
    frequencyDistribution(region, {from, till} : {from: Date, till: Date} ) : Promise<Serie> {
      return new FrequencyDistribution(region.regionId, from, till)
                  .execute();
    },
    intersectionDistribution(region, {direction, from, till} : {direction: String, from: Date, till: Date} ) : [Gate] {
      try {
        return new IntersectionDistribution(region.regionId, direction, from, till)
                    .execute();
      } catch( err ) {
        throw new ApolloError(err);
      }
    },
    lagsDistribution(region, {from, till} : {from: Date, till: Date} ) : Serie {
      return new LagsDistribution(region.regionId, from, till)
                 .execute();
    }
  }
}

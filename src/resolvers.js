// @flow
import { ApolloError } from 'apollo-server';
import assign from 'lodash.assign';
import moment from 'moment';
import esb from 'elastic-builder';
import casual from 'casual';
import client from '../elasticsearch/connection.js';

import DayOfWeekDistribution from './DayOfWeekDistribution';
import FrequencyDistribution from './FrequencyDistribution';
import ClusterDistribution from './ClusterDistribution';
import LagsDistribution from './LagsDistribution';
import Summary from '../src/Summary';
import Serie from '../src/Serie';

import regionsData from '../data/regions.json';

export let resolvers = {
  Query: {
    region: (_, {regionId}: {regionId: number}) => {

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
    disrtibution(region, {from, till} : {from: Date, till: Date} ) : Serie {

      return new DayOfWeekDistribution(region.regionId, from, till)
                 .execute();
    },
    frequencyDistribution(region, {from, till} : {from: Date, till: Date} ) : Serie {
      return new FrequencyDistribution(region.regionId, from, till)
                  .execute();
    },
    clusterDistribution(region, {direction, from, till} : {direction: String, from: Date, till: Date} ) : [Gate] {
      return new ClusterDistribution(region.regionId, direction, from, till)
                  .execute();
    },
    lagsDistribution(region, {from, till} : {from: Date, till: Date} ) : Serie {
      return new LagsDistribution(region.regionId, from, till)
                 .execute();
    }
  }
}

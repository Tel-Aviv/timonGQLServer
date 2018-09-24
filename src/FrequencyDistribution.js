// @flow
import regionsData from '../data/regions.json';
import client from '../elasticsearch/connection.js';
import esb from 'elastic-builder';
import moment from 'moment';
import Serie from './Serie.js';

class FrequencyDistribution {

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

    // We are expecting large result-set produced during
    // ES queries in this method.
    // Especially, terms-aggregation for lprs used for the preparation
    // of more fine-grained results may consist of several thousand items.
    // Because the 'Scroll' technique provided by ES is not applied for aggregations,
    // we'll use partitioned queries for this purpose

    let region = regionsData.regions.find( _region => {
      return _region.id == this.regionId
    });

    const cameraIds = [];
    region.cameras.map( camera => {
      cameraIds.push(camera.id);
    });

    const _from = moment(this.from, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const _till = moment(this.till, 'DD/MM/YYYY').format('YYYY-MM-DD');

    // So. we are about to perform partitioned aggregation
    // See https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html#_filtering_values_with_partitions
    //
    // In order to do so, we need to calculate the number of _filtering_values_with_partitions
    // and the size of buckets i each partition
    let requestBody = esb.requestBodySearch()
                      .agg(esb.cardinalityAggregation('lprs', 'lpr.keyword'));
    let results = await client.search({
      index: 'snaps',
      type: 'snap',
      size: 0,
      body: requestBody.toJSON()
    });

    console.log(`Cardinality: ${results.aggregations.lprs.value}`);

    const totalPartitions = 10;
    const partitionSize = 200;

    requestBody = esb.requestBodySearch()
      .query(
        esb.boolQuery()
          .must(
                  esb.matchQuery("direction", "IN"),
                )
          .filter([
                    esb.termsQuery("cameraId", cameraIds),
                    esb.rangeQuery('dateTime')
                      .gte(_from)
                      .lt(_till)
                ])
      );

    let everyDayTotal = 0,
        onceAWeekTotal = 0,
        twiceAWeekTotal = 0

    for(let currentPartition = 0;
        currentPartition < totalPartitions;
        currentPartition++) {

      // Manually add terms aggregation with script
      let query = requestBody.toJSON();
      query.aggs = JSON.parse(`{
        "lprs": {
          "terms": {
            "field": "lpr.keyword",
            "include": {
              "partition": ${currentPartition},
              "num_partitions": ${totalPartitions}
            },
            "size": ${partitionSize}
          },
          "aggs": {
            "daily": {
              "terms": {
                "script": {
                  "lang": "painless",
                  "source": "doc['dateTime'].value.toString('E')"
                },
                "order": {
                  "_key": "asc"
                }
              },
              "aggs": {
                "dummy_average": {
                    "avg": {
                      "field": "cameraId"
                    }
                }
              }
            },
            "frequency": {
              "stats_bucket": {
                "buckets_path": "daily>dummy_average",
                "gap_policy": "skip"
              }
            }
          }
        }
      }`);

      // const _query = JSON.stringify(query)
      // console.log(_query);

      let response = await client.search({
        index: 'snaps',
        type: 'snap',
        body: query
      });

      console.log(`Current partition: ${currentPartition}. # Buckets: ${response.aggregations.lprs.buckets.length}`);

      const counts = response.aggregations.lprs.buckets.map( bucket => {
        return bucket.frequency.count
      })

      everyDayTotal += counts.filter( c => (
        c == 7
      )).length;

      onceAWeekTotal += counts.filter( c => (
        c == 1
      )).length;

      twiceAWeekTotal += counts.filter( c => (
        c == 1
      )).length;

    }

    const labels = ['everyday', 'onceAWeek', 'twiceAWeek'];
    const values = [
                    [everyDayTotal, onceAWeekTotal, twiceAWeekTotal]
                  ];

    return new Serie(labels, values);

  }

};

export default FrequencyDistribution;

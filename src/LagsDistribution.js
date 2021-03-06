// @flow
import esb from 'elastic-builder';
import client from '../elasticsearch/connection.js';
import moment from 'moment';
import Serie from './Serie.js';
import regionsData from '../data/regions.json';

class LagsDistribution {

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

    execute() {

          let region = regionsData.regions.find( _region => {
            return _region.id == this.regionId
          });

          const cameraIds = [21, 99010];
          // region.cameras.map( camera => {
          //   cameraIds.push(camera.id);
          // });

          const _from = moment(this.from, 'DD/MM/YYYY').format('YYYY-MM-DD');
          const _till = moment(this.till, 'DD/MM/YYYY').format('YYYY-MM-DD');

          const requestBody = esb.requestBodySearch()
                .query(
                    esb.boolQuery()
                        .must([
                            esb.termQuery('direction', 'in'),
                            //esb.matchQuery('lpr.keyword', '11-111-11')
                        ])
                        .filter([
                            esb.termsQuery("cameraId", cameraIds),
                            esb.rangeQuery('dateTime')
                                  .gte(_from)
                                  .lt(_till)
                            ]
                         )
                )
                .agg(esb.termsAggregation('lprs', 'lpr.keyword')
                        .minDocCount(2)
                    .agg(
                      esb.termsAggregation('cameras', 'cameraId')
                        .agg(
                            esb.dateHistogramAggregation('eventually','dateTime','1s')
                            .minDocCount(1)
                        )
                    )

                );

          let query = requestBody.toJSON();
          //console.log(JSON.stringify(query));

          return client.search({
            index: 'snaps',
            "size": 0, // omit hits from output
            body: query
          }).then( response => {

            //console.log(response.aggregations.lprs.buckets);

            const lprs = [];

            response.aggregations.lprs.buckets.map( vehicle => {

                let _vehicle = {
                  lpr: vehicle.key,
                  cameras: []
                }

                let _cameras = [];
                vehicle.cameras.buckets.map( camera => {

                  let _camera = {
                    id: camera.key,
                    snapTime: {}
                  };

                  camera.eventually.buckets.map( snap => {
                    _camera.snapTime = moment(snap.key_as_string);
                  });

                  _cameras.push(_camera);
                });
                _cameras.sort( (c1, c2) => {
                  return c1.snapTime - c2.snapTime;
                });
                let diff = _cameras.map( c => c.snapTime )
                        .reduce( (acc, curr, currIndex) => {
                  return moment.duration(acc.diff(curr));
                });
                _vehicle.cameras = _cameras;

            //   const events = bucket.eventually.buckets.map( b => {
            //       return moment(b.key_as_string);
            //   });
            //   let duration = events[1] - events[0];
            //   // let strDuration = moment.utc(duration).format("HH:mm:ss");
            //   // console.log(strDuration);
            //
            //   lprs.push({
            //     lpr: bucket.key,
            //     duration: duration
            //   });
            });

            // Calculate duration average for all lprs
            // let sum = 0;
            // sum = lprs.map( el => el.duration)
            //           .reduce( (first, second) => first + second )
            //           / lprs.length;
            // let avgDuration = moment.utc(sum).format("HH:mm:ss")

            const labels = ['Cluster1'];
            //const values = [avgDuration];
            const values = [44]; // measured in minutes

            return new Serie(labels, [values]);

          });

    }

}

export default LagsDistribution;

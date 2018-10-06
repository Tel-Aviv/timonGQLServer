// @flow
import elasticsearch from 'elasticsearch';

const esHost = 'localhost';// '10.1.72.183';
var elasticClient = new elasticsearch.Client({
  host: `${esHost}:9200`
});

module.exports = elasticClient;

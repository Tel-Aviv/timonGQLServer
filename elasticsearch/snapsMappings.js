import client from './connection.js';

client.indices.create({
    index: 'snaps',
    timeout: '10m',
    body: {
        "settings": {
          "max_result_window": "2000",
          "max_inner_result_window": "200",
          "analysis": {
            "normalizer": {
              "my_normalizer": {
                "type": "custom",
                "char_filter": [],
                "filter": ["lowercase", "asciifolding"]
              }
            }
          }
        }
    }
  }).then( resp => {
    console.log("Index created: ",resp);

    client.indices.putMapping({
    index: 'snaps',
    type: 'doc',
    timeout: '10m',
    body: {
            "properties": {
                "dateTime": {
                    "type": "date"
                },
                "cameraId": {
                    "type": "integer"
                },
                "lpr": {
                    "type": "keyword"
                },
                "vehicleType": {
                    "type": "keyword"
                },
                "direction": {
                    "type": "keyword",
                    "normalizer": "my_normalizer"
                }
            }
        }

    },
    function (err, resp, status) {
        if (err) {
        console.log(err);
        }
        else {
        console.log(resp);
        }
    }
    );

}). catch( err => {
    console.log(err);
  });

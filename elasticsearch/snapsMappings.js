import client from './connection.js';

client.indices.create({
    index: 'snaps',
    timeout: '10m',
    body: {
        "settings": {
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
    console.log("created: ",resp);

    client.indices.putMapping({
    index: 'snaps',
    type: 'snap',
    timeout: '10m',
    body: {
            "properties": {
                "dateTime": {
                    "type": "date"
                },
                "cameraId": {
                    "type": "keyword"
                },
                "LPR": {
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

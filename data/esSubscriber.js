import client from '../elasticsearch/connection';
import esb from 'elastic-builder';

const esSubscriber = async(snap) => {

  try {

    snap.date = snap.date.format('YYYY-MM-DDTHH:mm:ssZ')

    const response = await client.index({
      index: 'snaps',
      type: 'doc',
      body: snap
    });

    console.log(`ES response: ${response.result}`);

} catch( err ) {
  console.error(`ES error: ${err}`);
}
};

export default esSubscriber;

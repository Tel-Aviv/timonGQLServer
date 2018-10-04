import client from '../elasticsearch/connection';
import esb from 'elastic-builder';

const esSubscriber = async(snap) => {

  try {

    const response = await client.index({
      index: 'snaps',
      type: 'snap',
      body: snap
    });

<<<<<<< HEAD
    //console.log(`ES response: ${response.result}`);
=======
    console.log(`ES response: ${response.result}`);
>>>>>>> 7741a64a767533fa3184a87416c6ce0e59fcd827
} catch( err ) {
  console.error(`ES error: ${err}`);
}
};

export default esSubscriber;

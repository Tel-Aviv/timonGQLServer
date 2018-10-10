// @flow
import casual from 'casual';

type Location = {
  lat: number,
  lon: number
}

class Camera {

  id: string
  cameraId: number
  name: string
  location: Location

  constructor({id, name, location} :
              {id: number, name: string, location: Location}) {
    this.id = casual.uuid;
    this.cameraId = parseInt(id);
    this.name = name,
    this.location = location
  }

};

export default Camera;

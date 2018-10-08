// @flow
import casual from 'casual';

class Intersection {

  id: string
  cameraName: string
  Total: number
  NorthCluster: number
  SouthCluster: number
  EastCluster: number
  WestCluster: number

  constructor(cameraName: string,
              total: number,
              northCluster: number,
              southCluster: number,
              eastCluster: number,
              westCluster: number) {

      this.id = casual.uuid;
      this.cameraName = cameraName;
      this.Total = total;
      this.NorthCluster = northCluster;
      this.SouthCluster = southCluster;
      this.EastCluster = eastCluster;
      this.WestCluster = westCluster;
  }

};

export default Intersection;

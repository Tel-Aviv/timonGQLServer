// @flow

class Serie {

  labels: string[]
  values: number[][]

  constructor(labels: string[], values: number[][]) {
    this.labels = labels;
    this.values = values;
  }
}

export default Serie;

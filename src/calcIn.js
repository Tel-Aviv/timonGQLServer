// const { Worker, isMainThread,  workerData } = require('worker_threads');
const cluster = require('cluster');
const casual = require('casual');

console.log(`Worker ${process.pid} started`);

// 'process' refers to parent
process.on('message', (message) => {
  console.log(`Worker ${process.pid} recevies message '${message}'`);

  const arr = [];
  for(let i = 0; i< 3000000; i++)
  arr.push({
      val: casual.integer(0, 1000000),
      name: casual.name
  });
  arr.sort( (a,b) => {
    return a.val < b.val
  })

  let val = parseInt(message, 10);
  console.log(`Worker ${process.pid} sends message to master...`);

  process.send({ msg: val + 1 });

  // console.log(`Killing process ${process.pid}`);
  // process.kill(process.pid, '00');
  // console.log(`Worker ${process.pid} finished`);
});

// process.send({ msg: `Message from worker ${process.pid}` });

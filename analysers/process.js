const { spawn } = require('child_process');
const chalk = require('chalk');

let isProcessing = false;
let isTaskWaiting = false;

const handlePendingQueue = () => {
    return new Promise((resolve, reject) => {
        // If the process is already running, return early
        if (isProcessing) {
            console.log(chalk.green("Process is already running. Setting isTaskWaiting = true"))
            return;
        }

        // Set the flag to true
        isProcessing = true;

        // Spawn a new process for the CPU-intensive task
        const cpuIntensiveProcess = spawn('node', ['./analysers/match.js']);

        // Handle process events
        cpuIntensiveProcess.stdout.on('data', (data) => {
            console.log(chalk.green(`${data}`))
        });

        cpuIntensiveProcess.stderr.on('data', (data) => {
            console.log(chalk.green(`err: ${data}`))
        });

        cpuIntensiveProcess.on('close', (code) => {
            console.log(chalk.green(`Done processing pending matches`))

            // Set the flag to false when the process finishes
            isProcessing = false;

            // call itself again if isTaskWaiting = true
            if (isTaskWaiting) {
                isTaskWaiting = false;
                console.log(chalk.green("isTaskWaiting = true. calling handlePendingQueue()"))
                handlePendingQueue();
            }

            if (!isProcessing && !isTaskWaiting) {
                //TODO: we might not have data changed here. need to check
                //TODO: send notification to discord. At this point all data should be processed
                console.log(chalk.green('placeholder. send notification to discord. At this point all data should be processed'))
            }

            resolve(code); // Resolve the promise when the child process ends
        });

        cpuIntensiveProcess.on('error', (err) => {
            reject(err); // Reject the promise if there's an error
        });
    });
};


module.exports = handlePendingQueue
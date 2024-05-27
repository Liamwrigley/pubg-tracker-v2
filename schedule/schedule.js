const schedule = require('node-schedule');
const { spawn } = require('child_process');
const chalk = require('chalk');

const rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, 1); // Run every minute
rule.tz = 'Etc/UTC';

const scheduleJob = (loop = true) => {
    console.log(chalk.blue("scheduleJob"))

    return new Promise((resolve, reject) => {
        const job = schedule.scheduleJob(rule, () => {
            // Spawn a new process for the CPU-intensive task
            const cpuIntensiveProcess = spawn('node', ['./schedule/job.js']);

            cpuIntensiveProcess.stdout.on('data', (data) => {
                console.log(chalk.blue(`${data}`));
            });

            cpuIntensiveProcess.stderr.on('data', (data) => {
                console.log(chalk.blue(`${data}`));
            });

            cpuIntensiveProcess.on('close', (code) => {
                if (!loop) {
                    job.cancel(); // Cancel the job if loop is false
                }
                resolve(code); // Resolve the promise when the child process ends
            });

            cpuIntensiveProcess.on('error', (err) => {
                reject(err); // Reject the promise if there's an error
            });
        });
    });
};

module.exports = scheduleJob;
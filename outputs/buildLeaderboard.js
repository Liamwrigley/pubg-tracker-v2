const {
    createCanvas,
    loadImage
} = require('canvas');

const width = 900;
const columns = 2;
const padding = 50;
const imgURL = '../images/leaderboard'

exports.build_image = async (data) => {
    // load image and create canvas
    var canvas = createCanvas();
    var ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = (canvas.width / 4) * 3;

    // load background
    ctx.fillStyle = "white";
    let rand = Math.floor(Math.random() * 3) + 1
    const bg = await loadImage(`${imgURL}/bg${rand}.png`)
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    await getAllBoardStats(latestHistory(data)).forEach(async (b) => {
        await createSection(ctx, canvas, b)
    })
    addIssueNumber(ctx, canvas)
    return canvas.toBuffer();
}

const createSection = async (ctx, canvas, data) => {
    var row_pos = ((data.row + 1) * padding) + (data.row * 115)
    var col_pos = ((data.col + 1) * padding) + (data.col * 275)

    const img = await loadImage(`${imgURL}/dogtag.png`)
    const dogTag_w = 275
    const dogTag_h = 125
    const dogTag_x_offset = 30
    const dogTag_y_offset = 30
    ctx.drawImage(
        img,
        col_pos - dogTag_x_offset,
        row_pos - dogTag_y_offset,
        dogTag_w,
        dogTag_h);

    createTitle(ctx, data, row_pos, col_pos)
    data.stats.forEach((s, i) => {
        createLeaderboard(ctx, s, i, row_pos, col_pos)
    })

}

const createTitle = (ctx, data, row_pos, col_pos) => {
    ctx.font = 'bold 20px Courier New'
    ctx.fillStyle = "black";

    var adj_row_pos = row_pos + 0
    var adj_col_pos = col_pos + 0

    ctx.fillText(data.stat, adj_col_pos, adj_row_pos)
}

const createLeaderboard = (ctx, data, index, row_pos, col_pos) => {
    ctx.font = 'bold 18px Courier New'
    ctx.fillStyle = "black";

    var namePadding = 5
    var nameSpacing = 20
    var name_x_pos = col_pos + 0; // add to here for indentation of names
    var value_x_pos = name_x_pos + 150
    var y_offset = row_pos + namePadding + (nameSpacing * (index + 1))

    ctx.fillText(textCheck(data.name), name_x_pos, y_offset)
    ctx.fillText(textCheck(data.value), value_x_pos, y_offset)
}

const addIssueNumber = (ctx, canvas) => {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "white";
    ctx.font = 'bold 12px Courier New'
    var d = new Date()
    var issueId = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()].join(" . ")
    ctx.fillText(issueId, 15, canvas.height - 15)
    ctx.globalAlpha = 1;
}

const textCheck = (text) => {
    const maxCharacters = 13
    if (text.length > maxCharacters) {
        return text.substring(0, 10).concat('...')
    }
    return text
}

const latestHistory = (data) => {
    data.forEach(d => {
        d.history = d.history.sort((a, b) => {
            return b.ts - a.ts
        })[0]
    })
    return data;
}

const getAllBoardStats = (data) => {
    var boards = [{
        stat: "KILLS",
        stats: getStatsReversed(
            data,
            3,
            ["kills"],
            false,
            false
        ),
        row: null,
        col: null
    },
    // {
    //     stat: "DAILY KILLS",
    //     stats: getStatsReversed(
    //         data,
    //         3,
    //         ["dailyKills"],
    //         false,
    //         false
    //     ),
    //     row: null,
    //     col: null
    // },
    {
        stat: "WINS",
        stats: getStatsReversed(
            data,
            3,
            ["wins"],
            false,
            false
        ),
        row: null,
        col: null
    },
    // {
    //     stat: "DAILY WINS",
    //     stats: getStatsReversed(
    //         data,
    //         3,
    //         ["dailyWins"],
    //         false,
    //         false
    //     ),
    //     row: null,
    //     col: null
    // },
    {
        stat: "AVG. DAMAGE",
        stats: getAvgStatsReversed(
            data,
            3,
            ["damageDealt", "roundsPlayed"],
            false,
            false

        ),
        row: null,
        col: null
    }, {
        stat: "LONGEST KILL",
        stats: getStatsReversed(
            data,
            3,
            ["longestKill"],
            true,
            false

        ),
        row: null,
        col: null
    },
    {
        stat: "DISTANCE TRAVELLED",
        stats: getStatsReversed(
            data,
            3,
            ["rideDistance", "swimDistance", "walkDistance"],
            false,
            true

        ),
        row: null,
        col: null
    },
    {
        stat: "VEHICLES DESTROYED",
        stats: getStatsReversed(
            data,
            3,
            ["vehicleDestroys"],
            false,
            false
        ),
        row: null,
        col: null
    }
    ]

    var currentRow = 0
    boards.forEach((b, i) => {
        b.col = i % columns
        b.row = currentRow
        currentRow += i % columns
        rows = currentRow
    })
    return boards
}

const getStatsReversed = (data, count, stats, metersFormatting, kmFormatting) => {
    return data.sort((a, b) => {
        return getValueAndFormat(b, stats) - getValueAndFormat(a, stats)
    })
        .slice(0, count)
        .map(s => ({
            name: s.name,
            value: getValueAndFormat(s, stats, metersFormatting, kmFormatting)
        }))
}

const getStats = (data, count, stats, metersFormatting, kmFormatting) => {
    return data.sort((a, b) => {
        return getValueAndFormat(a, stats) - getValueAndFormat(b, stats)
    })
        .slice(0, count)
        .map(s => ({
            name: s.name,
            value: getValueAndFormat(s, stats, metersFormatting, kmFormatting)
        }))
}

const getAvgStatsReversed = (data, count, stats, metersFormatting, kmFormatting) => {
    // stat[0] is for summing. stat[1] is to divide by e.g. stat[0]/stat[1]
    return data.sort((a, b) => {
        return getAvgValueAndFormat(b, stats) - getAvgValueAndFormat(a, stats)
    })
        .slice(0, count)
        .map(s => ({
            name: s.name,
            value: getAvgValueAndFormat(s, stats, metersFormatting, kmFormatting)
        }))
}

const getAvgValueAndFormat = (data, stats, metersFormatting, kmFormatting) => {
    var avg = data.history[stats[0]] / data.history[stats[1]]
    if (metersFormatting) {
        return avg.toString().split(".")[0] + "m"
    }
    if (kmFormatting) {
        return (avg / 1000).toString().split(".")[0] + "km"
    }
    return avg.toFixed(1)
}

const getValueAndFormat = (data, stats, metersFormatting, kmFormatting) => {
    var total = Number(stats.reduce((acc, stat) => acc += data.history[stat], 0))
    if (metersFormatting) {
        return total.toString().split(".")[0] + "m"
    }
    if (kmFormatting) {
        return (total / 1000).toString().split(".")[0] + "km"
    }
    return total
}
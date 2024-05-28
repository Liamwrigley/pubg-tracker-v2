const {
    createCanvas,
    loadImage,
    registerFont
} = require('canvas');
const fs = require('fs');
const moment = require('moment-timezone');

const sectionSizes = {
    header: {
        width: 900,
        height: 391
    },
    team: {
        width: 900,
        height: 313
    },
}
const fontSizes = {
    header: 21,
    body: 18
}
const fonts = {
    header: 'SairaBold',
    body: 'SairaRegular'
}
const lineHeight = 30;
const padding = 15;

registerFont('./assets/fonts/Saira_Bold.ttf', { family: 'SairaBold' });
registerFont('./assets/fonts/Saira_Light.ttf', { family: 'SairaLight' });
registerFont('./assets/fonts/Saira_Regular.ttf', { family: 'SairaRegular' });


const WriteFont = (ctx, text, x, y, font, size) => {
    ctx.font = `${size}px ${font}`;
    ctx.fillText(text, x, y);
    ctx.font = `${fontSizes.body}px ${fonts.body}`;
}

const GetImages = async () => {
    const images = {
        header: await loadImage('./assets/images/match/header.png'),
        teamMask: await loadImage('./assets/images/match/team-mask.png'),
        teamBg: await loadImage('./assets/images/match/team-image.png'),
    }

    return images;
}

const CreateCtx = (width, height) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";

    return { canvas, ctx };
}


const CreateMatchHistory = async (match) => {
    const images = await GetImages();

    const pass = {
        images,
        match
    }

    const header = CreateHeader(pass);
    //save header
    fs.writeFileSync('./assets/images/testoutputs/test_header.png', header);

    const teams = CreateTeam(pass);
    //save header
    fs.writeFileSync('./assets/images/testoutputs/test_teams.png', teams);

    // return canvas.toBuffer();
}

const HeaderItems = (ctx, match) => {
    const startX = 18;
    const startY = 100;
    const headerLineHeight = 35;
    const boxWidth = 254;

    // set because measureText needs to know what font & size
    ctx.font = `${fontSizes.header}px ${fonts.header}`;

    const X = (v) => startX + padding + v;
    const Y = (v) => startY + padding + (v * headerLineHeight);

    const RHS_X = (text, v) => sectionSizes.header.width - startX - padding - v - ctx.measureText(text).width
    const RHS_X_Center = (text, v) => sectionSizes.header.width - startX - (ctx.measureText(text).width / 2) - (boxWidth / 2)

    return [
        { text: `SEASON: ${match.seasonId}`, x: X(0), y: Y(0) },
        { text: `MAP: ${match.mapName}`, x: X(0), y: Y(1) },
        { text: `MODE: ${match.gameMode.charAt(0).toUpperCase() + match.gameMode.slice(1).toLowerCase()}`, x: X(0), y: Y(2) },
        { text: `TS: ${moment.unix(match.createdAt).tz('Australia/Sydney').format('DD.MM.YY HHmm')}`, x: X(0), y: Y(3) },
        { text: `LOBBY`, x: RHS_X_Center(`LOBBY`, 0), y: Y(0) },
        { text: `Bots: ${match.aiParticipantsCount} | Humans: ${match.humanParticipantsCount}`, x: RHS_X_Center(`Bots: ${match.aiParticipantsCount} | Humans: ${match.humanParticipantsCount}`, 0), y: Y(1) },
        { text: `TRACKED`, x: RHS_X_Center(`TRACKED`, 0), y: Y(2) },
        {
            text: `${match.matchingPlayerCount} ${match.matchingPlayerCount > 1 ? 'players' : 'player'} in ${match.teams.length} ${match.length > 1 ? 'teams' : 'team'}`,
            x: RHS_X_Center(`${match.matchingPlayerCount} ${match.matchingPlayerCount > 1 ? 'players' : 'player'} in ${match.teams.length} ${match.length > 1 ? 'teams' : 'team'}`, 0),
            y: Y(3)
        },
    ]
}

const CreateHeader = ({ images, match }) => {

    const { canvas, ctx } = CreateCtx(sectionSizes.header.width, sectionSizes.header.height)

    ctx.drawImage(images.header, 0, 0, sectionSizes.header.width, sectionSizes.header.height);

    HeaderItems(ctx, match).forEach(item => {
        WriteFont(ctx, item.text, item.x, item.y, fonts.header, fontSizes.header);
    })

    // WriteFont(ctx, 'Match Header', 10, 10, fonts.header, fontSizes.header);

    // uncomment when we are sending to discord again
    // return canvas.toBuffer();
    return canvas.toBuffer('image/png');
}

const CreateTeam = ({ images, match }) => {
    const { canvas, ctx } = CreateCtx(sectionSizes.team.width, sectionSizes.team.height)

    ctx.drawImage(images.teamBg, 0, 0, sectionSizes.team.width, sectionSizes.team.height);
    ctx.drawImage(images.teamMask, 0, 0, sectionSizes.team.width, sectionSizes.team.height);

    WriteFont(ctx, 'Team Name', 10, 10, fonts.header, fontSizes.header);

    // uncomment when we are sending to discord again
    // return canvas.toBuffer();
    return canvas.toBuffer('image/png');

}



/*
Each match will contain multiple sections

section 1: match header
    This will contain header information about the match on the left side. It will have an image background with a transparent area to make the stats easier to read.
    - game mode
    - map
    - date
    - season

section 2: teams (could be multiple of these sections)
    Each team will have a section with the team name and a list of players on the right side. The players will be sorted by name. Each player will have a section with their stats.
    - team name & placement ( this will be in a heading for this section)
    - player name
        - kills
        - damage dealt
        - DBNOs
        - revives

section 3: footer
    This will basically just be a simple area that makes it easier to see the end of the match history. It will contain the match id and "Made by Mesiya".


*/

module.exports = {
    CreateMatchHistory
}
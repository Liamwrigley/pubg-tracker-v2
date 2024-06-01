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
    footer: {
        width: 900,
        height: 150
    }
}
const fontSizes = {
    header: (size = 21) => `normal 700 ${size}`,
    body: (size = 20) => `normal 400 ${size}`,
}
const fonts = {
    header: 'Saira',
    body: 'Saira',
}
const lineHeight = 30;
const padding = 15;

const RegisterFonts = () => {
    registerFont('./assets/fonts/Saira-Regular.ttf', { family: 'Saira', weight: '400' });
    registerFont('./assets/fonts/Saira-Bold.ttf', { family: 'Saira', weight: '700' });
}


const WriteFont = (ctx, text, x, y, font, size) => {
    ctx.font = `${size}px "${font}"`;
    ctx.fillText(text, x, y);
    ctx.font = `${fontSizes.body}px "${fonts.body}"`;
}

const GetImages = async () => {
    const images = {
        header: await loadImage('./assets/images/match/header.png'),
        teamMask: await loadImage('./assets/images/match/team-mask.png'),
        teamBg: await loadImage('./assets/images/match/team-image.png'),
        footer: await loadImage('./assets/images/match/footer.png')
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
    RegisterFonts();
    const images = await GetImages();

    const pass = {
        images,
        match
    }

    const header = CreateHeader(pass);
    const teams = CreateTeams(pass);
    const footer = CreateFooter(pass);

    const totalHeight = sectionSizes.header.height + (sectionSizes.team.height * teams.length) + sectionSizes.footer.height;

    const { canvas: finalImage, ctx } = CreateCtx(sectionSizes.header.width, totalHeight);
    ctx.fillStyle = "white";

    let currentY = 0;

    // Draw header
    ctx.drawImage(header, 0, currentY);
    currentY += sectionSizes.header.height;

    // Draw teams
    teams.forEach((team) => {
        ctx.drawImage(team, 0, currentY);
        currentY += sectionSizes.team.height;
    });

    // Draw footer
    ctx.drawImage(footer, 0, currentY);

    return {
        header: header.toBuffer(),
        teams: teams.map(t => t.toBuffer()),
        footer: footer.toBuffer(),
        finalImage: finalImage.toBuffer()
    };
}

const HeaderItems = (ctx, match) => {
    const startX = 18;
    const startY = 100;
    const headerLineHeight = 35;
    const boxWidth = 254;

    // set because measureText needs to know what font & size
    ctx.font = `${fontSizes.header()}px ${fonts.header}`;

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
        WriteFont(ctx, item.text, item.x, item.y, fonts.header, fontSizes.header());
    })

    return canvas;
}

const TeamItems = (ctx, team) => {
    const startX = 25;
    const startY = 35;
    const headerLineHeight = 35;
    const cellWidth = ((sectionSizes.team.width - (startX * 2) - (padding * 2)) / 6);
    const cellPadding = 15;
    const maxCellWidth = cellWidth - (cellPadding * 2);

    const trunc = (text) => ctx.measureText(text).width > maxCellWidth ? `${text.substring(0, 10)}...` : text;

    const X = (v) => startX + padding + v;
    const Y = (v) => startY + padding + (v * headerLineHeight);

    const RHS_X = (text, v) => sectionSizes.team.width - startX - padding - v - ctx.measureText(text).width

    // set because measureText needs to know what font & size
    ctx.font = `${fontSizes.header()}px ${fonts.header}`;

    var teamData = [
        { text: `TEAM ${team.teamName}`, x: X(0), y: Y(0), fw: fontSizes.header(), font: fonts.header },
    ]

    ctx.font = `${fontSizes.header(30)}px ${fonts.header}`;
    teamData.push({
        text: `#${team.winPlace}`, x: RHS_X(`#${team.winPlace}`, -10), y: Y(0) + 3, fw: fontSizes.header(30), font: fonts.header
    })

    const tableStartY = 35;
    const tableY = (v) => tableStartY + Y(v);
    const tableX = (v) => startX + padding + (cellWidth * v)
    const tableX_RHS = (text, v) => startX + padding + (cellWidth * v) + cellWidth - ctx.measureText(text).width

    ctx.font = `${fontSizes.body()}px ${fonts.body}`;

    teamData.push(
        { text: ``, x: tableX(0), y: tableY(0), fw: fontSizes.body(), font: fonts.body },
        { text: `KILLS`, x: tableX_RHS(`KILLS`, 1), y: tableY(0), fw: fontSizes.body(), font: fonts.body },
        { text: `DAMAGE`, x: tableX_RHS(`DAMAGE`, 2), y: tableY(0), fw: fontSizes.body(), font: fonts.body },
        { text: `DBNO`, x: tableX_RHS(`DBNO`, 3), y: tableY(0), fw: fontSizes.body(), font: fonts.body },
        { text: `REVIVES`, x: tableX_RHS(`REVIVES`, 4), y: tableY(0), fw: fontSizes.body(), font: fonts.body },
    )

    const buildPlayer = (y, player) => {
        return [
            { text: `${trunc(player.name)}`, x: tableX(0), y: tableY(y), fw: fontSizes.body(), font: fonts.body },
            { text: `${player.kills}`, x: tableX_RHS(`${player.kills}`, 1), y: tableY(y), fw: fontSizes.body(), font: fonts.body },
            { text: `${player.damageDealt.toFixed(0)}`, x: tableX_RHS(`${player.damageDealt.toFixed(0)}`, 2), y: tableY(y), fw: fontSizes.body(), font: fonts.body },
            { text: `${player.DBNOs}`, x: tableX_RHS(`${player.DBNOs}`, 3), y: tableY(y), fw: fontSizes.body(), font: fonts.body },
            { text: `${player.revives}`, x: tableX_RHS(`${player.revives}`, 4), y: tableY(y), fw: fontSizes.body(), font: fonts.body },
        ]
    }

    team.players.forEach((player, i) => {
        teamData.push(...buildPlayer(i + 1, player))
    })

    return teamData;
}

const CreateTeams = ({ images, match }) => {
    const teams = [];
    match.teams.sort((a, b) => a.winPlace - b.winPlace).forEach((team) => {
        teams.push(CreateTeam(images, team));
    })
    return teams;
}

const CreateTeam = (images, team) => {
    const { canvas, ctx } = CreateCtx(sectionSizes.team.width, sectionSizes.team.height)

    ctx.drawImage(images.teamBg, 0, 0, sectionSizes.team.width, sectionSizes.team.height);
    ctx.drawImage(images.teamMask, 0, 0, sectionSizes.team.width, sectionSizes.team.height);

    ctx.fillStyle = "white";
    TeamItems(ctx, team).forEach(item => {
        WriteFont(ctx, item.text, item.x, item.y, item.font, item.fw);
    })

    return canvas;
}

const CreateFooter = ({ images, match }) => {

    const { canvas, ctx } = CreateCtx(sectionSizes.footer.width, sectionSizes.footer.height + 50)

    ctx.drawImage(images.footer, 0, 0, sectionSizes.footer.width, sectionSizes.footer.height);

    return canvas;
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
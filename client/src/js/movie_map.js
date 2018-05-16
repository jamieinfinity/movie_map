import {select} from "d3-selection";
import {json, tsv} from "d3-request";


const romanNums = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V'};

function groupByScene(prev, cur) {
    let result = prev, key = cur.scene;
    if (key in prev) {
        result[key].push(cur);
    } else {
        result[key] = [cur];
    }
    return result;
}

function makeTabRowData(d) {
    return '<tr style="color:#fff" class="tr_data">' +
        '<td class="td_data"' + '><b>' + d.number + '</b></td>' +
        '<td class="td_data"' + '>' + '0:00' + '</td>' +
        '<td class="td_data" align="right"' + '>' + '20 mins' + '</td>' +
        '</tr>';
}

function makeTabRowTitle(title) {
    return '<tr style="color:#fff" class="tr_title">' +
        '<td colspan="4" class="td_title"' + '>' + title + '</td>' +
        '</tr>';
}

function buildApp(domElementID) {

    let actTitles = {}, actNumbers = {}, sceneTitles = {}, sceneNumbers = {}, shotGrid = [], groupedShots,
        numActs, numScenes, maxNumShots, prevAct, actAdjustment;

    tsv('./film_data/acts.tsv', function (error, dataActs) {
        dataActs.forEach(function (d, i) {
            actTitles[d.act] = d.title;
            actNumbers[d.act] = romanNums[i+1];
        });
        numActs = Object.keys(actTitles).length;

        tsv('./film_data/scenes.tsv', function (error, dataScenes) {
            dataScenes.forEach(function (d, i) {
                sceneTitles[d.scene] = d.title;
                sceneNumbers[d.scene] = i+1;
            });
            numScenes = Object.keys(sceneTitles).length;

            json("./film_data/shots.json", function (dataShots) {

                groupedShots = dataShots.reduce(function (prev, cur) {
                    return groupByScene(prev, cur);
                }, {});
                groupedShots = Object.keys(groupedShots).map(function (key) {
                    return groupedShots[key];
                });
                maxNumShots = Math.max(...groupedShots.map(function (d) {
                    return Number(d.length);
                }));

                for (let i = 0; i < (numActs + numScenes) * (maxNumShots + 1); i++) {
                    shotGrid.push({
                        "class": "blank"
                    });
                }

                prevAct = "";
                actAdjustment = 0;
                for (let i = 0; i < numScenes; i++) {
                    let shots = groupedShots[i],
                        shotInfo = shots[0],
                        shotCell;
                    if (shotInfo.act !== prevAct) {
                        prevAct = shotInfo.act;
                        shotCell = shotGrid[(i + actAdjustment) * (maxNumShots + 1)];
                        shotCell["class"] = "act";
                        shotCell["title"] = actTitles[shotInfo.act];
                        shotCell["number"] = actNumbers[shotInfo.act];
                        actAdjustment += 1;
                    }
                    shotCell = shotGrid[(i + actAdjustment) * (maxNumShots + 1)];
                    shotCell["class"] = "scene";
                    shotCell["title"] = sceneTitles[shotInfo.scene];
                    shotCell["number"] = sceneNumbers[shotInfo.scene];
                    for (let j = 0; j < shots.length; j++) {
                        shotInfo = shots[j];
                        shotCell = shotGrid[(i + actAdjustment) * (maxNumShots + 1) + j + 1];
                        shotCell["class"] = "shot";
                        shotCell["imageId"] = shotInfo.frames[0];
                    }
                }

                let grid = select(domElementID).append("div").attr("id", "grid").attr("class", "grid"),
                    cells = grid.selectAll("div").data(shotGrid).enter().append("div").attr("class", function (d) {
                        return "cell " + d.class;
                    });

                grid.style("grid-template-columns", "270px repeat(" + maxNumShots + ", 90px)")
                    .style("grid-template-rows", "repeat(" + (numActs + numScenes) + ", 45px)");

                cells.style("background-image", function (d) {
                    return (d.class === "shot") ? 'url("./film_data/shot_images/shotImageSM_' + (d.imageId) + '.jpeg")' : '';
                });

                grid.selectAll("div.act")
                    .html(d => (
                        '<table class="movie_table">' +
                        '<col width="7%">' +
                        '<col width="60%">' +
                            makeTabRowData(d) +
                            makeTabRowTitle(d.title) +
                        '</table>')
                    );

            });

        });
    });


}


export {buildApp};
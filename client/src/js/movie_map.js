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

function makeTabRowData(d, color) {
    return '<tr style="color:' + color + '" class="tr_data">' +
        '<td class="td_data"' + '><b>' + d.number + '</b></td>' +
        '<td class="td_data"' + '>' + '0:00' + '</td>' +
        '<td class="td_data" align="right"' + '>' + '20 mins' + '</td>' +
        '</tr>';
}

function makeTabRowTitle(title, color) {
    return '<tr style="color:' + color + '" class="tr_title">' +
        '<td colspan="4" class="td_title"' + '>' + title + '</td>' +
        '</tr>';
}

function buildApp(domElementID) {

    let actTitles = {}, actNumbers = {}, sceneTitles = {}, sceneNumbers = {}, tableData = [], groupedShots,
        numScenes, maxNumShots, prevAct, rowIndex, selectedRow = -1;

    tsv('./film_data/acts.tsv', function (error, dataActs) {
        dataActs.forEach(function (d, i) {
            actTitles[d.act] = d.title;
            actNumbers[d.act] = romanNums[i + 1];
        });
        // numActs = Object.keys(actTitles).length;

        tsv('./film_data/scenes.tsv', function (error, dataScenes) {
            dataScenes.forEach(function (d, i) {
                sceneTitles[d.scene] = d.title;
                sceneNumbers[d.scene] = i + 1;
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

                prevAct = "";
                rowIndex = 0;
                for (let i = 0; i < numScenes; i++) {
                    let shots = groupedShots[i],
                        shotInfo = shots[0],
                        sceneRow = [],
                        shotCell;
                    if (shotInfo.act !== prevAct) {
                        prevAct = shotInfo.act;
                        let actRow = [];
                        for (let i = 0; i < (2 * maxNumShots + 1); i++) {
                            actRow.push({
                                "class": "blank",
                                "imageId": ""
                            });
                        }
                        tableData.push(actRow);
                        shotCell = tableData[rowIndex][0];
                        shotCell["class"] = "act";
                        shotCell["title"] = actTitles[shotInfo.act];
                        shotCell["number"] = actNumbers[shotInfo.act];
                        shotCell["row"] = rowIndex;
                        rowIndex += 1;
                    }
                    shotCell = {"class": "scene", "imageId": ""};
                    shotCell["title"] = sceneTitles[shotInfo.scene];
                    shotCell["number"] = sceneNumbers[shotInfo.scene];
                    shotCell["row"] = rowIndex;
                    sceneRow.push(shotCell);
                    for (let j = 0; j < shots.length; j++) {
                        shotInfo = shots[j];
                        shotCell = {"class": "shot"};
                        shotCell["imageId"] = shotInfo.frames[0];
                        shotCell["row"] = rowIndex;
                        sceneRow.push(shotCell);
                    }
                    tableData.push(sceneRow);
                    rowIndex += 1;
                }

                let table = select(domElementID).append("table").attr("class", "movie_table").style("width", (2 * maxNumShots * (90 + 1) + 225) + "px"),
                    rows = table.selectAll("tr").data(tableData).enter().append("tr").attr("class", "movie_row"),
                    cells = rows.selectAll("td").data(function (row) {
                        return row;
                    }).enter().append("td").attr("class", function (d) {
                        return "movie_cell " + d.class;
                    });

                cells.style("background-image", function (d) {
                    if (d.imageId === "") {
                        return "";
                    }
                    return d.row === 10 ?
                        'url("./film_data/shot_images/shotImageMED_' + (d.imageId) + '.jpeg")' :
                        'url("./film_data/shot_images/shotImageSM_' + (d.imageId) + '.jpeg")';
                }).style("width", function (d) {
                    if (d.class === "act" || d.class === "scene") {
                        return "225px";
                    }
                    return d.row === selectedRow ? "181px" : "90px";
                }).style("height", function (d) {
                    return d.row === selectedRow ? "180px" : "45px";
                }).style("background-size", function (d) {
                    return d.row === selectedRow ? "181px 90px" : "90px 45px";
                }).attr("colspan", function (d) {
                    if (d.class === "act" || d.class === "scene") {
                        return "1";
                    }
                    return d.row === selectedRow ? "2" : "1";
                });

                // let grid = select(domElementID).append("div").attr("id", "grid").attr("class", "grid"),
                //     cells = grid.selectAll("div").data(shotGrid).enter().append("div").attr("class", function (d) {
                //         return "cell " + d.class;
                //     });
                //
                // grid.style("grid-template-columns", "270px repeat(" + maxNumShots + ", 90px)")
                //     .style("grid-template-rows", "repeat(" + (numActs + numScenes) + ", 45px)");
                //
                // cells.style("background-image", function (d) {
                //     return (d.class === "shot") ? 'url("./film_data/shot_images/shotImageSM_' + (d.imageId) + '.jpeg")' : '';
                // });
                //
                table.selectAll("td.act")
                    .html(d => (
                        '<table class="table_data">' +
                        '<col width="7%">' +
                        '<col width="60%">' +
                        makeTabRowData(d, "#fff") +
                        makeTabRowTitle(d.title, "#fff") +
                        '</table>')
                    );

                table.selectAll("td.scene")
                    .html(d => (
                        '<table class="table_data">' +
                        '<col width="7%">' +
                        '<col width="60%">' +
                        makeTabRowData(d, "#777") +
                        makeTabRowTitle(d.title, "#777") +
                        '</table>')
                    );

            });

        });
    });


}


export {buildApp};
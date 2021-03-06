import {select} from "d3-selection";
import {json} from "d3-request";


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
        '<td class="td_data"' + '>' + d.startTime + '</td>' +
        '<td class="td_data" align="right"' + '>' + d.duration + '</td>' +
        '<td class="td_data_button" align="center"' + '>' + '+' + '</td>' +
        '</tr>';
}

function makeTabRowTitle(title, color) {
    return '<tr style="color:' + color + '" class="tr_title">' +
        '<td colspan="4" class="td_title"' + '>' + title + '</td>' +
        '</tr>';
}

function buildApp(domElementID) {

    let actTitles = {}, actNumbers = {}, actStarts = {}, actDurations = {},
        sceneTitles = {}, sceneNumbers = {}, sceneStarts = {}, sceneDurations = {},
        tableData = [], groupedShots,
        numScenes, maxNumShots, prevAct, rowIndex;

    json('./film_data/acts.json', function (error, dataActs) {
        dataActs.forEach(function (d, i) {
            actTitles[d.id] = d.title;
            actNumbers[d.id] = romanNums[i + 1];
            actStarts[d.id] = d.startFormatted;
            actDurations[d.id] = d.durationFormatted;
        });
        // numActs = Object.keys(actTitles).length;

        json('./film_data/scenes.json', function (error, dataScenes) {
            dataScenes.forEach(function (d, i) {
                sceneTitles[d.id] = d.title;
                sceneNumbers[d.id] = i + 1;
                sceneStarts[d.id] = d.startFormatted;
                sceneDurations[d.id] = d.durationFormatted;
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
                        shotCell["startTime"] = actStarts[shotInfo.act];
                        shotCell["duration"] = actDurations[shotInfo.act];
                        shotCell["row"] = rowIndex;
                        rowIndex += 1;
                    }
                    shotCell = {"class": "scene", "imageId": ""};
                    shotCell["title"] = sceneTitles[shotInfo.scene];
                    shotCell["number"] = sceneNumbers[shotInfo.scene];
                    shotCell["startTime"] = sceneStarts[shotInfo.scene];
                    shotCell["duration"] = sceneDurations[shotInfo.scene];
                    shotCell["row"] = rowIndex;
                    sceneRow.push(shotCell);
                    for (let j = 0; j < shots.length; j++) {
                        shotInfo = shots[j];
                        shotCell = {"class": "shot"};
                        shotCell["imageId"] = shotInfo.frames[0];
                        shotCell["row"] = rowIndex;
                        shotCell["dialog"] = shotInfo.dialog;
                        sceneRow.push(shotCell);
                    }
                    tableData.push(sceneRow);
                    rowIndex += 1;
                }

                let table = select(domElementID).append("table").attr("class", "movie_table")
                        .style("width", (2 * maxNumShots * (90 + 1) + 225) + "px"),
                    rows = table.selectAll("tr").data(tableData).enter().append("tr").attr("class", "movie_row"),
                    cells = rows.selectAll("td").data(function (row) {
                        return row;
                    }).enter().append("td").attr("class", function (d) {
                        return "movie_cell " + d.class + " row_" + d.row;
                    });

                cells
                    .style("width", function (d) {
                        if (d.class === "act" || d.class === "scene") {
                            return "225px";
                        }
                        return "90px";
                    })
                    .style("height", "45px")
                    .attr("colspan", function (d) {
                        if (d.class === "act" || d.class === "scene") {
                            return "1";
                        }
                        return "1";
                    });

                table.selectAll("td.shot").append("div").attr("class", "shot_image")
                    .style("width", "90px")
                    .style("height", "45px")
                    .style("background-image", function (d) {
                        return 'url("./film_data/shot_images/shotImageSM_' + (d.imageId) + '.jpeg")';
                    })
                    .style("background-size", "90px 45px");

                table.selectAll("td.shot").append("div").attr("class", "shot_dialog");

                table.selectAll("td.act")
                    .html(d => (
                        '<table class="table_data">' +
                        '<col width="7%">' +
                        '<col width="65%">' +
                        '<col width="20%">' +
                        '<col width="8%">' +
                        makeTabRowData(d, "#fff") +
                        makeTabRowTitle(d.title, "#fff") +
                        '</table>')
                    );

                table.selectAll("td.scene")
                    .html(d => (
                        '<table class="table_data">' +
                        '<col width="7%">' +
                        '<col width="65%">' +
                        '<col width="20%">' +
                        '<col width="8%">' +
                        makeTabRowData(d, "#777") +
                        makeTabRowTitle(d.title, "#777") +
                        '</table>')
                    )
                    .on("click", function (sceneData) {
                        // this is pretty ugly, a violation of model/view separation by
                        // having state info stored in html element, but it works :o
                        let sceneCell = table.selectAll("td.scene.row_" + sceneData.row),
                            rowState = sceneCell.select("td.td_data_button").text(),
                            newState = (rowState === "+") ? "–" : "+",
                            hCell = (rowState === "+") ? "200px" : "45px",
                            hImage = (rowState === "+") ? "90px" : "45px",
                            hDialog = (rowState === "+") ? "110px" : "0",
                            w = (rowState === "+") ? "182px" : "90px",
                            cs = (rowState === "+") ? "2" : "1",
                            im = (rowState === "+") ? "MED" : "SM",
                            p = (rowState === "+") ? "3px" : "0px";

                        sceneCell.style("height", hCell);
                        table.selectAll("td.shot.row_" + sceneData.row)
                            .style("width", w)
                            .style("height", hCell)
                            .attr("colspan", cs);

                        table.selectAll("td.shot.row_" + sceneData.row + " div.shot_image")
                            .style("width", w)
                            .style("height", hImage)
                            .style("background-size", w + " " + hImage)
                            .style("background-image", function (d) {
                                return 'url("./film_data/shot_images/shotImage' + im + '_' + (d.imageId) + '.jpeg")';
                            });

                        table.selectAll("td.shot.row_" + sceneData.row + " div.shot_dialog")
                            .style("width", w)
                            .style("height", hDialog)
                            .style("padding-top", p)
                            .style("padding-bottom", p)
                            .style("text-align", "center")
                            .html(function(d) {
                                return rowState === "+" ? d.dialog.join('<br/>') : "";
                            });

                        sceneCell.select("td.td_data_button").text(newState);

                        sceneCell.select("table.table_data").style("height", "100%");
                    });

                table.selectAll("table.table_data").style("height", "45px");

            });

        });
    });


}


export {buildApp};
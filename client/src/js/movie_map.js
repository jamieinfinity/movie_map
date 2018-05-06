import {select} from "d3-selection";
import {json, tsv} from "d3-request";


/*
TODO:
- write ETL code to process movie data:
    - into an array of (max_num_shots + 2) x num_scenes = (51+2) x 157
    - the first column contains act info (e.g. title): only 4 rows have actual data; the rest are nulls (or some such)
    - the second column contains scene info (e.g. title): every row has data
    - the remaining columns contain info for each shot, up to a max of 51 shots. If there are less the 51 shots, fill
    in the empty columns with nulls (or some such). Those columns will appear empty.
    - eventually, you can add data like scene length, shot length, etc
    - eventually you can add tooltips that display full image(s)
    - eventually you can make selecting a row cause that row to expand:
        - increase in size (MED image)
        - add another row to display the dialog
*/

function groupByScene(prev, cur) {
    let result = prev, key = cur.scene;
    if (key in prev) {
        result[key].push(cur);
    } else {
        result[key] = [cur];
    }
    return result;
}

function buildApp(domElementID) {

    let actTitles = {}, sceneTitles = {}, shotGrid = [], groupedShots,
        numScenes, maxNumShots;

    tsv('./film_data/acts.tsv', function (error, dataActs) {
        dataActs.forEach(function (d) {
            actTitles[d.act] = d.title;
        });

        tsv('./film_data/scenes.tsv', function (error, dataScenes) {
            dataScenes.forEach(function (d) {
                sceneTitles[d.scene] = d.title;
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

                for (let i = 0; i < numScenes * (maxNumShots+2); i++) {
                    shotGrid.push({
                        "class": "blank"
                    });
                }

                for (let i = 0; i < numScenes; i++) {
                    let shots = groupedShots[i],
                        shotInfo = shots[0],
                        shotCell = shotGrid[i*(maxNumShots+2)];
                    shotCell["class"] = "act";
                    shotCell["title"] = actTitles[shotInfo.act];
                    shotCell = shotGrid[i*(maxNumShots+2)+1];
                    shotCell["class"] = "scene";
                    shotCell["title"] = sceneTitles[shotInfo.scene];
                    for (let j = 0; j<shots.length; j++) {
                        shotInfo=shots[j];
                        shotCell = shotGrid[i*(maxNumShots+2) + j + 2];
                        shotCell["class"] = "shot";
                        shotCell["imageId"] = shotInfo.frames[0];
                    }
                }

                let grid = select(domElementID).append("div").attr("id", "grid").attr("class", "grid"),
                    cells = grid.selectAll("div").data(shotGrid).enter().append("div").
                    attr("class", function(d) {
                        return "cell " + d.class;
                    });

                grid.style("grid-template-columns", "180px 270px repeat(" + maxNumShots + ", 90px)")
                    .style("grid-template-rows", "repeat(" + numScenes + ", 45px)");

                cells.style("background-image", function (d) {
                    return (d.class==="shot") ? 'url("./film_data/shot_images/shotImageSM_' + (d.imageId) + '.jpeg")' : '';
                });

            });

        });
    });


}


export {buildApp};